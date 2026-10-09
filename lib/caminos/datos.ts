import type { Position } from "geojson";
import { ACTIVIDADES_RUTA, type ActividadRuta } from "@/types/database";
import { exito, falla, traducirErrorDeBase, type Resultado } from "@/lib/datos/resultado";
import { hoyEnCordoba } from "@/lib/salidas/reglas";
import {
  problemasDelCamino,
  type Camino,
  type ClasificacionDeParte,
  type ClasificacionPorActividad,
  type ParteDeCamino,
} from "@/lib/caminos/partes";
import { alturasParaLaBase, leerAlturasDeLaBase, type AlturasDeLinea } from "@/lib/alturas/perfil";

/**
 * La traducción entre una fila de la tabla `caminos` y un Camino, y la
 * revisión de lo que manda la persona antes de guardarlo.
 *
 * **Lo que llega de la base no se da por bueno.** Una fila con una parte
 * rota dibujaría un pedazo de camino sin condición de paso: se rechaza con el
 * motivo, nunca se muestra a medias. La tabla está en
 * `scripts/supabase-caminos.sql`.
 *
 * Cuenta pura, sin pantalla ni conexión: se prueba entera.
 */

export const COLUMNAS_DE_CAMINO =
  "id, perfil_id, nombre, descripcion, actividades, geometria, partes, largo_m, alturas, desnivel_positivo_m, desnivel_negativo_m, version_forma, creado_en, actualizado_en, eliminado_en";

export const LARGO_MAXIMO_DEL_NOMBRE = 120;
export const LARGO_MAXIMO_DE_LA_DESCRIPCION = 2000;
export const LARGO_MAXIMO_DE_LA_OBSERVACION = 1000;

/** La base cuenta caracteres Unicode, no las dos unidades que usa JavaScript para algunos símbolos. */
function cantidadDeCaracteres(texto: string): number {
  return Array.from(texto).length;
}

/** Un Camino tal como está guardado: la línea y sus partes, más quién, cuándo y qué versión. */
export type CaminoGuardado = Camino & {
  id: number;
  perfilId: string;
  nombre: string;
  descripcion: string | null;
  /**
   * Las alturas del terreno a lo largo de la línea y su desnivel. Las calcula
   * la app al guardar (decisión 049). `null`: todavía no se calcularon.
   */
  alturas: AlturasDeLinea | null;
  /** Sube cada vez que cambia la línea. La pone la base, nunca la app. */
  versionForma: number;
  creadoEn: string;
  /** Lo que se usa para darse cuenta de que otra persona guardó antes. */
  actualizadoEn: string;
  eliminadoEn: string | null;
};

/** Datos livianos del Camino. Su línea y sus alturas viven en el depósito grande del celular. */
export type CaminoSinLinea = Omit<CaminoGuardado, "coordenadas" | "alturas">;

/** Una parte, como va adentro de la columna `partes`. */
export type ParteEnLaBase = {
  desde_m: number;
  hasta_m: number;
  por_actividad: Partial<Record<ActividadRuta, { paso: string; complejidad: string | null }>>;
  observacion: string | null;
  comprobado_el: string | null;
};

/** Las columnas que la app escribe. Ni el autor ni las fechas ni la versión están acá. */
export type ColumnasDeCamino = {
  nombre: string;
  descripcion: string | null;
  actividades: ActividadRuta[];
  geometria: { type: "LineString"; coordinates: Position[] };
  partes: ParteEnLaBase[];
  largo_m: number;
  alturas?: { cada_m: number; valores: number[] } | null;
  desnivel_positivo_m?: number | null;
  desnivel_negativo_m?: number | null;
};

export type CambiosDeCamino = Partial<ColumnasDeCamino> & { eliminado_en?: string };

// ---------------------------------------------------------------- de la base al Camino

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function esPosicion(valor: unknown): valor is Position {
  return Array.isArray(valor) && valor.length >= 2 && valor.every((numero) => typeof numero === "number");
}

function textoONulo(valor: unknown): string | null | undefined {
  if (valor === null || valor === undefined) return null;
  return typeof valor === "string" ? valor : undefined;
}

