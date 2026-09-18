import { describe, expect, it } from "vitest";
import type { FeatureCollection } from "geojson";
import {
  calcularCobertura,
  calcularHuecoDeZona,
  coberturaCompleta,
  extraerLineas,
  puntoDentroDelRectangulo,
} from "@/lib/cobertura";
import type { Rectangulo, Sector } from "@/types/database";

/**
 * De esta función depende que alguien salga al cerro sabiendo, o no sabiendo,
 * que le falta un mapa. Si se rompe en silencio, se rompe en el peor lugar.
 */

function rectangulo(
  latNorte: number,
  latSur: number,
  lonEste: number,
  lonOeste: number,
): Rectangulo {
  return { latNorte, latSur, lonEste, lonOeste };
}

function sector(id: number, nombre: string, rect: Rectangulo): Sector {
  return {
    id,
    zonaId: 1,
    perfilId: "perfil",
    nombre,
    descripcion: null,
    rectangulo: rect,
    creadoEn: "2026-01-01T00:00:00Z",
    actualizadoEn: "2026-01-01T00:00:00Z",
  };
}

function linea(coordenadas: Array<[number, number]>): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: coordenadas },
      },
    ],
  };
}

// Sierras de Córdoba: latitud sur y longitud oeste, los dos negativos.
const OESTE = rectangulo(-31.4, -31.6, -64.7, -64.9);
const ESTE = rectangulo(-31.4, -31.6, -64.5, -64.7);

describe("puntoDentroDelRectangulo", () => {
  it("reconoce un punto adentro", () => {
    expect(puntoDentroDelRectangulo(-64.8, -31.5, OESTE)).toBe(true);
  });

  it("reconoce un punto afuera", () => {
    expect(puntoDentroDelRectangulo(-64.2, -31.5, OESTE)).toBe(false);
  });

  it("cuenta el borde como adentro", () => {
    expect(puntoDentroDelRectangulo(-64.7, -31.4, OESTE)).toBe(true);
  });
});

describe("extraerLineas", () => {
  it("descarta una línea de un solo punto, que no es una línea", () => {
    expect(extraerLineas(linea([[-64.8, -31.5]]))).toHaveLength(0);
  });

  it("toma las líneas de un MultiLineString", () => {
    const geometria: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "MultiLineString",
            coordinates: [
              [
                [-64.8, -31.5],
                [-64.79, -31.5],
              ],
              [
                [-64.6, -31.5],
                [-64.59, -31.5],
              ],
            ],
          },
        },
      ],
    };

    expect(extraerLineas(geometria)).toHaveLength(2);
  });
});

