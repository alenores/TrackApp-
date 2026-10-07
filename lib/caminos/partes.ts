import type { Position } from "geojson";
import { ACTIVIDADES_RUTA, type ActividadRuta } from "@/types/database";
import { exito, falla, type Resultado } from "@/lib/datos/resultado";
import { mostrarActividad } from "@/lib/rutas/actividades";
import {
  distanciasAcumuladas,
  esCoordenadaValida,
  largoDeLinea,
  tramoDeLinea,
  ubicarEnLinea,
  type LugarEnLaLinea,
} from "@/lib/caminos/geometria";

/**
 * Las partes de un Camino y su clasificación por actividad.
 *
 * Un Camino es **una sola línea** que sirve para una o más actividades. Esa
 * línea se divide en partes continuas, sin huecos ni superposiciones, medidas
 * en metros desde el comienzo. **Cada parte guarda, para cada actividad del
 * Camino, su condición de paso y su complejidad**: la misma parte puede ser
 * transitable en trekking y «a pie» en mountain bike (decisión 036).
 *
 * - Partir y clasificar nunca tocan la línea.
 * - Corregir la línea conserva el mismo Camino y las clasificaciones de sus
 *   partes. La condición y la complejidad se editan por separado (decisión 037).
 * - Un Camino no pertenece a ninguna zona ni sector (decisión 035).
 *
 * Cuenta pura, sin pantalla ni base. Las funciones reciben un Camino y
 * devuelven otro nuevo; nunca cambian el que recibieron. Si el Camino trae más
 * datos (su número, su nombre, quién lo subió), se conservan tal cual: corregir
 * o clasificar no lo convierte en otro.
 */

export const CONDICIONES_DE_PASO = ["por_explorar", "transitable", "a_pie", "sin_paso"] as const;
export type CondicionDePaso = (typeof CONDICIONES_DE_PASO)[number];

/** Sin clasificar no es una cuarta complejidad: es que todavía no se evaluó (`null`). */
export const COMPLEJIDADES_DE_PARTE = ["facil", "media", "dificil"] as const;
export type ComplejidadDeParte = (typeof COMPLEJIDADES_DE_PARTE)[number];

export type ClasificacionDeParte = {
  paso: CondicionDePaso;
  complejidad: ComplejidadDeParte | null;
};

/** Una clasificación por cada actividad del Camino, ni una más ni una menos. */
export type ClasificacionPorActividad = Partial<Record<ActividadRuta, ClasificacionDeParte>>;

export type ParteDeCamino = {
  desdeM: number;
  hastaM: number;
  porActividad: ClasificacionPorActividad;
  /** Datos compartidos por todas las actividades de esta parte. */
  observacion: string | null;
  comprobadoEl: string | null;
};

export type Camino = {
  /** Al menos una. Los mismos nombres de toda la app. */
  actividades: ActividadRuta[];
  /** La línea, `[longitud, latitud]` o con la altura como tercer número. */
  coordenadas: Position[];
  largoM: number;
  /** Ordenadas, de 0 a `largoM`, cada una empieza donde termina la anterior. */
  partes: ParteDeCamino[];
};

/**
 * Lo más corto que puede quedar una parte al partir. Un toque a menos de esto
 * de un borde que ya existe cae en ese borde: así no aparecen partes de
 * centímetros por tocar dos veces casi en el mismo lugar.
 */
export const LARGO_MINIMO_DE_PARTE_M = 2;

/** Diferencias menores que esto son redondeo, no metros de verdad. */
const REDONDEO_M = 1e-6;

/** Dos puntos son el mismo lugar si difieren menos que esto (un décimo de milímetro). */
const MISMO_LUGAR_GRADOS = 1e-9;

/** Cómo empieza cada actividad de una parte que nadie revisó: por explorar y sin complejidad. */
export function clasificacionInicial(): ClasificacionDeParte {
  return { paso: "por_explorar", complejidad: null };
}

