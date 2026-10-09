import type { Position } from "geojson";
import { exito, falla, type Resultado } from "@/lib/datos/resultado";
import { largoDeLinea, puntoEnDistancia, ubicarEnLinea } from "@/lib/caminos/geometria";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import {
  alturaEnDistancia,
  CADA_CUANTO_SE_MIDE_M,
  desnivelesDe,
  medirAlturas,
  type FuenteDeAlturas,
  type PuntoDelPerfil,
} from "@/lib/alturas/perfil";
import type { TramoDelPerfil } from "@/lib/alturas/grafico";
import type { ParteDibujada } from "@/lib/circuitos/dibujo";

/**
 * Las alturas de un Circuito: su gráfico, su largo total y su desnivel.
 *
 * **No se guardan hechas.** Un Circuito toma partes de Caminos que se pueden
 * corregir o reclasificar sin que nadie toque el Circuito (decisiones 042 y
 * 047), así que todo se arma cada vez con lo vigente:
 *
 * - En una parte tomada de un Camino, las alturas salen del Camino, en el
 *   sentido en que el Circuito lo recorre. Al revés, lo que el Camino sube el
 *   Circuito lo baja.
 * - En una parte dibujada solo para el Circuito, salen de sus **alturas
 *   propias**, medidas con el relieve al guardar el Circuito.
 *
 * El desnivel se cuenta sobre la línea entera del Circuito, de principio a fin,
 * nunca sumando los números de cada Camino (decisión 049).
 *
 * Cuenta pura, sin pantalla ni conexión.
 */

/** Las alturas de una parte propia, medidas sobre su línea al guardar. */
export type AlturasDeParte = { cadaM: number; largoM: number; valores: number[] };

export type AlturasDelCircuito = {
  perfil: PuntoDelPerfil[];
  /** Los pedazos del gráfico con su color: los de Caminos, con su clasificación vigente. */
  tramos: TramoDelPerfil[];
  largoM: number;
  desnivelPositivoM: number;
  desnivelNegativoM: number;
};

// ---------------------------------------------------------------- al guardar

/** Mide las partes propias y deja `null` en las que vienen de un Camino. */
export async function medirAlturasPropias(
  partes: readonly ParteDibujada[],
  fuente: FuenteDeAlturas,
): Promise<Resultado<(AlturasDeParte | null)[]>> {
  const medidas: (AlturasDeParte | null)[] = [];
  for (const parte of partes) {
    if (parte.tipo !== "libre") {
      medidas.push(null);
      continue;
    }
    const alturas = await medirAlturas(parte.coordenadas, fuente);
    if (!alturas.ok) return alturas;
    medidas.push({ cadaM: alturas.datos.cadaM, largoM: largoDeLinea(parte.coordenadas), valores: alturas.datos.valores });
  }
  return exito(medidas);
}

export function alturasPropiasParaLaBase(medidas: (AlturasDeParte | null)[]): unknown[] {
  return medidas.map((cada) => cada ? { cada_m: cada.cadaM, largo_m: cada.largoM, valores: cada.valores } : null);
}

/** Lo que viene de la base. `null` si el Circuito se guardó antes de medirlas; `undefined` si llegaron rotas. */
export function leerAlturasPropias(valor: unknown, cantidadDePartes: number): (AlturasDeParte | null)[] | null | undefined {
  if (valor === null || valor === undefined) return null;
  if (!Array.isArray(valor) || valor.length !== cantidadDePartes) return undefined;
  const medidas: (AlturasDeParte | null)[] = [];
  for (const cada of valor) {
    if (cada === null) { medidas.push(null); continue; }
    if (typeof cada !== "object" || Array.isArray(cada)) return undefined;
    const { cada_m: cadaM, largo_m: largoM, valores } = cada as Record<string, unknown>;
    if (typeof cadaM !== "number" || !(cadaM > 0) || typeof largoM !== "number" || !(largoM > 0)) return undefined;
    if (!Array.isArray(valores) || valores.length < 2 || !valores.every((v) => typeof v === "number" && Number.isFinite(v))) return undefined;
    medidas.push({ cadaM, largoM, valores: valores as number[] });
  }
  return medidas;
}

// ---------------------------------------------------------------- al mostrar

/** Distancias donde se toma la altura dentro de una parte: cada 25 m y el final. */
function distanciasDentroDe(largoM: number): number[] {
  const distancias: number[] = [];
  for (let distancia = 0; distancia < largoM; distancia += CADA_CUANTO_SE_MIDE_M) distancias.push(distancia);
  distancias.push(largoM);
  return distancias;
}

/**
 * El perfil del Circuito con las partes vigentes y los Caminos como están hoy.
 * Si a alguna parte le faltan alturas, lo dice con el nombre de lo que falta.
 */
