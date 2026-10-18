import { describe, expect, it } from "vitest";
import type { FeatureCollection } from "geojson";
import { perfilDeLaSalida } from "@/lib/salidas/perfil";

function coleccion(coordinates: number[][]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } }],
  };
}

describe("perfil de una salida", () => {
  it("arma el gráfico con la altura de cada punto", () => {
    const perfil = perfilDeLaSalida(coleccion([
      [-64.5, -31.5, 1800],
      [-64.5, -31.51, 1900],
    ]));

    expect(perfil).not.toBeNull();
    expect(perfil?.[0].alturaM).toBe(1800);
    expect(perfil?.[1].alturaM).toBe(1900);
    expect(perfil?.[1].distanciaM).toBeGreaterThan(perfil?.[0].distanciaM ?? 0);
  });

  it("no inventa alturas si el archivo no las trae", () => {
    expect(perfilDeLaSalida(coleccion([
      [-64.5, -31.5],
      [-64.5, -31.51],
    ]))).toBeNull();
  });
});
