import type { FeatureCollection } from "geojson";
import { describe, expect, it } from "vitest";
import { TRAZO } from "@/lib/anotaciones/colores-de-trazo";
import {
  anotacionesDeGoogleEarth,
  anotacionesDeOsm,
  colorDeTrazoMasParecido,
  iconoPorElNombre,
  resumenDeImportacion,
  type RespuestaDeOsm,
} from "@/lib/anotaciones/importar";
import type { Anotacion, Rectangulo } from "@/types/database";

/**
 * Que lo que viene de afuera entre como corresponde: solo lo del sector, sin
 * repetir, y con el ícono y el color que uno esperaría.
 */

const SECTOR: Rectangulo = { latNorte: -31.9, latSur: -32.0, lonOeste: -65.0, lonEste: -64.9 };

function existente(geometria: Anotacion["geometria"]): Anotacion {
  return {
    id: 1,
    sectorId: 1,
    perfilId: "x",
    deAdministrador: true,
    tipo: geometria.type === "Point" ? "punto" : "trazo",
    origen: "manual",
    icono: null,
    color: null,
    comentario: null,
    fotoUrl: null,
    fotoChicaUrl: null,
    geometria,
    marcadaEn: "",
    precisionGpsMetros: null,
    creadoEn: "",
    actualizadoEn: "",
  };
}

describe("adivinar el ícono por el nombre", () => {
  it.each([
    ["Refugio Los Tabaquillos", "refugio"],
    ["Puesto de Irene", "refugio"],
    ["Cerro Champaquí", "cumbre"],
    ["Vado del arroyo", "arroyo"],
    ["Tranquera de la estancia", "tranquera"],
    ["Mirador", "mirador"],
    ["", "cruce"],
    ["Cosa rara", "cruce"],
  ])("«%s» → %s", (nombre, icono) => {
    expect(iconoPorElNombre(nombre)).toBe(icono);
  });
});

describe("el color del trazo más parecido", () => {
  it("un celeste va a Agua, un naranja a Huella, un rojo a Peligro", () => {
    expect(colorDeTrazoMasParecido("#00aaff")).toBe("agua");
    expect(colorDeTrazoMasParecido("#ff8800")).toBe("huella");
    expect(colorDeTrazoMasParecido("#ff0000")).toBe("peligro");
  });

  it("sin color, o con uno raro, va a Huella", () => {
    expect(colorDeTrazoMasParecido(null)).toBe("huella");
    expect(colorDeTrazoMasParecido("azul")).toBe("huella");
  });
});

describe("desde Google Earth", () => {
  const figuras: FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Refugio Nores", description: "Dormimos acá" },
        geometry: { type: "Point", coordinates: [-64.95, -31.95, 1200] },
      },
      {
        type: "Feature",
        properties: { name: "Huella al puesto", stroke: "#ff9900" },
        geometry: {
          type: "LineString",
          coordinates: [
            [-64.95, -31.95, 0],
            [-64.94, -31.94, 0],
          ],
        },
      },
      {
        type: "Feature",
        properties: { name: "Afuera" },
        geometry: { type: "Point", coordinates: [-60, -30] },
      },
      {
        type: "Feature",
        properties: { name: "Un área" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-64.95, -31.95],
              [-64.94, -31.95],
              [-64.94, -31.94],
              [-64.95, -31.95],
            ],
          ],
        },
      },
    ],
  };

  it("cada marcador es un punto y cada línea un trazo, sin la altura", () => {
    const r = anotacionesDeGoogleEarth(figuras, SECTOR, []);
    expect(r.dentro).toHaveLength(2);
    const [punto, trazo] = r.dentro;
    expect(punto.tipo).toBe("punto");
    expect(punto.icono).toBe("refugio");
    expect(punto.comentario).toBe("Refugio Nores. Dormimos acá");
    expect(punto.geometria.coordinates).toEqual([-64.95, -31.95]);
    expect(trazo.tipo).toBe("trazo");
    expect(trazo.color).toBe(TRAZO.huella.color);
    expect((trazo.geometria as { coordinates: number[][] }).coordinates[0]).toHaveLength(2);
  });

  it("lo de afuera y las áreas se cuentan y no entran", () => {
    const r = anotacionesDeGoogleEarth(figuras, SECTOR, []);
    expect(r.fuera).toBe(1);
    expect(r.ignoradas).toBe(1);
  });

  it("lo que ya está no se repite", () => {
    const ya = [existente({ type: "Point", coordinates: [-64.95, -31.95] })];
    const r = anotacionesDeGoogleEarth(figuras, SECTOR, ya);
    expect(r.repetidas).toBe(1);
    expect(r.dentro.map((cada) => cada.tipo)).toEqual(["trazo"]);
  });
});