function inicialPara(actividades: ActividadRuta[]): ClasificacionPorActividad {
  const porActividad: ClasificacionPorActividad = {};
  for (const actividad of actividades) porActividad[actividad] = clasificacionInicial();
  return porActividad;
}

function copiarClasificaciones(porActividad: ClasificacionPorActividad): ClasificacionPorActividad {
  const copia: ClasificacionPorActividad = {};
  for (const [actividad, clasificacion] of Object.entries(porActividad) as [ActividadRuta, ClasificacionDeParte][]) {
    copia[actividad] = { ...clasificacion };
  }
  return copia;
}

function nombreDe(actividad: ActividadRuta): string {
  return mostrarActividad(actividad).etiqueta;
}

/** Las actividades elegidas, sin repetir y en el orden en que se eligieron. */
function revisarActividades(actividades: readonly string[]): Resultado<ActividadRuta[]> {
  const elegidas: ActividadRuta[] = [];
  for (const actividad of actividades) {
    if (!(ACTIVIDADES_RUTA as readonly string[]).includes(actividad)) {
      return falla(`«${actividad}» no es una actividad de la app. Elegí entre Trekking, Correr, Mountain bike, Kayak y Canyoning.`);
    }
    if (!elegidas.includes(actividad as ActividadRuta)) elegidas.push(actividad as ActividadRuta);
  }
  if (elegidas.length === 0) return falla("Elegí al menos una actividad para este Camino.");
  return exito(elegidas);
}

function revisarLinea(coordenadas: Position[]): string | null {
  if (coordenadas.length < 2) return "La línea necesita al menos dos puntos.";
  if (!coordenadas.every(esCoordenadaValida)) return "La línea tiene puntos con coordenadas imposibles. Revisala antes de guardarla.";
  if (largoDeLinea(coordenadas) <= 0) return "Todos los puntos de la línea están en el mismo lugar: no se puede dibujar.";
  return null;
}

/**
 * Un Camino nuevo: una sola parte que cubre toda la línea, por explorar y sin
 * complejidad en cada actividad elegida.
 */
export function crearCamino(coordenadas: Position[], actividades: readonly string[]): Resultado<Camino> {
  const elegidas = revisarActividades(actividades);
  if (!elegidas.ok) return elegidas;
  const problema = revisarLinea(coordenadas);
  if (problema) return falla(problema);

  const largoM = largoDeLinea(coordenadas);
  return exito<Camino>({
    actividades: elegidas.datos,
    coordenadas: [...coordenadas],
    largoM,
    partes: [{
      desdeM: 0,
      hastaM: largoM,
      porActividad: inicialPara(elegidas.datos),
      observacion: null,
      comprobadoEl: null,
    }],
  });
}

// ---------------------------------------------------------------- partir

function fronteras(partes: ParteDeCamino[]): number[] {
  return [0, ...partes.map((parte) => parte.hastaM)];
}

/** Si el lugar cae a menos del largo mínimo de un borde que ya existe, se usa ese borde. */
function ajustarABorde(partes: ParteDeCamino[], distanciaM: number): number {
  let mejor = distanciaM;
  let cercania = LARGO_MINIMO_DE_PARTE_M;
  for (const borde of fronteras(partes)) {
    const diferencia = Math.abs(borde - distanciaM);
    if (diferencia < cercania) {
      cercania = diferencia;
      mejor = borde;
    }
  }
  return mejor;
}

/** Corta la parte que contiene ese lugar en dos, con la misma clasificación. */
function cortar(partes: ParteDeCamino[], distanciaM: number): ParteDeCamino[] {
  return partes.flatMap((parte) =>
    parte.desdeM < distanciaM && distanciaM < parte.hastaM
      ? [
          { ...parte, hastaM: distanciaM, porActividad: copiarClasificaciones(parte.porActividad) },
          { ...parte, desdeM: distanciaM, porActividad: copiarClasificaciones(parte.porActividad) },
        ]
      : [parte],
  );
}

