import { describe, expect, it } from "vitest";
import type { FeatureCollection } from "geojson";
import {
  dibujarLinea,
  leerLinea,
  rectanguloDeLaLinea,
  simplificarLinea,
  type PuntoDeLinea,
} from "@/lib/salidas/linea";

function coleccion(...lineas: number[][][]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: lineas.map((coordinates) => ({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates },
    })),
  };
}

describe("simplificarLinea", () => {
  it("deja como mucho el máximo, con el primer y el último punto", () => {
    const larga = Array.from({ length: 1000 }, (_, i) => [-64 + i * 0.001, -31 - i * 0.001]);
    const linea = simplificarLinea(coleccion(larga), 150);
    expect(linea).toHaveLength(150);
    expect(linea[0]).toEqual([-64, -31]);
    expect(linea[149]).toEqual([-63.001, -31.999]);
  });

  it("junta los tramos de un archivo cortado en partes", () => {
    const linea = simplificarLinea(coleccion([[-64, -31], [-64.1, -31.1]], [[-64.2, -31.2], [-64.3, -31.3]]));
    expect(linea).toHaveLength(4);
  });

  it("sin línea, no hay nada que dibujar", () => {
    expect(simplificarLinea(coleccion())).toEqual([]);
  });
});

describe("leerLinea", () => {
  it("descarta lo que no es una línea", () => {
    expect(leerLinea(null)).toBeNull();
    expect(leerLinea("hola")).toBeNull();
    expect(leerLinea([[-64, -31]])).toBeNull();
    expect(leerLinea([[-64, -31], ["x", 2], [-64.1, -31.1]])).toEqual([
      [-64, -31],
      [-64.1, -31.1],
    ]);
  });
});

describe("rectanguloDeLaLinea", () => {
  it("contiene a toda la línea", () => {
    expect(
      rectanguloDeLaLinea([
        [-64.5, -31.2],
        [-64.1, -31.9],
        [-64.3, -31.0],
      ]),
    ).toEqual({ latNorte: -31, latSur: -31.9, lonEste: -64.1, lonOeste: -64.5 });
  });

  it("sin línea no hay rectángulo", () => {
    expect(rectanguloDeLaLinea([])).toBeNull();
  });
});

describe("dibujarLinea", () => {
  const caja = { x: 100, y: 50, ancho: 200, alto: 200 };

  it("encaja la línea en la caja con el norte arriba", () => {
    const deSurANorte: PuntoDeLinea[] = [
      [-64, -31.1],
      [-64, -31],
    ];
    const dibujo = dibujarLinea(deSurANorte, caja)!;
    // Arranca abajo (y grande) y termina arriba (y chica), centrada a lo ancho.
    expect(dibujo.inicio).toEqual([200, 250]);
    expect(dibujo.fin).toEqual([200, 50]);
  });

  it("no la deforma: una línea ancha queda centrada en alto", () => {
    const deOesteAEste: PuntoDeLinea[] = [
      [-64.1, -31],
      [-64, -31],
    ];
    const dibujo = dibujarLinea(deOesteAEste, caja)!;
    expect(dibujo.inicio).toEqual([100, 150]);
    expect(dibujo.fin).toEqual([300, 150]);
  });

  it("una línea que no se movió no se dibuja", () => {
    expect(
      dibujarLinea(
        [
          [-64, -31],
          [-64, -31],
        ],
        caja,
      ),
    ).toBeNull();
  });
});
