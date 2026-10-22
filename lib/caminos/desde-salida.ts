import type { Position } from "geojson";
import { exito, falla, type Resultado } from "@/lib/datos/resultado";
import { distanciasAcumuladas, largoDeLinea, puntoEnDistancia, tramoDeLinea, ubicarEnLinea } from "@/lib/caminos/geometria";

/**
 * Caminos desde una salida: la línea del GPS de una salida como borrador, para
 * ver por dónde fue sobre Caminos que ya existen y convertir en Caminos nuevos
 * los pedazos que no coinciden con ninguno (decisión 077).
 *
 * **La app propone, el usuario decide.** Nada de esto guarda ni confirma: dice
 * qué parte parece ir sobre qué Camino, y el usuario corta, corrige, descarta
 * y elige. Un Camino existente nunca se toca desde acá.
 *
 * Sin nada de pantalla ni de base, para poder probarlo entero.
 */

/**
 * Cuánto se puede separar el GPS de un Camino y seguir yendo «sobre» él.
 * Medido con la salida Challenger-Reducción-San Fernando: 9 de cada 10
 * puntos quedaron a menos de 12 m del Camino, y con 15 a 40 m el resultado
 * fue el mismo. Elegido por Ale.
 */
export const ANCHO_DEL_PASILLO_M = 20;
/** Menos que esto junto a un Camino es cruzarlo o tocarlo, no ir por él. */
export const LARGO_MINIMO_SOBRE_UN_CAMINO_M = 100;
/** Si el GPS se escapa del pasillo menos que esto y vuelve, es ruido. */
export const HUECO_PERDONADO_M = 40;
/** Cada cuánto se mira la línea para compararla. */
const PASO_DE_COMPARACION_M = 5;
/** Achicar la línea no la corre más que esto: la forma queda igual. */
export const TOLERANCIA_AL_ACHICAR_M = 3;
/**
 * Hasta dónde se busca un Camino para pegarle una punta. Las partes se cortan
 * justo en el borde del pasillo, así que una punta que sale de un Camino queda
 * a unos 20 m de él: con el pasillo solo, a veces se ofrecía y a veces no.
 */
export const RADIO_PARA_PEGAR_M = 2 * ANCHO_DEL_PASILLO_M;
/** No se corta tan cerca de una punta: quedaría un pedazo que no sirve. */
export const LARGO_MINIMO_DE_PEDAZO_M = 10;

export type CaminoParaComparar = { id: number; nombre: string; coordenadas: Position[] };
export type SobreUnCamino = { id: number; nombre: string };
export type ParteDelBorrador = { coordenadas: Position[]; sobre: SobreUnCamino | null };

// ---------------------------------------------------------------- achicar

function aMetros(origen: Position) {
  const escala = Math.cos((origen[1] * Math.PI) / 180);
  return (punto: Position): [number, number] => [
    (punto[0] - origen[0]) * 111_320 * escala,
    (punto[1] - origen[1]) * 110_540,
  ];
}

function alejamientoDeSegmento(p: [number, number], a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const divisor = dx * dx + dy * dy;
  const t = divisor === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / divisor));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/**
 * Deja solo los puntos que hacen falta para la forma: ninguno de los que se
 * sacan quedaba a más de `tolerancia` metros de la línea achicada. Un GPS
 * trae un punto por segundo y corregir dos mil a mano es imposible.
 */
export function achicarLinea(linea: Position[], toleranciaM = TOLERANCIA_AL_ACHICAR_M): Position[] {
  if (linea.length <= 2) return linea.map((punto) => [punto[0], punto[1]]);
  const plano = linea.map(aMetros(linea[0]));
  const conservar = new Array<boolean>(linea.length).fill(false);
  conservar[0] = true;
  conservar[linea.length - 1] = true;
  const pendientes: [number, number][] = [[0, linea.length - 1]];
  while (pendientes.length > 0) {
    const [desde, hasta] = pendientes.pop() as [number, number];
    let peor = -1;
    let alejamiento = 0;
    for (let i = desde + 1; i < hasta; i += 1) {
      const cuanto = alejamientoDeSegmento(plano[i], plano[desde], plano[hasta]);
      if (cuanto > alejamiento) { alejamiento = cuanto; peor = i; }
    }
    if (peor >= 0 && alejamiento > toleranciaM) {
      conservar[peor] = true;
      pendientes.push([desde, peor], [peor, hasta]);
    }
  }
  return linea.filter((_, i) => conservar[i]).map((punto) => [punto[0], punto[1]]);
}

