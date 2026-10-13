import type { Position } from "geojson";
import type { ActividadRuta, Anotacion, Rectangulo, Zona } from "@/types/database";
import { ACTIVIDADES_RUTA } from "@/types/database";
import type { CaminoSinLinea } from "@/lib/caminos/datos";
import { claseDelDetalle, esFija, type ClaseDeMarca } from "@/lib/marcas/clases";

/**
 * La lista de Marcas: todo lo que hay, agrupado, con filtros y tildes
 * (decisión 052).
 *
 * **Filtrar y tildar son dos cosas.** Los filtros achican la lista para
 * encontrar; las tildes deciden qué se ve en el mapa. En el mapa queda lo que
 * está tildado **y** pasa los filtros: lo que no está en la lista tampoco está
 * en el mapa, así nunca hay algo dibujado que no se sabe de dónde salió.
 *
 * Se recuerda lo **destildado**, no lo tildado: una marca nueva aparece
 * tildada, que es lo que espera quien entra a ver qué hay.
 *
 * Las zonas van como un grupo más, para prenderlas o apagarlas. No son marcas:
 * los filtros de clase, actividad y autor no las tocan.
 */

export type GrupoDeLaLista = ClaseDeMarca | "zona";

/** El orden de los grupos en la lista. */
export const GRUPOS_EN_ORDEN: GrupoDeLaLista[] = ["camino", "punto", "trazo", "tranquera", "alambrado", "zona"];

export type MarcaDeLaLista = {
  /** Única en toda la lista: `camino:3`, `detalle:15`, `zona:2`. */
  clave: string;
  grupo: GrupoDeLaLista;
  id: number;
  autorId: string;
  /** Solo los Caminos: sus actividades. */
  actividades: ActividadRuta[] | null;
  /** Tranqueras y alambrados: no se corrigen ni se borran. */
  fija: boolean;
};

export type Autoria = "todas" | "mias" | "de_otros";

export type FiltrosDeMarcas = {
  /** Las clases que se listan. Vacío no tiene sentido: vuelve a todas. */
  clases: ClaseDeMarca[];
  /** Solo los Caminos que tienen esta actividad. `null`: todos. */
  actividad: ActividadRuta | null;
  autoria: Autoria;
};

export const TODAS_LAS_CLASES: ClaseDeMarca[] = ["camino", "punto", "trazo", "tranquera", "alambrado"];

export const SIN_FILTROS: FiltrosDeMarcas = { clases: TODAS_LAS_CLASES, actividad: null, autoria: "todas" };

/**
 * El filtro «De quién» está escondido por ahora, pedido de Ale (2026-10-13).
 * No se borra: vuelve cambiando esto a `true`. Mientras está escondido no se
 * aplica, aunque haya quedado guardado en el celular.
 */
export const FILTRO_DE_AUTOR_A_LA_VISTA = false;

/**
 * Los filtros tal como se aplican. Qué clases se ven lo deciden las casillas
 * de cada grupo, así que el filtro de clases ya no se usa (2026-10-13): queda
 * solo la actividad, adentro del grupo Caminos. «De quién», mientras está
 * escondido, tampoco.
 */
export function filtrosQueSeAplican(filtros: FiltrosDeMarcas): FiltrosDeMarcas {
  return {
    clases: TODAS_LAS_CLASES,
    actividad: filtros.actividad,
    autoria: FILTRO_DE_AUTOR_A_LA_VISTA ? filtros.autoria : "todas",
  };
}

/** Lo guardado en el celular, si sirve. */
export function leerFiltrosDeMarcas(guardado: unknown): FiltrosDeMarcas | null {
  if (!guardado || typeof guardado !== "object") return null;
  const { clases, actividad, autoria } = guardado as Record<string, unknown>;
  const clasesLeidas = Array.isArray(clases) ? TODAS_LAS_CLASES.filter((clase) => clases.includes(clase)) : [];
  return {
    clases: clasesLeidas.length > 0 ? clasesLeidas : TODAS_LAS_CLASES,
    actividad: ACTIVIDADES_RUTA.find((cada) => cada === actividad) ?? null,
    autoria: autoria === "mias" || autoria === "de_otros" ? autoria : "todas",
  };
}

export function leerDestildadas(guardado: unknown): string[] | null {
  return Array.isArray(guardado) ? guardado.filter((cada): cada is string => typeof cada === "string") : null;
}

export function claveDeCamino(id: number): string {
  return `camino:${id}`;
}
export function claveDeDetalle(id: number): string {
  return `detalle:${id}`;
}
export function claveDeZona(id: number): string {
  return `zona:${id}`;
}