type Particion = { partes: ParteDeCamino[]; desdeM: number; hastaM: number };

function partirInterno(camino: Camino, desdeM: number, hastaM: number): Resultado<Particion> {
  if (!Number.isFinite(desdeM) || !Number.isFinite(hastaM)) {
    return falla("No se pudo ubicar ese lugar sobre la línea. Elegilo de nuevo.");
  }
  const desde = Math.max(0, Math.min(camino.largoM, Math.min(desdeM, hastaM)));
  const hasta = Math.max(0, Math.min(camino.largoM, Math.max(desdeM, hastaM)));
  const comienzo = ajustarABorde(camino.partes, desde);
  const final = ajustarABorde(camino.partes, hasta);
  // Una parte que ya existe se puede elegir entera aunque mida menos que el
  // mínimo (puede quedar así al corregir la línea). Lo que no se permite es
  // cortar una parte nueva más corta que el mínimo.
  const bordes = fronteras(camino.partes);
  const sinCortes = bordes.includes(comienzo) && bordes.includes(final);
  if (final - comienzo <= REDONDEO_M || (!sinCortes && final - comienzo < LARGO_MINIMO_DE_PARTE_M)) {
    return falla(`Elegí dos lugares separados al menos ${LARGO_MINIMO_DE_PARTE_M} metros sobre la línea.`);
  }
  return exito<Particion>({
    partes: cortar(cortar(camino.partes, comienzo), final),
    desdeM: comienzo,
    hastaM: final,
  });
}

/**
 * Deja un borde de parte en cada uno de los dos lugares. Lo de adentro y lo de
 * afuera conservan la clasificación que tenían: partir no cambia nada más.
 */
export function partirEntre<T extends Camino>(camino: T, desdeM: number, hastaM: number): Resultado<T> {
  const particion = partirInterno(camino, desdeM, hastaM);
  if (!particion.ok) return particion;
  return exito<T>({ ...camino, partes: particion.datos.partes });
}

// ---------------------------------------------------------------- clasificar

export type CambioDeClasificacion = {
  paso?: CondicionDePaso;
  /** `null` vuelve a «sin clasificar». */
  complejidad?: ComplejidadDeParte | null;
};

/**
 * Cambia la condición de paso o la complejidad de una actividad entre dos
 * lugares. Si hace falta, parte primero. **No toca la línea ni las demás
 * actividades.**
 */
export function clasificarTramo<T extends Camino>(
  camino: T,
  desdeM: number,
  hastaM: number,
  actividad: ActividadRuta,
  cambio: CambioDeClasificacion,
): Resultado<T> {
  if (!camino.actividades.includes(actividad)) {
    return falla(`Este Camino no está marcado para ${nombreDe(actividad)}. Sumá esa actividad antes de clasificarla.`);
  }
  if (cambio.paso !== undefined && !CONDICIONES_DE_PASO.includes(cambio.paso)) {
    return falla("Esa condición de paso no existe. Elegí por explorar, transitable, a pie o sin paso.");
  }
  if (cambio.complejidad !== undefined && cambio.complejidad !== null && !COMPLEJIDADES_DE_PARTE.includes(cambio.complejidad)) {
    return falla("Esa complejidad no existe. Elegí fácil, media, difícil o sin clasificar.");
  }

  const particion = partirInterno(camino, desdeM, hastaM);
  if (!particion.ok) return particion;
  const { partes, desdeM: desde, hastaM: hasta } = particion.datos;

  return exito<T>({
    ...camino,
    partes: partes.map((parte) => {
      if (parte.desdeM < desde || parte.hastaM > hasta) return parte;
      const antes = parte.porActividad[actividad] ?? clasificacionInicial();
      return {
        ...parte,
        porActividad: {
          ...copiarClasificaciones(parte.porActividad),
          [actividad]: {
            paso: cambio.paso ?? antes.paso,
            complejidad: cambio.complejidad === undefined ? antes.complejidad : cambio.complejidad,
          },
        },
      };
    }),
  });
}