// ---------------------------------------------------------------- comparar

type Caja = { oeste: number; este: number; sur: number; norte: number };

function cajaConMargen(coordenadas: Position[], margenM: number): Caja {
  const lats = coordenadas.map((punto) => punto[1]);
  const lons = coordenadas.map((punto) => punto[0]);
  const margenLat = margenM / 110_540;
  const latMedia = (Math.min(...lats) + Math.max(...lats)) / 2;
  const margenLon = margenM / (111_320 * Math.cos((latMedia * Math.PI) / 180));
  return {
    oeste: Math.min(...lons) - margenLon,
    este: Math.max(...lons) + margenLon,
    sur: Math.min(...lats) - margenLat,
    norte: Math.max(...lats) + margenLat,
  };
}

function adentro(caja: Caja, punto: Position): boolean {
  return punto[0] >= caja.oeste && punto[0] <= caja.este && punto[1] >= caja.sur && punto[1] <= caja.norte;
}

/** Cada cuántos metros de la línea, a qué Camino está más cerca dentro del pasillo (o a ninguno). */
function etiquetarLinea(linea: Position[], caminos: readonly CaminoParaComparar[]) {
  const largo = largoDeLinea(linea);
  const cercanos = caminos
    .filter((camino) => camino.coordenadas.length >= 2)
    .map((camino) => ({ camino, caja: cajaConMargen(camino.coordenadas, ANCHO_DEL_PASILLO_M) }));
  const muestras: { metros: number; camino: CaminoParaComparar | null }[] = [];
  for (let metros = 0; ; metros = Math.min(largo, metros + PASO_DE_COMPARACION_M)) {
    const punto = puntoEnDistancia(linea, metros);
    let mejor: { camino: CaminoParaComparar; alejamiento: number } | null = null;
    for (const { camino, caja } of cercanos) {
      if (!adentro(caja, punto)) continue;
      const lugar = ubicarEnLinea(camino.coordenadas, punto[0], punto[1]);
      if (lugar && lugar.alejamientoM <= ANCHO_DEL_PASILLO_M && (!mejor || lugar.alejamientoM < mejor.alejamiento)) {
        mejor = { camino, alejamiento: lugar.alejamientoM };
      }
    }
    muestras.push({ metros, camino: mejor?.camino ?? null });
    if (metros >= largo) break;
  }
  return muestras;
}

type Tramo = { desdeM: number; hastaM: number; camino: CaminoParaComparar | null };

function agruparEnTramos(muestras: ReturnType<typeof etiquetarLinea>): Tramo[] {
  const tramos: Tramo[] = [];
  for (const muestra of muestras) {
    const ultimo = tramos.at(-1);
    if (ultimo && ultimo.camino?.id === muestra.camino?.id) ultimo.hastaM = muestra.metros;
    else {
      if (ultimo) ultimo.hastaM = muestra.metros;
      tramos.push({ desdeM: muestra.metros, hastaM: muestra.metros, camino: muestra.camino });
    }
  }
  return tramos;
}

function juntarVecinos(tramos: Tramo[]): Tramo[] {
  const juntos: Tramo[] = [];
  for (const tramo of tramos) {
    const ultimo = juntos.at(-1);
    if (ultimo && ultimo.camino?.id === tramo.camino?.id) ultimo.hastaM = tramo.hastaM;
    else juntos.push({ ...tramo });
  }
  return juntos;
}

/**
 * Parte la línea del GPS en pedazos: los que van sobre un Camino que ya existe
 * y los que no coinciden con ninguno. Es una propuesta: el usuario la revisa.
 */
export function proponerPartes(linea: Position[], caminos: readonly CaminoParaComparar[]): ParteDelBorrador[] {
  if (linea.length < 2 || largoDeLinea(linea) === 0) return [];
  let tramos = agruparEnTramos(etiquetarLinea(linea, caminos));

  // Una escapada corta del pasillo entre dos pedazos del mismo Camino es ruido del GPS.
  tramos = juntarVecinos(tramos.map((tramo, i) => {
    const antes = tramos[i - 1];
    const despues = tramos[i + 1];
    const corto = tramo.hastaM - tramo.desdeM < HUECO_PERDONADO_M;
    return corto && tramo.camino === null && antes?.camino && antes.camino.id === despues?.camino?.id
      ? { ...tramo, camino: antes.camino }
      : tramo;
  }));
  // Ir junto a un Camino poco trecho es cruzarlo o tocarlo, no ir por él.
  tramos = juntarVecinos(tramos.map((tramo) =>
    tramo.camino && tramo.hastaM - tramo.desdeM < LARGO_MINIMO_SOBRE_UN_CAMINO_M ? { ...tramo, camino: null } : tramo));

  return tramos
    .filter((tramo) => tramo.hastaM > tramo.desdeM)
    .map((tramo) => ({
      coordenadas: tramoDeLinea(linea, tramo.desdeM, tramo.hastaM),
      sobre: tramo.camino ? { id: tramo.camino.id, nombre: tramo.camino.nombre } : null,
    }));
}