/** Todo lo que hay, en el orden de los grupos. */
export function armarLaLista(caminos: CaminoSinLinea[], detalles: Anotacion[], zonas: Zona[]): MarcaDeLaLista[] {
  const marcas: MarcaDeLaLista[] = [
    ...caminos.map((camino) => ({
      clave: claveDeCamino(camino.id), grupo: "camino" as const, id: camino.id,
      autorId: camino.perfilId, actividades: camino.actividades, fija: false,
    })),
    ...detalles.map((detalle) => ({
      clave: claveDeDetalle(detalle.id), grupo: claseDelDetalle(detalle), id: detalle.id,
      autorId: detalle.perfilId, actividades: null, fija: esFija(detalle),
    })),
    ...zonas.map((zona) => ({
      clave: claveDeZona(zona.id), grupo: "zona" as const, id: zona.id,
      autorId: zona.perfilId, actividades: null, fija: false,
    })),
  ];
  return marcas.sort((a, b) => GRUPOS_EN_ORDEN.indexOf(a.grupo) - GRUPOS_EN_ORDEN.indexOf(b.grupo));
}

export function pasaLosFiltros(marca: MarcaDeLaLista, filtros: FiltrosDeMarcas, miPerfilId: string | null): boolean {
  if (marca.grupo === "zona") return true;
  if (!filtros.clases.includes(marca.grupo)) return false;
  if (filtros.actividad && marca.grupo === "camino" && !marca.actividades?.includes(filtros.actividad)) return false;
  if (filtros.autoria === "mias") return miPerfilId !== null && marca.autorId === miPerfilId;
  if (filtros.autoria === "de_otros") return miPerfilId === null || marca.autorId !== miPerfilId;
  return true;
}

/** Las que se dibujan: tildadas y dentro de los filtros. */
export function lasDelMapa(
  marcas: MarcaDeLaLista[],
  filtros: FiltrosDeMarcas,
  miPerfilId: string | null,
  destildadas: ReadonlySet<string>,
): MarcaDeLaLista[] {
  return marcas.filter((marca) => !destildadas.has(marca.clave) && pasaLosFiltros(marca, filtros, miPerfilId));
}

export type GrupoArmado = { grupo: GrupoDeLaLista; marcas: MarcaDeLaLista[]; tildadas: number };

/** Los grupos con algo, en orden, y cuántas de cada uno están tildadas. */
export function agrupar(marcas: MarcaDeLaLista[], destildadas: ReadonlySet<string>): GrupoArmado[] {
  return GRUPOS_EN_ORDEN.flatMap((grupo) => {
    const delGrupo = marcas.filter((marca) => marca.grupo === grupo);
    if (delGrupo.length === 0) return [];
    return [{ grupo, marcas: delGrupo, tildadas: delGrupo.filter((marca) => !destildadas.has(marca.clave)).length }];
  });
}

/**
 * Tildar o destildar un grupo entero. Si estaba todo tildado, se destilda
 * todo; si no, se tilda todo.
 */
export function alternarGrupo(grupo: GrupoArmado, destildadas: readonly string[]): string[] {
  const claves = new Set(grupo.marcas.map((marca) => marca.clave));
  const sinElGrupo = destildadas.filter((clave) => !claves.has(clave));
  return grupo.tildadas === grupo.marcas.length ? [...sinElGrupo, ...claves] : sinElGrupo;
}

export function alternarUna(clave: string, destildadas: readonly string[]): string[] {
  return destildadas.includes(clave) ? destildadas.filter((cada) => cada !== clave) : [...destildadas, clave];
}

/** El rectángulo que abarca todas estas coordenadas, o `null` si no hay ninguna. */
export function rectanguloDe(coordenadas: Position[]): Rectangulo | null {
  if (coordenadas.length === 0) return null;
  let latNorte = -90, latSur = 90, lonEste = -180, lonOeste = 180;
  for (const [lon, lat] of coordenadas) {
    latNorte = Math.max(latNorte, lat);
    latSur = Math.min(latSur, lat);
    lonEste = Math.max(lonEste, lon);
    lonOeste = Math.min(lonOeste, lon);
  }
  // Un punto solo no tiene tamaño: se le da un poco de terreno alrededor.
  const margen = 0.004;
  if (latNorte - latSur < margen) { latNorte += margen / 2; latSur -= margen / 2; }
  if (lonEste - lonOeste < margen) { lonEste += margen / 2; lonOeste -= margen / 2; }
  return { latNorte, latSur, lonEste, lonOeste };
}

/** Las esquinas de un rectángulo, para sumarlas a un encuadre. */
export function esquinasDe(rectangulo: Rectangulo): Position[] {
  return [[rectangulo.lonOeste, rectangulo.latSur], [rectangulo.lonEste, rectangulo.latNorte]];
}
