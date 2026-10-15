import type { Position } from "geojson";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import { sinTildes } from "@/lib/marcas/buscar-en-consultas";
import { rectanguloDe } from "@/lib/marcas/lista";
import type { Anotacion, Rectangulo, Sector, Zona } from "@/types/database";

/**
 * Buscar mientras se marca un punto, un Camino o un trazo.
 *
 * Filtra lo que la app ya tiene, sin salir a internet. Cada carácter vale más
 * en una zona, después en un sector, después en un Camino, y al final igual
 * en un punto y en un trazo. No distingue mayúsculas ni tildes.
 *
 * Los pueblos no entran acá: se piden aparte, y solo cuando se aprieta el botón.
 */

export type ClaseAlMarcar = "zona" | "sector" | "camino" | "punto" | "trazo";

/** Cuánto vale cada carácter que coincide, según qué es. */
export const VALOR_AL_MARCAR: Record<ClaseAlMarcar, number> = {
  zona: 4,
  sector: 3,
  camino: 2,
  punto: 1,
  trazo: 1,
};

const CUANTOS_SE_MUESTRAN = 30;

export type ElementoAlMarcar = {
  clase: ClaseAlMarcar;
  id: number;
  titulo: string;
  aclaracion: string;
  textos: string[];
};

export type CoincidenciaAlMarcar = {
  clase: ClaseAlMarcar;
  id: number;
  titulo: string;
  aclaracion: string;
  puntaje: number;
};

export type BusquedaAlMarcar = {
  lista: CoincidenciaAlMarcar[];
  hayMas: boolean;
};

const VACIA: BusquedaAlMarcar = { lista: [], hayMas: false };

export function buscarAlMarcar(consulta: string, elementos: readonly ElementoAlMarcar[]): BusquedaAlMarcar {
  const buscado = sinTildes(consulta);
  if (!buscado) return VACIA;

  const hallados: (CoincidenciaAlMarcar & { desde: number })[] = [];
  for (const elemento of elementos) {
    let desde = Number.POSITIVE_INFINITY;
    for (const texto of elemento.textos) {
      const indice = sinTildes(texto).indexOf(buscado);
      if (indice >= 0 && indice < desde) desde = indice;
    }
    if (!Number.isFinite(desde)) continue;
    hallados.push({
      clase: elemento.clase,
      id: elemento.id,
      titulo: elemento.titulo,
      aclaracion: elemento.aclaracion,
      puntaje: buscado.length * VALOR_AL_MARCAR[elemento.clase],
      desde,
    });
  }

  hallados.sort((a, b) =>
    b.puntaje - a.puntaje || a.desde - b.desde || a.titulo.localeCompare(b.titulo, "es") || a.id - b.id);

  return {
    lista: hallados.slice(0, CUANTOS_SE_MUESTRAN).map(({ clase, id, titulo, aclaracion, puntaje }) =>
      ({ clase, id, titulo, aclaracion, puntaje })),
    hayMas: hallados.length > CUANTOS_SE_MUESTRAN,
  };
}

/** A dónde llevar el mapa, o por qué ese resultado no se puede mostrar. */
export function encuadreAlMarcar(
  coincidencia: Pick<CoincidenciaAlMarcar, "clase" | "id">,
  zonas: readonly Zona[],
  sectores: readonly Sector[],
  caminos: readonly CaminoGuardado[],
  anotaciones: readonly Anotacion[],
  cargandoCaminos: boolean,
): { encuadre: Rectangulo } | { aviso: string } {
  if (coincidencia.clase === "zona") {
    const zona = zonas.find((cada) => cada.id === coincidencia.id);
    if (!zona) return { aviso: "Esa zona ya no está. Cerrá el buscador y volvé a abrirlo." };
    return { encuadre: { ...zona.rectangulo } };
  }
  if (coincidencia.clase === "sector") {
    const sector = sectores.find((cada) => cada.id === coincidencia.id);
    if (!sector) return { aviso: "Ese sector ya no está. Cerrá el buscador y volvé a abrirlo." };
    return { encuadre: { ...sector.rectangulo } };
  }
  if (coincidencia.clase === "camino") {
    const camino = caminos.find((cada) => cada.id === coincidencia.id);
    const encuadre = camino ? rectanguloDe(camino.coordenadas) : null;
    if (encuadre) return { encuadre };
    return {
      aviso: cargandoCaminos
        ? "Este Camino se está abriendo. Esperá un momento y volvé a tocarlo."
        : "Este Camino no tiene la línea en este celular. Abrí la app con conexión en casa para descargarla.",
    };
  }
  const geometria = anotaciones.find((cada) => cada.id === coincidencia.id)?.geometria;
  const coordenadas: Position[] = !geometria
    ? []
    : geometria.type === "Point"
      ? [geometria.coordinates]
      : geometria.coordinates;
  const encuadre = rectanguloDe(coordenadas);
  if (!encuadre) return { aviso: "Este lugar no tiene un punto en el mapa. Cerrá el buscador y volvé a abrirlo." };
  return { encuadre };
}