export type CambioDeDatosCompartidos = {
  observacion?: string | null;
  comprobadoEl?: string | null;
};

/**
 * Edita la observación y la fecha de una parte sin tocar la línea ni las
 * clasificaciones por actividad. Si la selección abarca varias partes, el
 * mismo dato se aplica a cada una de ellas.
 */
export function actualizarDatosDeTramo<T extends Camino>(
  camino: T,
  desdeM: number,
  hastaM: number,
  cambio: CambioDeDatosCompartidos,
): Resultado<T> {
  const particion = partirInterno(camino, desdeM, hastaM);
  if (!particion.ok) return particion;
  const { partes, desdeM: desde, hastaM: hasta } = particion.datos;
  return exito<T>({
    ...camino,
    partes: partes.map((parte) =>
      parte.desdeM >= desde && parte.hastaM <= hasta
        ? {
            ...parte,
            observacion: cambio.observacion === undefined ? parte.observacion : cambio.observacion,
            comprobadoEl: cambio.comprobadoEl === undefined ? parte.comprobadoEl : cambio.comprobadoEl,
          }
        : parte,
    ),
  });
}

/**
 * Cambia las actividades del Camino. Las que siguen conservan su
 * clasificación; las nuevas empiezan por explorar y sin complejidad en todas
 * las partes; las que se sacan se borran de todas las partes.
 */
export function cambiarActividades<T extends Camino>(camino: T, actividades: readonly string[]): Resultado<T> {
  const elegidas = revisarActividades(actividades);
  if (!elegidas.ok) return elegidas;
  return exito<T>({
    ...camino,
    actividades: elegidas.datos,
    partes: camino.partes.map((parte) => {
      const porActividad: ClasificacionPorActividad = {};
      for (const actividad of elegidas.datos) {
        const tenia = parte.porActividad[actividad];
        porActividad[actividad] = tenia ? { ...tenia } : clasificacionInicial();
      }
      return { ...parte, porActividad };
    }),
  });
}

// ---------------------------------------------------------------- corregir la línea

function mismoLugar(a: Position, b: Position): boolean {
  return Math.abs(a[0] - b[0]) < MISMO_LUGAR_GRADOS && Math.abs(a[1] - b[1]) < MISMO_LUGAR_GRADOS;
}

/**
 * Reemplaza la línea por una corregida, **sin convertirla en otro Camino**.
 *
 * Conserva la condición y la complejidad de todas las partes que siguen en la
 * línea. Los límites de la zona que cambió se adaptan proporcionalmente a su
 * nuevo largo; lo intacto del comienzo y del final mantiene sus límites
 * geográficos exactos. Si se agregó línea sin quitar nada, la parte vecina la
 * abarca. Solo desaparecen partes cuando se elimina por completo la línea que
 * ocupaban. Cambiar una clasificación es una acción separada.
 */