describe("desde OpenStreetMap", () => {
  const respuesta: RespuestaDeOsm = {
    elements: [
      { type: "node", lat: -31.95, lon: -64.95, tags: { barrier: "gate" } },
      { type: "node", lat: -31.96, lon: -64.96, tags: { barrier: "gate", name: "La Estancia" } },
      {
        type: "way",
        geometry: [
          { lat: -31.95, lon: -64.95 },
          { lat: -31.94, lon: -64.94 },
        ],
        tags: { barrier: "fence" },
      },
      { type: "node", lat: -31.95, lon: -64.95, tags: { natural: "tree" } },
      { type: "node", lat: -20, lon: -60, tags: { barrier: "gate" } },
    ],
  };

  it("una tranquera es un punto con su ícono; un alambrado, un trazo color Límite", () => {
    const r = anotacionesDeOsm(respuesta, SECTOR, []);
    const tranqueras = r.dentro.filter((cada) => cada.icono === "tranquera");
    const alambrados = r.dentro.filter((cada) => cada.tipo === "trazo");
    expect(tranqueras).toHaveLength(2);
    expect(tranqueras[1].comentario).toBe("Tranquera: La Estancia");
    expect(alambrados).toHaveLength(1);
    expect(alambrados[0].color).toBe(TRAZO.limite.color);
    expect(alambrados[0].comentario).toBe("Alambrado");
  });

  it("lo que no es tranquera ni alambrado se saltea, y lo de afuera no entra", () => {
    const r = anotacionesDeOsm(respuesta, SECTOR, []);
    expect(r.ignoradas).toBe(1);
    expect(r.fuera).toBe(1);
  });

  it("traerlas dos veces no duplica", () => {
    const primera = anotacionesDeOsm(respuesta, SECTOR, []);
    const yaEstan = primera.dentro.map((cada) => existente(cada.geometria));
    const segunda = anotacionesDeOsm(respuesta, SECTOR, yaEstan);
    expect(segunda.dentro).toHaveLength(0);
    expect(segunda.repetidas).toBe(3);
  });
});

describe("el resumen para la pantalla", () => {
  it("dice qué entra y qué no, en criollo", () => {
    const linea = { tipo: "trazo" as const, icono: null, color: "#000", comentario: null };
    const texto = resumenDeImportacion({
      dentro: [
        { tipo: "punto", icono: "tranquera", color: null, comentario: null, geometria: { type: "Point", coordinates: [0, 0] } },
        { ...linea, geometria: { type: "LineString", coordinates: [[0, 0], [1, 1]] } },
        { ...linea, geometria: { type: "LineString", coordinates: [[0, 0], [2, 2]] } },
      ],
      fuera: 2,
      repetidas: 1,
      ignoradas: 0,
    });
    expect(texto).toBe(
      "Se van a agregar 1 punto y 2 trazos. 2 caen fuera del sector y no entran. 1 ya estaba y no se repite.",
    );
  });

  it("cuando no entra nada, lo dice", () => {
    expect(resumenDeImportacion({ dentro: [], fuera: 0, repetidas: 0, ignoradas: 0 })).toBe(
      "No hay nada nuevo para agregar.",
    );
  });
});