export function alturasDelCircuito(
  partes: readonly ParteDibujada[],
  caminos: readonly CaminoGuardado[],
  alturasPropias: readonly (AlturasDeParte | null)[] | null,
): Resultado<AlturasDelCircuito> {
  const porId = new Map(caminos.map((camino) => [camino.id, camino]));
  const perfil: PuntoDelPerfil[] = [];
  const tramos: TramoDelPerfil[] = [];
  let recorridoM = 0;

  for (const [indice, parte] of partes.entries()) {
    let largoM: number;
    let alturaEn: (distanciaM: number) => number;

    if (parte.tipo === "libre") {
      const propias = alturasPropias?.[indice] ?? null;
      if (!propias) {
        return falla("Faltan las alturas de las partes dibujadas solo para este Circuito. Abrilo con señal y guardalo de nuevo para calcularlas.");
      }
      largoM = largoDeLinea(parte.coordenadas);
      // Si una corrección de Camino movió una punta, la parte se estira o se
      // achica un poco: las alturas se reparten en proporción.
      alturaEn = (distanciaM) => alturaEnDistancia(propias, (distanciaM / largoM) * propias.largoM, propias.largoM);
      tramos.push({ desdeM: recorridoM, hastaM: recorridoM + largoM, estilo: "propio", paso: null });
    } else {
      const camino = parte.caminoId === null ? null : porId.get(parte.caminoId);
      if (!camino || parte.desdeM === null || parte.hastaM === null) {
        return falla("Falta un Camino que usa este Circuito. Poné la app al día con señal antes de salir.");
      }
      const alturasDelCamino = camino.alturas;
      if (!alturasDelCamino) {
        return falla(`Faltan las alturas del Camino «${camino.nombre}». Poné la app al día con señal para traerlas.`);
      }
      const desde = parte.desdeM;
      const hasta = parte.hastaM;
      const vuelta = parte.sentido === "vuelta";
      largoM = hasta - desde;
      alturaEn = (distanciaM) => alturaEnDistancia(alturasDelCamino, vuelta ? hasta - distanciaM : desde + distanciaM, camino.largoM);

      const actividad = parte.actividadDelCamino;
      const cruces = camino.partes.filter((cada) => cada.desdeM < hasta && cada.hastaM > desde);
      if (vuelta) cruces.reverse();
      for (const cada of cruces) {
        const a = Math.max(cada.desdeM, desde);
        const b = Math.min(cada.hastaM, hasta);
        const clasificacion = actividad ? cada.porActividad[actividad] : undefined;
        tramos.push({
          desdeM: recorridoM + (vuelta ? hasta - b : a - desde),
          hastaM: recorridoM + (vuelta ? hasta - a : b - desde),
          estilo: clasificacion?.complejidad ?? "sin_clasificar",
          paso: clasificacion?.paso ?? null,
        });
      }
    }

    for (const distancia of distanciasDentroDe(largoM)) {
      // El comienzo de una parte es el final de la anterior: no se repite.
      if (distancia === 0 && perfil.length > 0) continue;
      perfil.push({ distanciaM: recorridoM + distancia, alturaM: alturaEn(distancia) });
    }
    recorridoM += largoM;
  }

  if (perfil.length < 2) return falla("El Circuito no tiene línea suficiente para calcular sus alturas.");
  const { positivoM, negativoM } = desnivelesDe(perfil.map((punto) => punto.alturaM));
  return exito({ perfil, tramos, largoM: recorridoM, desnivelPositivoM: positivoM, desnivelNegativoM: negativoM });
}

/** Dónde cae una posición sobre el Circuito: a cuántos metros del comienzo y qué tan lejos de la línea. */
export function lugarEnElCircuito(
  partes: readonly ParteDibujada[],
  posicion: Position,
): { distanciaM: number; alejamientoM: number } | null {
  let mejor: { distanciaM: number; alejamientoM: number } | null = null;
  let recorridoM = 0;
  for (const parte of partes) {
    const largoM = parte.tipo === "libre" || parte.desdeM === null || parte.hastaM === null
      ? largoDeLinea(parte.coordenadas)
      : parte.hastaM - parte.desdeM;
    const lugar = parte.coordenadas.length >= 2 ? ubicarEnLinea(parte.coordenadas, posicion[0], posicion[1]) : null;
    if (lugar && (!mejor || lugar.alejamientoM < mejor.alejamientoM)) {
      mejor = { distanciaM: recorridoM + Math.min(lugar.distanciaM, largoM), alejamientoM: lugar.alejamientoM };
    }
    recorridoM += largoM;
  }
  return mejor;
}

/** Lo que falta desde un lugar hasta el final: distancia y desnivel en el sentido del Circuito. */
export function loQueFaltaDesde(
  alturas: AlturasDelCircuito,
  distanciaM: number,
): { metros: number; desnivelPositivoM: number; desnivelNegativoM: number } {
  const resto = alturas.perfil.filter((punto) => punto.distanciaM >= distanciaM);
  const { positivoM, negativoM } = desnivelesDe(resto.map((punto) => punto.alturaM));
  return { metros: Math.max(0, alturas.largoM - distanciaM), desnivelPositivoM: positivoM, desnivelNegativoM: negativoM };
}

/** El punto del Circuito que está a tantos metros del comienzo, para marcarlo en el mapa. */
export function puntoEnElCircuito(partes: readonly ParteDibujada[], distanciaM: number): Position | null {
  let recorridoM = 0;
  for (const parte of partes) {
    const largoM = largoDeLinea(parte.coordenadas);
    if (distanciaM <= recorridoM + largoM || parte === partes[partes.length - 1]) {
      return puntoEnDistancia(parte.coordenadas, Math.min(largoM, Math.max(0, distanciaM - recorridoM)));
    }
    recorridoM += largoM;
  }
  return null;
}
