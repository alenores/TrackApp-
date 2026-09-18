import type { FeatureCollection, Position } from "geojson";
import type { Rectangulo, Sector } from "@/types/database";

/**
 * Cobertura: qué sectores necesita una ruta para poder recorrerse sin señal.
 *
 * El usuario abre una ruta y tiene que saber, ahí mismo y con señal, qué mapas
 * le faltan. La ruta manda y los sectores responden: se cruza la línea de la
 * ruta contra los rectángulos de todos los sectores. Nadie marca nada a mano.
 *
 * Ver docs/decisiones/009-cobertura-de-mapas-de-una-ruta.md
 *
 * **Función crítica.** De esto depende que alguien salga al cerro sabiendo o no
 * que le falta un mapa. Tiene prueba automática.
 */

/** Cada cuántos metros se evalúa la línea al medir el tramo sin cobertura. */
const PASO_DE_MUESTREO_M = 50;

const RADIO_TIERRA_M = 6371000;

export type EstadoDeSector = "descargado" | "falta_descargar";

export type SectorNecesario = {
  sector: Sector;
  estado: EstadoDeSector;
};

export type Cobertura = {
  /** Los sectores por los que pasa la ruta, ordenados por nombre. */
  sectores: SectorNecesario[];
  /** Metros de la ruta que no cubre ningún sector. */
  metrosSinCobertura: number;
  /** Largo total de la ruta en metros, medido sobre la misma línea. */
  metrosTotales: number;
};

// ------------------------------------------------------------------ geometría

function aRadianes(grados: number): number {
  return (grados * Math.PI) / 180;
}

function distanciaEnMetros(
  lonA: number,
  latA: number,
  lonB: number,
  latB: number,
): number {
  const dLat = aRadianes(latB - latA);
  const dLon = aRadianes(lonB - lonA);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(latA)) *
      Math.cos(aRadianes(latB)) *
      Math.sin(dLon / 2) ** 2;
  return RADIO_TIERRA_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function puntoDentroDelRectangulo(
  lon: number,
  lat: number,
  rectangulo: Rectangulo,
): boolean {
  return (
    lat <= rectangulo.latNorte &&
    lat >= rectangulo.latSur &&
    lon <= rectangulo.lonEste &&
    lon >= rectangulo.lonOeste
  );
}

/** Saca todas las líneas que tenga el recorrido, sea cual sea su forma. */
export function extraerLineas(geometria: FeatureCollection): Position[][] {
  const lineas: Position[][] = [];

  for (const elemento of geometria.features ?? []) {
    const forma = elemento.geometry;
    if (!forma) continue;

    if (forma.type === "LineString") {
      lineas.push(forma.coordinates);
    } else if (forma.type === "MultiLineString") {
      lineas.push(...forma.coordinates);
    } else if (forma.type === "GeometryCollection") {
      for (const parte of forma.geometries) {
        if (parte.type === "LineString") lineas.push(parte.coordinates);
        else if (parte.type === "MultiLineString")
          lineas.push(...parte.coordinates);
      }
    }
  }

  return lineas.filter((linea) => linea.length >= 2);
}

// ------------------------------------------------------------------ cobertura

/**
 * Recorre la línea a pasos parejos y devuelve, para cada paso, en qué punto
 * está y cuántos metros representa. Así el tramo sin cobertura se mide sobre
 * el recorrido real y no sobre la cantidad de vértices, que es arbitraria.
 */
