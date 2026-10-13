import { describe, expect, it } from "vitest";
import type { RespuestaDeOsm } from "@/lib/anotaciones/importar";
import { barrerasNuevas, resumenDeBarreras } from "@/lib/marcas/osm";

const respuesta: RespuestaDeOsm = {
  elements: [
    { type: "node", lat: -31.5, lon: -64.5, tags: { barrier: "gate" } },
    { type: "node", lat: -31.5, lon: -64.5, tags: { barrier: "gate" } },
    { type: "way", geometry: [{ lat: -31.6, lon: -64.6 }, { lat: -31.7, lon: -64.7 }], tags: { barrier: "fence" } },
    { type: "node", lat: -31.4, lon: -64.4, tags: { barrier: "bollard" } },
  ],
};

describe("tranqueras y alambrados de una zona", () => {
  it("trae tranqueras y alambrados, sin repetir ni sumar otras cosas", () => {
    const resultado = barrerasNuevas(respuesta, []);
    expect(resultado.nuevas.map((cada) => cada.tipo)).toEqual(["punto", "trazo"]);
    expect(resultado.nuevas[0].icono).toBe("tranquera");
    expect(resultado.repetidas).toBe(1);
    expect(resultado.ignoradas).toBe(1);
  });

  it("volver a pedir no duplica lo que ya está guardado", () => {
    const primera = barrerasNuevas(respuesta, []);
    const segunda = barrerasNuevas(respuesta, primera.nuevas.map((cada) => cada.geometria));
    expect(segunda.nuevas).toEqual([]);
    expect(resumenDeBarreras(segunda)).toContain("no tiene tranqueras ni alambrados nuevos");
  });

  it("un alambrado entra entero aunque salga de la zona: no se recorta", () => {
    const [, alambrado] = barrerasNuevas(respuesta, []).nuevas;
    expect(alambrado.geometria.coordinates).toHaveLength(2);
  });

  it("cuenta lo que se sumó", () => {
    expect(resumenDeBarreras(barrerasNuevas(respuesta, []))).toBe("Se sumaron 1 tranquera y 1 alambrado de OpenStreetMap.");
  });
});
