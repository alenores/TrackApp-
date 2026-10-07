import type { Feature, FeatureCollection, LineString, Position } from "geojson";
import { distanciaEnKm, puntoDeCoordenada } from "@/lib/geo";

/** La condición de paso y la complejidad pertenecen a cada parte, nunca a la ruta entera. */
export type PasoDeParte = "por_explorar" | "transitable" | "a_pie" | "sin_paso";
export type ComplejidadDeParte = "facil" | "media" | "dificil" | null;

export type DatosDeParte = {
  paso: PasoDeParte;
  complejidad: ComplejidadDeParte;
  observacion: string | null;
  comprobadoEl: string | null;
};

export type LugarEnRuta = {
  linea: number;
  distanciaM: number;
  coordenada: Position;
};

type Propiedades = Record<string, unknown> & {
  linea?: number;
  desde_m?: number;
  hasta_m?: number;
  paso?: PasoDeParte;
  complejidad?: ComplejidadDeParte;
  observacion?: string | null;
  comprobado_el?: string | null;
};

type Parte = Feature<LineString, Propiedades>;

function metros(a: Position, b: Position): number {
  return distanciaEnKm(puntoDeCoordenada(a), puntoDeCoordenada(b)) * 1000;
}

function largo(coordenadas: Position[]): number {
  let total = 0;
  for (let i = 1; i < coordenadas.length; i += 1) total += metros(coordenadas[i - 1], coordenadas[i]);
  return total;
}

function esLineaValida(coordenadas: Position[]): boolean {
  return coordenadas.length >= 2 && coordenadas.every((p) =>
    p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]));
}

/**
 * Convierte los distintos tipos de líneas que traen GPX y KML a partes simples.
 * Las rutas viejas quedan por explorar y sin complejidad asignada: no se inventa
 * un verde que nadie comprobó. Los marcadores del archivo se conservan.
 */
export function prepararPartes(geometria: FeatureCollection): FeatureCollection {
  const features: Feature[] = [];
  let siguienteLinea = geometria.features.reduce((mayor, feature) => {
    const linea = feature.properties?.linea;
    return Number.isInteger(linea) ? Math.max(mayor, Number(linea) + 1) : mayor;
  }, 0);

  for (const feature of geometria.features) {
    const forma = feature.geometry;
    if (!forma) continue;
    const propiedades = (feature.properties ?? {}) as Propiedades;
    const lineas = forma.type === "LineString" ? [forma.coordinates]
      : forma.type === "MultiLineString" ? forma.coordinates
        : forma.type === "GeometryCollection"
          ? forma.geometries.flatMap((cada) => cada.type === "LineString" ? [cada.coordinates]
            : cada.type === "MultiLineString" ? cada.coordinates : [])
          : [];

    if (lineas.length === 0) {
      features.push(feature);
      continue;
    }

    for (const coordenadas of lineas) {
      if (!esLineaValida(coordenadas) || largo(coordenadas) <= 0) continue;
      const yaPartida = forma.type === "LineString"
        && Number.isInteger(propiedades.linea)
        && typeof propiedades.desde_m === "number"
        && typeof propiedades.hasta_m === "number";
      const linea = yaPartida ? propiedades.linea as number : siguienteLinea;
      const desde = yaPartida ? propiedades.desde_m as number : 0;
      const hasta = yaPartida ? propiedades.hasta_m as number : largo(coordenadas);
      features.push({
        type: "Feature",
        properties: {
          ...propiedades,
          linea,
          desde_m: desde,
          hasta_m: hasta,
          paso: propiedades.paso ?? "por_explorar",
          complejidad: propiedades.complejidad ?? null,
          observacion: propiedades.observacion ?? null,
          comprobado_el: propiedades.comprobado_el ?? null,
        },
        geometry: { type: "LineString", coordinates: coordenadas },
      });
      siguienteLinea = Math.max(siguienteLinea, linea + 1);
    }
  }

  return { ...geometria, features };
}

/** Busca el punto más cercano dentro de una línea específica del archivo. */
export function ubicarEnRuta(
  geometria: FeatureCollection,
  lon: number,
  lat: number,
  lineaElegida?: number,
): LugarEnRuta | null {
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  const partes = prepararPartes(geometria).features as Parte[];
  let mejor: (LugarEnRuta & { distanciaAlToque: number }) | null = null;
  const escalaLon = Math.cos(lat * Math.PI / 180);

  for (const parte of partes) {
    if (parte.geometry?.type !== "LineString") continue;
    const linea = parte.properties.linea;
    if (typeof linea !== "number" || (lineaElegida !== undefined && linea !== lineaElegida)) continue;
    const puntos = parte.geometry.coordinates;
    let desdeSegmento = parte.properties.desde_m ?? 0;
    for (let i = 1; i < puntos.length; i += 1) {
      const a = puntos[i - 1];
      const b = puntos[i];
      const dx = (b[0] - a[0]) * escalaLon;
      const dy = b[1] - a[1];
      const divisor = dx * dx + dy * dy;
      const t = divisor === 0 ? 0 : Math.max(0, Math.min(1,
        (((lon - a[0]) * escalaLon) * dx + (lat - a[1]) * dy) / divisor));
      const x = a[0] + (b[0] - a[0]) * t;
      const y = a[1] + (b[1] - a[1]) * t;
      const distanciaAlToque = Math.hypot((lon - x) * escalaLon, lat - y);
      if (!mejor || distanciaAlToque < mejor.distanciaAlToque) {
        mejor = {
          linea,
          distanciaM: desdeSegmento + metros(a, b) * t,
          coordenada: a.map((valor, indice) => valor + ((b[indice] ?? valor) - valor) * t),
          distanciaAlToque,
        };
      }
      desdeSegmento += metros(a, b);
    }
  }

  return mejor && {
    linea: mejor.linea,
    distanciaM: mejor.distanciaM,
    coordenada: mejor.coordenada,
  };
}