export function corregirLinea<T extends Camino>(camino: T, nuevasCoordenadas: Position[]): Resultado<T> {
  const problema = revisarLinea(nuevasCoordenadas);
  if (problema) return falla(problema);

  const nuevas = [...nuevasCoordenadas];
  const original = camino.coordenadas;
  const invertida =
    !mismoLugar(original[0], nuevas[0]) &&
    mismoLugar(original[0], nuevas[nuevas.length - 1]) &&
    mismoLugar(original[original.length - 1], nuevas[0]);
  const viejas = invertida ? [...original].reverse() : original;
  const partesViejas = invertida
    ? [...camino.partes].reverse().map((parte) => ({
        desdeM: camino.largoM - parte.hastaM,
        hastaM: camino.largoM - parte.desdeM,
        porActividad: copiarClasificaciones(parte.porActividad),
        observacion: parte.observacion,
        comprobadoEl: parte.comprobadoEl,
      }))
    : camino.partes;
  const n = viejas.length;
  const m = nuevas.length;
  const largoNuevo = largoDeLinea(nuevas);

  let iguales = 0;
  while (iguales < Math.min(n, m) && mismoLugar(viejas[iguales], nuevas[iguales])) iguales += 1;
  if (iguales === n && n === m) {
    const partes = partesViejas.map((parte, indice) => ({
      ...parte,
      hastaM: indice === partesViejas.length - 1 ? largoNuevo : parte.hastaM,
    }));
    return exito<T>({ ...camino, coordenadas: nuevas, largoM: largoNuevo, partes });
  }

  let igualesAlFinal = 0;
  const maximoAlFinal = Math.min(n, m) - iguales;
  while (igualesAlFinal < maximoAlFinal && mismoLugar(viejas[n - 1 - igualesAlFinal], nuevas[m - 1 - igualesAlFinal])) {
    igualesAlFinal += 1;
  }

  const acumuladasViejas = distanciasAcumuladas(viejas);
  const acumuladasNuevas = distanciasAcumuladas(nuevas);
  // Dónde termina lo intacto del comienzo y dónde empieza lo intacto del final.
  const finIntactoViejo = iguales > 0 ? acumuladasViejas[iguales - 1] : 0;
  const finIntactoNuevo = iguales > 0 ? acumuladasNuevas[iguales - 1] : 0;
  const inicioIntactoViejo = igualesAlFinal > 0 ? acumuladasViejas[n - igualesAlFinal] : camino.largoM;
  const inicioIntactoNuevo = igualesAlFinal > 0 ? acumuladasNuevas[m - igualesAlFinal] : largoNuevo;
  const corrimiento = inicioIntactoNuevo - inicioIntactoViejo;
  const tramoViejo = inicioIntactoViejo - finIntactoViejo;
  const tramoNuevo = inicioIntactoNuevo - finIntactoNuevo;

  function moverLimite(distanciaM: number): number {
    if (distanciaM <= 0) return 0;
    if (distanciaM >= camino.largoM) return largoNuevo;
    if (distanciaM <= finIntactoViejo) return distanciaM;
    if (distanciaM >= inicioIntactoViejo) return distanciaM + corrimiento;
    return tramoViejo <= REDONDEO_M
      ? finIntactoNuevo
      : finIntactoNuevo + ((distanciaM - finIntactoViejo) / tramoViejo) * tramoNuevo;
  }

  const limites = [0, ...partesViejas.map((parte) => parte.hastaM)].map(moverLimite);
  const partes = partesViejas.flatMap((parte, indice) => {
    const desdeM = limites[indice];
    const hastaM = limites[indice + 1];
    return hastaM - desdeM > REDONDEO_M
      ? [{
          desdeM,
          hastaM,
          porActividad: copiarClasificaciones(parte.porActividad),
          observacion: parte.observacion,
          comprobadoEl: parte.comprobadoEl,
        }]
      : [];
  });

  return exito<T>({ ...camino, coordenadas: nuevas, largoM: largoNuevo, partes });
}

// ---------------------------------------------------------------- consultar

/** La clasificación de una actividad en una parte; vacía si el Camino no sirve para esa actividad. */
export function clasificacionDe(parte: ParteDeCamino, actividad: ActividadRuta): ClasificacionDeParte | null {
  return parte.porActividad[actividad] ?? null;
}

export function sirvePara(camino: Camino, actividad: ActividadRuta): boolean {
  return camino.actividades.includes(actividad);
}