/**
 * Por dónde va una parte que el usuario ya cortó o corrigió: si más de la
 * mitad de su largo va dentro del pasillo de un mismo Camino, va sobre ese
 * Camino y no puede ser un Camino nuevo (sería uno repetido encima de otro).
 */
export function porDondeVa(
  linea: Position[],
  caminos: readonly CaminoParaComparar[],
): { sobre: SobreUnCamino; proporcion: number } | null {
  if (linea.length < 2 || largoDeLinea(linea) === 0) return null;
  const muestras = etiquetarLinea(linea, caminos);
  const cuantas = new Map<number, { camino: CaminoParaComparar; veces: number }>();
  for (const muestra of muestras) {
    if (!muestra.camino) continue;
    const anterior = cuantas.get(muestra.camino.id);
    cuantas.set(muestra.camino.id, { camino: muestra.camino, veces: (anterior?.veces ?? 0) + 1 });
  }
  const mayor = [...cuantas.values()].sort((a, b) => b.veces - a.veces)[0];
  if (!mayor) return null;
  const proporcion = mayor.veces / muestras.length;
  return proporcion > 0.5 ? { sobre: { id: mayor.camino.id, nombre: mayor.camino.nombre }, proporcion } : null;
}

// ---------------------------------------------------------------- cortar y pegar

/** Corta la línea donde se tocó: devuelve los dos pedazos. */
export function cortarLinea(linea: Position[], lon: number, lat: number): Resultado<[Position[], Position[]]> {
  const lugar = ubicarEnLinea(linea, lon, lat);
  if (!lugar) return falla("Tocá sobre la línea para cortarla.");
  const largo = largoDeLinea(linea);
  if (lugar.distanciaM < LARGO_MINIMO_DE_PEDAZO_M || largo - lugar.distanciaM < LARGO_MINIMO_DE_PEDAZO_M) {
    return falla("Ese lugar está muy cerca de una punta. Tocá un poco más adentro para cortar.");
  }
  return exito([tramoDeLinea(linea, 0, lugar.distanciaM), tramoDeLinea(linea, lugar.distanciaM, largo)]);
}

export type PuntaCercana = { camino: SobreUnCamino; coordenada: Position; distanciaM: number };

/**
 * El Camino que queda más cerca de una punta, si está a menos de
 * `RADIO_PARA_PEGAR_M`. Es
 * una propuesta para pegarla: así el Camino nuevo queda conectado.
 */
export function puntaCercana(
  linea: Position[],
  extremo: "inicio" | "final",
  caminos: readonly CaminoParaComparar[],
): PuntaCercana | null {
  const punta = extremo === "inicio" ? linea[0] : linea.at(-1);
  if (!punta) return null;
  let mejor: PuntaCercana | null = null;
  for (const camino of caminos) {
    if (camino.coordenadas.length < 2) continue;
    if (!adentro(cajaConMargen(camino.coordenadas, RADIO_PARA_PEGAR_M), punta)) continue;
    const lugar = ubicarEnLinea(camino.coordenadas, punta[0], punta[1]);
    if (lugar && lugar.alejamientoM <= RADIO_PARA_PEGAR_M && (!mejor || lugar.alejamientoM < mejor.distanciaM)) {
      mejor = { camino: { id: camino.id, nombre: camino.nombre }, coordenada: [lugar.coordenada[0], lugar.coordenada[1]], distanciaM: lugar.alejamientoM };
    }
  }
  return mejor;
}

/** La línea con una punta llevada a otro lugar. El resto no cambia. */
export function pegarPunta(linea: Position[], extremo: "inicio" | "final", coordenada: Position): Position[] {
  const copia = linea.map((punto) => [punto[0], punto[1]]);
  copia[extremo === "inicio" ? 0 : copia.length - 1] = [coordenada[0], coordenada[1]];
  return copia;
}

/** Largo de una línea, en metros, para mostrarlo. */
export function largoDeParte(linea: Position[]): number {
  return linea.length < 2 ? 0 : distanciasAcumuladas(linea).at(-1) ?? 0;
}