function puntoEnDistancia(puntos: Position[], distancia: number): Position {
  if (distancia <= 0) return puntos[0];
  let acumulado = 0;
  for (let i = 1; i < puntos.length; i += 1) {
    const a = puntos[i - 1];
    const b = puntos[i];
    const segmento = metros(a, b);
    if (acumulado + segmento >= distancia) {
      const t = segmento === 0 ? 0 : (distancia - acumulado) / segmento;
      return a.map((valor, indice) => valor + ((b[indice] ?? valor) - valor) * t);
    }
    acumulado += segmento;
  }
  return puntos[puntos.length - 1];
}

function recortar(puntos: Position[], desde: number, hasta: number): Position[] {
  const resultado = [puntoEnDistancia(puntos, desde)];
  let acumulado = 0;
  for (let i = 1; i < puntos.length - 1; i += 1) {
    acumulado += metros(puntos[i - 1], puntos[i]);
    if (acumulado > desde && acumulado < hasta) resultado.push(puntos[i]);
  }
  resultado.push(puntoEnDistancia(puntos, hasta));
  return resultado;
}

/** Cambia solo el intervalo elegido, sin tocar la geometría ni los datos del resto. */
export function marcarParte(
  geometria: FeatureCollection,
  inicio: LugarEnRuta,
  final: LugarEnRuta,
  datos: DatosDeParte,
): FeatureCollection {
  if (inicio.linea !== final.linea) throw new Error("Elegí el inicio y el final sobre la misma línea de la ruta.");
  const desde = Math.min(inicio.distanciaM, final.distanciaM);
  const hasta = Math.max(inicio.distanciaM, final.distanciaM);
  if (!Number.isFinite(desde) || !Number.isFinite(hasta) || hasta - desde < 2) {
    throw new Error("Elegí dos lugares separados al menos dos metros sobre la ruta.");
  }
  const preparada = prepararPartes(geometria);
  const nuevas: Feature[] = [];
  let tocadas = 0;

  for (const feature of preparada.features) {
    if (feature.geometry?.type !== "LineString") {
      nuevas.push(feature);
      continue;
    }
    const parte = feature as Parte;
    const props = parte.properties;
    const pDesde = props.desde_m ?? 0;
    const pHasta = props.hasta_m ?? 0;
    if (props.linea !== inicio.linea || pHasta <= desde || pDesde >= hasta) {
      nuevas.push(feature);
      continue;
    }
    tocadas += 1;
    const a = Math.max(pDesde, desde);
    const b = Math.min(pHasta, hasta);
    const puntos = parte.geometry.coordinates;
    const escala = largo(puntos) / (pHasta - pDesde);
    const crear = (comienzo: number, fin: number, propiedades: Propiedades) => ({
      ...parte,
      properties: { ...propiedades, desde_m: comienzo, hasta_m: fin },
      geometry: {
        type: "LineString" as const,
        coordinates: recortar(puntos, (comienzo - pDesde) * escala, (fin - pDesde) * escala),
      },
    });
    if (a - pDesde > 0.001) nuevas.push(crear(pDesde, a, props));
    nuevas.push(crear(a, b, {
      ...props,
      paso: datos.paso,
      complejidad: datos.complejidad,
      observacion: datos.observacion?.trim() || null,
      comprobado_el: datos.paso === "por_explorar" ? null : datos.comprobadoEl,
    }));
    if (pHasta - b > 0.001) nuevas.push(crear(b, pHasta, props));
  }

  if (tocadas === 0) throw new Error("La parte elegida ya no está en la ruta. Volvé a cargarla y probá de nuevo.");
  return { ...preparada, features: nuevas };
}

export function datosDeParte(propiedades: Record<string, unknown> | null): DatosDeParte {
  const p = propiedades ?? {};
  return {
    paso: p.paso === "transitable" || p.paso === "a_pie" || p.paso === "sin_paso" ? p.paso : "por_explorar",
    complejidad: p.complejidad === "facil" || p.complejidad === "media" || p.complejidad === "dificil" ? p.complejidad : null,
    observacion: typeof p.observacion === "string" ? p.observacion : null,
    comprobadoEl: typeof p.comprobado_el === "string" ? p.comprobado_el : null,
  };
}

/** Al menos una X por parte cerrada, incluso si mide pocos metros. */
export function puntosSinPaso(geometria: FeatureCollection): FeatureCollection {
  const features: Feature[] = [];
  for (const feature of geometria.features) {
    if (feature.geometry?.type !== "LineString" || feature.properties?.paso !== "sin_paso") continue;
    const puntos = feature.geometry.coordinates;
    const longitud = largo(puntos);
    if (longitud <= 0) continue;
    const cantidad = Math.max(1, Math.ceil(longitud / 200));
    for (let i = 0; i < cantidad; i += 1) {
      features.push({
        type: "Feature",
        properties: { ...feature.properties },
        geometry: { type: "Point", coordinates: puntoEnDistancia(puntos, longitud * (i + 0.5) / cantidad) },
      });
    }
  }
  return { type: "FeatureCollection", features };
}