/** Qué parte está a tantos metros del comienzo. El final exacto es de la última. */
export function parteEn(camino: Camino, distanciaM: number): number | null {
  if (!Number.isFinite(distanciaM) || distanciaM < 0 || distanciaM > camino.largoM) return null;
  const indice = camino.partes.findIndex((parte) => distanciaM >= parte.desdeM && distanciaM < parte.hastaM);
  return indice >= 0 ? indice : camino.partes.length - 1;
}

/** El lugar del Camino más cercano a un toque. */
export function ubicarEnCamino(camino: Camino, lon: number, lat: number): LugarEnLaLinea | null {
  return ubicarEnLinea(camino.coordenadas, lon, lat);
}

/** Los puntos de cada parte, para dibujarla. Juntas reproducen la línea entera. */
export function dibujoDeLasPartes(camino: Camino): Array<{ parte: ParteDeCamino; coordenadas: Position[] }> {
  return camino.partes.map((parte) => ({
    parte,
    coordenadas: tramoDeLinea(camino.coordenadas, parte.desdeM, parte.hastaM),
  }));
}

/**
 * Lo que está mal en un Camino, en palabras. Vacío si está sano. Sirve para
 * desconfiar de lo que llega guardado antes de dibujarlo o editarlo.
 */
export function problemasDelCamino(camino: Camino): string[] {
  const problemas: string[] = [];
  const actividades = revisarActividades(camino.actividades);
  if (!actividades.ok) problemas.push(actividades.error);
  else if (actividades.datos.length !== camino.actividades.length) problemas.push("Hay una actividad repetida.");

  const linea = revisarLinea(camino.coordenadas);
  if (linea) problemas.push(linea);
  else if (Math.abs(largoDeLinea(camino.coordenadas) - camino.largoM) > 0.01) {
    problemas.push("El largo guardado no coincide con la línea.");
  }

  if (camino.partes.length === 0) {
    problemas.push("No tiene ninguna parte: la línea quedó sin clasificar.");
    return problemas;
  }
  if (camino.partes[0].desdeM !== 0) problemas.push("La primera parte no empieza en el comienzo de la línea.");
  if (camino.partes[camino.partes.length - 1].hastaM !== camino.largoM) {
    problemas.push("La última parte no termina en el final de la línea.");
  }

  camino.partes.forEach((parte, indice) => {
    const numero = indice + 1;
    if (!(parte.hastaM > parte.desdeM)) problemas.push(`La parte ${numero} no tiene largo.`);
    if (indice > 0) {
      const anterior = camino.partes[indice - 1];
      if (parte.desdeM > anterior.hastaM) problemas.push(`Hay un hueco antes de la parte ${numero}.`);
      if (parte.desdeM < anterior.hastaM) problemas.push(`La parte ${numero} se superpone con la anterior.`);
    }
    const marcadas = Object.keys(parte.porActividad);
    for (const actividad of camino.actividades) {
      const clasificacion = parte.porActividad[actividad];
      if (!clasificacion) {
        problemas.push(`A la parte ${numero} le falta la clasificación de ${nombreDe(actividad)}.`);
      } else if (
        !CONDICIONES_DE_PASO.includes(clasificacion.paso) ||
        (clasificacion.complejidad !== null && !COMPLEJIDADES_DE_PARTE.includes(clasificacion.complejidad))
      ) {
        problemas.push(`La parte ${numero} tiene una clasificación de ${nombreDe(actividad)} que no existe.`);
      }
    }
    for (const actividad of marcadas) {
      if (!camino.actividades.includes(actividad as ActividadRuta)) {
        problemas.push(`La parte ${numero} tiene una clasificación de una actividad que el Camino no tiene.`);
      }
    }
    if (parte.observacion !== null && typeof parte.observacion !== "string") {
      problemas.push(`La parte ${numero} tiene una observación que no es texto.`);
    }
    if (parte.comprobadoEl !== null && typeof parte.comprobadoEl !== "string") {
      problemas.push(`La parte ${numero} tiene una fecha de comprobación inválida.`);
    }
  });

  return problemas;
}