function* recorrerLinea(
  lineas: Position[][],
): Generator<{ lon: number; lat: number; metros: number }> {
  for (const linea of lineas) {
    for (let i = 0; i < linea.length - 1; i += 1) {
      const [lonA, latA] = linea[i];
      const [lonB, latB] = linea[i + 1];

      if (
        !Number.isFinite(lonA) ||
        !Number.isFinite(latA) ||
        !Number.isFinite(lonB) ||
        !Number.isFinite(latB)
      ) {
        continue;
      }

      const largo = distanciaEnMetros(lonA, latA, lonB, latB);
      if (largo === 0) continue;

      const pasos = Math.max(1, Math.ceil(largo / PASO_DE_MUESTREO_M));
      const metrosPorPaso = largo / pasos;

      for (let paso = 0; paso < pasos; paso += 1) {
        const avance = (paso + 0.5) / pasos;
        yield {
          lon: lonA + (lonB - lonA) * avance,
          lat: latA + (latB - latA) * avance,
          metros: metrosPorPaso,
        };
      }
    }
  }
}

/**
 * Calcula la cobertura de una ruta.
 *
 * `sectoresDescargados` son los identificadores de los sectores que el usuario
 * ya tiene en el celular.
 */
export function calcularCobertura(
  geometria: FeatureCollection,
  sectores: Sector[],
  sectoresDescargados: ReadonlySet<number> = new Set(),
): Cobertura {
  const lineas = extraerLineas(geometria);
  const tocados = new Set<number>();

  let metrosSinCobertura = 0;
  let metrosTotales = 0;

  for (const { lon, lat, metros } of recorrerLinea(lineas)) {
    metrosTotales += metros;

    let cubierto = false;

    for (const sector of sectores) {
      if (puntoDentroDelRectangulo(lon, lat, sector.rectangulo)) {
        tocados.add(sector.id);
        cubierto = true;
      }
    }

    if (!cubierto) metrosSinCobertura += metros;
  }

  const necesarios: SectorNecesario[] = sectores
    .filter((sector) => tocados.has(sector.id))
    .map((sector) => ({
      sector,
      estado: sectoresDescargados.has(sector.id)
        ? ("descargado" as const)
        : ("falta_descargar" as const),
    }))
    .sort((a, b) => a.sector.nombre.localeCompare(b.sector.nombre, "es"));

  return {
    sectores: necesarios,
    metrosSinCobertura: Math.round(metrosSinCobertura),
    metrosTotales: Math.round(metrosTotales),
  };
}

/** ¿Está todo lo que hace falta, ya bajado? */
export function coberturaCompleta(cobertura: Cobertura): boolean {
  return (
    cobertura.metrosSinCobertura === 0 &&
    cobertura.sectores.every((s) => s.estado === "descargado")
  );
}

// ------------------------------------------------- cobertura de una zona

export type HuecoDeZona = {
  /** Porción del rectángulo de la zona que ningún sector cubre, de 0 a 1. */
  proporcionSinCubrir: number;
};

/**
 * Cuánto del territorio de una zona todavía no tiene ningún sector encima.
 *
 * Es la misma idea de cobertura mirada desde el otro lado, y es herramienta de
 * administración. Se resuelve pintando la zona con una grilla y viendo qué
 * celdas quedaron sin pintar.
 */
export function calcularHuecoDeZona(
  zona: Rectangulo,
  sectores: Sector[],
  celdasPorLado = 60,
): HuecoDeZona {
  const altoCelda = (zona.latNorte - zona.latSur) / celdasPorLado;
  const anchoCelda = (zona.lonEste - zona.lonOeste) / celdasPorLado;

  if (!(altoCelda > 0) || !(anchoCelda > 0)) {
    return { proporcionSinCubrir: 0 };
  }

  let sinCubrir = 0;

  for (let fila = 0; fila < celdasPorLado; fila += 1) {
    const lat = zona.latSur + altoCelda * (fila + 0.5);

    for (let columna = 0; columna < celdasPorLado; columna += 1) {
      const lon = zona.lonOeste + anchoCelda * (columna + 0.5);

      const cubierta = sectores.some((sector) =>
        puntoDentroDelRectangulo(lon, lat, sector.rectangulo),
      );

      if (!cubierta) sinCubrir += 1;
    }
  }

  return { proporcionSinCubrir: sinCubrir / (celdasPorLado * celdasPorLado) };
}