describe("calcularCobertura", () => {
  it("encuentra el único sector por el que pasa", () => {
    const cobertura = calcularCobertura(
      linea([
        [-64.85, -31.5],
        [-64.75, -31.5],
      ]),
      [sector(1, "Oeste", OESTE), sector(2, "Este", ESTE)],
    );

    expect(cobertura.sectores.map((s) => s.sector.id)).toEqual([1]);
    expect(cobertura.metrosSinCobertura).toBe(0);
  });

  it("encuentra los dos sectores cuando la ruta los cruza a los dos", () => {
    const cobertura = calcularCobertura(
      linea([
        [-64.85, -31.5],
        [-64.55, -31.5],
      ]),
      [sector(1, "Oeste", OESTE), sector(2, "Este", ESTE)],
    );

    expect(cobertura.sectores.map((s) => s.sector.id).sort()).toEqual([1, 2]);
  });

  it("marca cuáles están descargados y cuáles faltan", () => {
    const cobertura = calcularCobertura(
      linea([
        [-64.85, -31.5],
        [-64.55, -31.5],
      ]),
      [sector(1, "Oeste", OESTE), sector(2, "Este", ESTE)],
      new Set([1]),
    );

    const porId = new Map(
      cobertura.sectores.map((s) => [s.sector.id, s.estado]),
    );
    expect(porId.get(1)).toBe("descargado");
    expect(porId.get(2)).toBe("falta_descargar");
  });

  it("mide el tramo que no cubre ningún sector", () => {
    // La ruta empieza bien al oeste de todo, fuera de cualquier sector.
    const cobertura = calcularCobertura(
      linea([
        [-65.1, -31.5],
        [-64.8, -31.5],
      ]),
      [sector(1, "Oeste", OESTE)],
    );

    expect(cobertura.metrosSinCobertura).toBeGreaterThan(0);
    expect(cobertura.metrosSinCobertura).toBeLessThan(cobertura.metrosTotales);
  });

  it("avisa cuando ningún sector cubre nada de la ruta", () => {
    const cobertura = calcularCobertura(
      linea([
        [-60.1, -31.5],
        [-60.0, -31.5],
      ]),
      [sector(1, "Oeste", OESTE)],
    );

    expect(cobertura.sectores).toHaveLength(0);
    expect(cobertura.metrosSinCobertura).toBe(cobertura.metrosTotales);
    expect(cobertura.metrosSinCobertura).toBeGreaterThan(0);
  });

  it("mide el largo sobre el recorrido y no sobre la cantidad de puntos", () => {
    // Un grado de longitud en esta latitud son unos 95 km.
    const cobertura = calcularCobertura(
      linea([
        [-64.8, -31.5],
        [-64.7, -31.5],
      ]),
      [],
    );

    expect(cobertura.metrosTotales).toBeGreaterThan(9000);
    expect(cobertura.metrosTotales).toBeLessThan(10500);
  });

  it("no se cae con un recorrido vacío", () => {
    const vacio: FeatureCollection = { type: "FeatureCollection", features: [] };
    const cobertura = calcularCobertura(vacio, [sector(1, "Oeste", OESTE)]);

    expect(cobertura.sectores).toHaveLength(0);
    expect(cobertura.metrosTotales).toBe(0);
  });

  it("ignora coordenadas rotas en vez de devolver números sin sentido", () => {
    const rota = linea([
      [-64.8, -31.5],
      [Number.NaN, -31.5],
      [-64.7, -31.5],
    ]);

    expect(Number.isFinite(calcularCobertura(rota, []).metrosTotales)).toBe(
      true,
    );
  });
});

describe("coberturaCompleta", () => {
  it("es falsa si falta bajar un sector", () => {
    const cobertura = calcularCobertura(
      linea([
        [-64.85, -31.5],
        [-64.75, -31.5],
      ]),
      [sector(1, "Oeste", OESTE)],
    );

    expect(coberturaCompleta(cobertura)).toBe(false);
  });

  it("es falsa si hay un tramo sin cobertura, aunque esté todo bajado", () => {
    const cobertura = calcularCobertura(
      linea([
        [-65.1, -31.5],
        [-64.8, -31.5],
      ]),
      [sector(1, "Oeste", OESTE)],
      new Set([1]),
    );

    expect(coberturaCompleta(cobertura)).toBe(false);
  });

  it("es verdadera cuando está todo bajado y no falta territorio", () => {
    const cobertura = calcularCobertura(
      linea([
        [-64.85, -31.5],
        [-64.75, -31.5],
      ]),
      [sector(1, "Oeste", OESTE)],
      new Set([1]),
    );

    expect(coberturaCompleta(cobertura)).toBe(true);
  });
});

describe("calcularHuecoDeZona", () => {
  const ZONA = rectangulo(-31.4, -31.6, -64.5, -64.9);

  it("dice que está todo cubierto cuando un sector tapa la zona entera", () => {
    const hueco = calcularHuecoDeZona(ZONA, [sector(1, "Todo", ZONA)]);
    expect(hueco.proporcionSinCubrir).toBe(0);
  });

  it("dice que no hay nada cubierto cuando no hay sectores", () => {
    expect(calcularHuecoDeZona(ZONA, []).proporcionSinCubrir).toBe(1);
  });

  it("detecta la mitad sin cubrir", () => {
    const hueco = calcularHuecoDeZona(ZONA, [sector(1, "Oeste", OESTE)]);
    expect(hueco.proporcionSinCubrir).toBeGreaterThan(0.45);
    expect(hueco.proporcionSinCubrir).toBeLessThan(0.55);
  });
});