/** Una fecha `AAAA-MM-DD` que existe en el calendario. */
export function esFechaDelCalendario(texto: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const fecha = new Date(`${texto}T12:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === texto;
}

function leerParte(valor: unknown): ParteDeCamino | null {
  if (!esObjeto(valor) || !esObjeto(valor.por_actividad)) return null;
  if (typeof valor.desde_m !== "number" || typeof valor.hasta_m !== "number") return null;

  // Los valores se copian tal cual: si alguno no existe, el control del
  // Camino lo dice con su nombre, en vez de esconderlo acá.
  const porActividad: ClasificacionPorActividad = {};
  for (const [actividad, clasificacion] of Object.entries(valor.por_actividad)) {
    if (!esObjeto(clasificacion)) return null;
    porActividad[actividad as ActividadRuta] = {
      paso: clasificacion.paso,
      complejidad: clasificacion.complejidad,
    } as ClasificacionDeParte;
  }

  return {
    desdeM: valor.desde_m,
    hastaM: valor.hasta_m,
    porActividad,
    observacion: (valor.observacion ?? null) as string | null,
    comprobadoEl: (valor.comprobado_el ?? null) as string | null,
  };
}

function guardadoConError(nombre: string | null, motivo: string): { ok: false; error: string } {
  const cual = nombre ? `El Camino «${nombre}»` : "Un Camino";
  return falla(
    `${cual} está guardado con un error: ${motivo} No se puede mostrar ni editar hasta corregirlo. Avisale al administrador.`,
  );
}

/**
 * Una fila de `caminos` convertida en Camino, o el motivo por el que no sirve.
 * Revisa la forma de cada dato y, después, que las partes cierren.
 */
export function leerFilaDeCamino(fila: unknown): Resultado<CaminoGuardado> {
  if (!esObjeto(fila)) {
    return falla("La base devolvió un Camino que no se entiende. Probá de nuevo; si sigue pasando, avisale al administrador.");
  }
  const nombre = typeof fila.nombre === "string" && fila.nombre.trim() ? fila.nombre : null;
  const roto = (motivo: string) => guardadoConError(nombre, motivo);

  const id = Number(fila.id);
  if (!Number.isInteger(id) || id <= 0) return roto("no tiene un número válido.");
  if (typeof fila.perfil_id !== "string" || !fila.perfil_id) return roto("no dice quién lo subió.");
  if (nombre === null) return roto("no tiene nombre.");

  const descripcion = textoONulo(fila.descripcion);
  if (descripcion === undefined) return roto("la descripción no es texto.");

  if (!Array.isArray(fila.actividades) || !fila.actividades.every((cada) => typeof cada === "string")) {
    return roto("no tiene una lista de actividades.");
  }

  const geometria = fila.geometria;
  if (
    !esObjeto(geometria) ||
    geometria.type !== "LineString" ||
    !Array.isArray(geometria.coordinates) ||
    !geometria.coordinates.every(esPosicion)
  ) {
    return roto("la línea no tiene la forma de una línea.");
  }

  if (!Array.isArray(fila.partes)) return roto("no tiene la lista de sus partes.");
  const partes = fila.partes.map(leerParte);
  if (partes.some((parte) => parte === null)) return roto("una de sus partes no tiene la forma esperada.");

  const largoM = typeof fila.largo_m === "string" ? Number(fila.largo_m) : fila.largo_m;
  if (typeof largoM !== "number" || !Number.isFinite(largoM)) return roto("no tiene el largo de la línea.");

  const alturas = leerAlturasDeLaBase(fila.alturas, fila.desnivel_positivo_m, fila.desnivel_negativo_m, largoM);
  if (alturas === undefined) return roto("sus alturas no coinciden con la línea.");

  const versionForma = Number(fila.version_forma);
  if (!Number.isInteger(versionForma) || versionForma < 1) return roto("no tiene una versión válida de la línea.");

  if (typeof fila.creado_en !== "string" || typeof fila.actualizado_en !== "string") {
    return roto("le faltan las fechas de creación o de cambio.");
  }
  const eliminadoEn = textoONulo(fila.eliminado_en);
  if (eliminadoEn === undefined) return roto("la fecha de retiro no es una fecha.");

  const camino: CaminoGuardado = {
    id,
    perfilId: fila.perfil_id,
    nombre,
    descripcion,
    actividades: fila.actividades as ActividadRuta[],
    coordenadas: geometria.coordinates as Position[],
    largoM,
    partes: partes as ParteDeCamino[],
    alturas,
    versionForma,
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
    eliminadoEn,
  };

  const problemas = problemasDelCamino(camino);
  camino.partes.forEach((parte, indice) => {
    if (typeof parte.comprobadoEl === "string" && !esFechaDelCalendario(parte.comprobadoEl)) {
      problemas.push(`La parte ${indice + 1} tiene una fecha de comprobación que no existe.`);
    }
  });
  if (problemas.length > 0) return roto(problemas.join(" "));

  return exito(camino);
}

// ---------------------------------------------------------------- del Camino a la base

function parteParaLaBase(parte: ParteDeCamino, actividades: ActividadRuta[]): ParteEnLaBase {
  const porActividad: ParteEnLaBase["por_actividad"] = {};
  for (const actividad of actividades) {
    const clasificacion = parte.porActividad[actividad];
    if (clasificacion) porActividad[actividad] = { paso: clasificacion.paso, complejidad: clasificacion.complejidad };
  }
  return {
    desde_m: parte.desdeM,
    hasta_m: parte.hastaM,
    por_actividad: porActividad,
    observacion: parte.observacion,
    comprobado_el: parte.comprobadoEl,
  };
}

/**
 * Las columnas que se escriben. Nunca llevan el autor: ese queda fijo desde que se crea.
 * Las alturas viajan solo si el Camino las trae, vacías o no.
 */
export function columnasDelCamino(
  camino: Camino & { nombre: string; descripcion: string | null; alturas?: AlturasDeLinea | null },
): ColumnasDeCamino {
  return {
    ...(camino.alturas === undefined ? {} : alturasParaLaBase(camino.alturas)),
    nombre: camino.nombre,
    descripcion: camino.descripcion,
    actividades: [...camino.actividades],
    geometria: { type: "LineString", coordinates: camino.coordenadas },
    partes: camino.partes.map((parte) => parteParaLaBase(parte, camino.actividades)),
    largo_m: camino.largoM,
  };
}

/** Solo las columnas que cambiaron. Si cambió una clasificación, la línea no viaja de nuevo. */
export function cambiosEntre(antes: ColumnasDeCamino, despues: ColumnasDeCamino): Partial<ColumnasDeCamino> {
  const cambios: Partial<ColumnasDeCamino> = {};
  for (const columna of Object.keys(despues) as (keyof ColumnasDeCamino)[]) {
    if (JSON.stringify(antes[columna]) !== JSON.stringify(despues[columna])) {
      (cambios as Record<string, unknown>)[columna] = despues[columna];
    }
  }
  return cambios;
}

// ---------------------------------------------------------------- lo que manda la persona

export function revisarIdDeCamino(id: unknown): Resultado<number> {
  return typeof id === "number" && Number.isInteger(id) && id > 0
    ? exito(id)
    : falla("No se sabe qué Camino querés cambiar. Volvé a la lista de Caminos y abrilo de nuevo.");
}

export function revisarNombre(nombre: unknown): Resultado<string> {
  const limpio = typeof nombre === "string" ? nombre.trim() : "";
  if (!limpio) return falla("Ponele un nombre al Camino.");
  const cantidad = cantidadDeCaracteres(limpio);
  if (cantidad > LARGO_MAXIMO_DEL_NOMBRE) {
    return falla(`El nombre es muy largo: tiene ${cantidad} caracteres y el máximo son ${LARGO_MAXIMO_DEL_NOMBRE}. Acortalo.`);
  }
  return exito(limpio);
}

export function revisarDescripcion(descripcion: unknown): Resultado<string | null> {
  if (descripcion !== null && descripcion !== undefined && typeof descripcion !== "string") {
    return falla("La descripción no se entiende. Escribila de nuevo.");
  }
  const limpia = descripcion?.trim() || null;
  if (limpia && cantidadDeCaracteres(limpia) > LARGO_MAXIMO_DE_LA_DESCRIPCION) {
    return falla(`La descripción es muy larga: dejala en ${LARGO_MAXIMO_DE_LA_DESCRIPCION} caracteres o menos.`);
  }
  return exito<string | null>(limpia);
}

export function revisarObservacion(observacion: unknown): Resultado<string | null> {
  if (observacion !== null && observacion !== undefined && typeof observacion !== "string") {
    return falla("La observación no se entiende. Escribila de nuevo.");
  }
  const limpia = observacion?.trim() || null;
  if (limpia && cantidadDeCaracteres(limpia) > LARGO_MAXIMO_DE_LA_OBSERVACION) {
    return falla(`La observación es muy larga: dejala en ${LARGO_MAXIMO_DE_LA_OBSERVACION} caracteres o menos.`);
  }
  return exito<string | null>(limpia);
}

/** El día en que alguien pasó por la parte: existe en el calendario y no es más adelante que hoy. */
export function revisarFechaDeComprobacion(fecha: unknown, hoy: string = hoyEnCordoba()): Resultado<string | null> {
  if (fecha === null || fecha === undefined || fecha === "") return exito<string | null>(null);
  if (typeof fecha !== "string" || !esFechaDelCalendario(fecha)) {
    return falla("La fecha de comprobación no es una fecha válida. Elegila de nuevo en el calendario.");
  }
  if (fecha > hoy) {
    return falla("La fecha de comprobación es más adelante que hoy. Elegí el día en que pasaste por ahí.");
  }
  return exito<string | null>(fecha);
}

/**
 * La línea que manda la persona, solo con longitud y latitud. Google Earth
 * agrega un tercer número, la altura, siempre en cero: no es un dato, y los
 * Circuitos que toman la línea solo aceptan puntos de dos números. La altura
 * de verdad la calcula la app aparte (decisión 049).
 */
export function revisarCoordenadas(coordenadas: unknown): Resultado<Position[]> {
  if (!Array.isArray(coordenadas) || !coordenadas.every(esPosicion)) {
    return falla("La línea no llegó bien al servidor. Volvé a dibujarla o a elegir el archivo.");
  }
  return exito((coordenadas as Position[]).map((punto) => [punto[0], punto[1]]));
}

export function revisarActividad(actividad: unknown): Resultado<ActividadRuta> {
  return typeof actividad === "string" && (ACTIVIDADES_RUTA as readonly string[]).includes(actividad)
    ? exito(actividad as ActividadRuta)
    : falla("Esa actividad no existe. Elegí entre Trekking, Correr, Mountain bike, Kayak y Canyoning.");
}

export function revisarListaDeActividades(actividades: unknown): Resultado<string[]> {
  return Array.isArray(actividades) && actividades.every((cada) => typeof cada === "string")
    ? exito(actividades as string[])
    : falla("Las actividades no llegaron bien. Elegilas de nuevo.");
}

// ---------------------------------------------------------------- la misma versión

/**
 * ¿Las dos fechas son el mismo instante? La base guarda microsegundos, que un
 * `Date` de JavaScript pierde: por eso se comparan aparte.
 */
export function mismoMomento(a: string, b: string): boolean {
  const partes = (texto: string) => {
    const encontrado = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:\.(\d+))?(Z|[+-]\d{2}(?::?\d{2})?)$/.exec(texto.trim());
    if (!encontrado) return null;
    const [, dia, hora, fraccion = "", zona] = encontrado;
    const zonaCompleta = zona === "Z" ? "Z" : zona.length === 3 ? `${zona}:00` : zona.includes(":") ? zona : `${zona.slice(0, 3)}:${zona.slice(3)}`;
    const segundos = Date.parse(`${dia}T${hora}${zonaCompleta}`);
    if (Number.isNaN(segundos)) return null;
    return { segundos, microsegundos: fraccion.padEnd(6, "0").slice(0, 6) };
  };
  const primero = partes(a);
  const segundo = partes(b);
  return primero !== null && segundo !== null
    && primero.segundos === segundo.segundos
    && primero.microsegundos === segundo.microsegundos;
}

export function esMomento(texto: unknown): texto is string {
  return typeof texto === "string" && mismoMomento(texto, texto);
}

// ---------------------------------------------------------------- errores de la base

/** El error crudo de la base, en palabras. Primero lo propio de Caminos; después lo general. */
export function traducirErrorDeCaminos(mensaje: string): string {
  const texto = mensaje.toLowerCase();
  if (texto.includes("abort") || texto.includes("timeout")) {
    return "La base tardó demasiado en contestar. Probá de nuevo cuando tengas mejor conexión.";
  }
  if (texto.includes("caminos") && (texto.includes("does not exist") || texto.includes("could not find the table"))) {
    return "Los Caminos todavía no están habilitados en la base. Avisale al administrador.";
  }
  if (texto.includes("caminos_partes_validas")) {
    return "La base no aceptó las partes: no cubren la línea entera o les falta la clasificación de alguna actividad. Volvé a abrir el Camino y probá de nuevo.";
  }
  if (texto.includes("caminos_nombre_valido")) {
    return `El nombre tiene que tener entre 1 y ${LARGO_MAXIMO_DEL_NOMBRE} letras.`;
  }
  if (texto.includes("caminos_descripcion_valida")) {
    return `La descripción es muy larga: dejala en ${LARGO_MAXIMO_DE_LA_DESCRIPCION} letras o menos.`;
  }
  if (texto.includes("caminos_al_menos_una_actividad")) {
    return "Elegí al menos una actividad para este Camino.";
  }
  if (texto.includes("caminos_geometria_es_linea") || texto.includes("caminos_largo_positivo")) {
    return "La línea necesita al menos dos puntos en lugares distintos. Revisala y probá de nuevo.";
  }
  if (texto.includes("no se puede cambiar quién creó") || texto.includes("no se puede cambiar cuándo se creó")) {
    return "No se puede cambiar quién creó un Camino ni cuándo. Si hace falta, avisale al administrador.";
  }
  return traducirErrorDeBase(mensaje);
}
