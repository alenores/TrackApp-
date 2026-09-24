import { describe, expect, it } from "vitest";
import { anotacionesDelLugar, caeDentroDe } from "@/lib/anotaciones/lugar";
import type { Anotacion, Rectangulo } from "@/types/database";

/**
 * Que una anotación marcada desde la navegación, sin sector, aparezca donde
 * está de verdad. Si esto falla, alguien marca un cruce peligroso y nadie lo
 * ve en el mapa de la zona.
 */

const RECTANGULO: Rectangulo = { latNorte: -31.9, latSur: -32.0, lonOeste: -65.0, lonEste: -64.9 };

function anotacion(
  id: number,
  sectorId: number | null,
  geometria: Anotacion["geometria"],
): Anotacion {
  return {
    id,
    sectorId,
    perfilId: "x",
    deAdministrador: false,
    tipo: geometria.type === "Point" ? "punto" : "trazo",
    origen: "navegacion",
    icono: geometria.type === "Point" ? "cruce" : null,
    color: geometria.type === "Point" ? null : "#000000",
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

describe("dónde cae una anotación", () => {
  it("un punto adentro cae adentro", () => {
    expect(caeDentroDe(anotacion(1, null, { type: "Point", coordinates: [-64.95, -31.95] }), RECTANGULO)).toBe(true);
  });

  it("un punto afuera cae afuera", () => {
    expect(caeDentroDe(anotacion(1, null, { type: "Point", coordinates: [-64.5, -31.95] }), RECTANGULO)).toBe(false);
  });

  it("un trazo que entra aunque sea un pedazo cae adentro", () => {
    const trazo = anotacion(1, null, {
      type: "LineString",
      coordinates: [[-64.5, -31.95], [-64.95, -31.95]],
    });
    expect(caeDentroDe(trazo, RECTANGULO)).toBe(true);
  });
});

describe("las anotaciones de un lugar", () => {
  const sector = { id: 7, rectangulo: RECTANGULO };

  it("trae las anotadas al sector", () => {
    const deOtroLado = anotacion(1, 7, { type: "Point", coordinates: [-10, -10] });
    expect(anotacionesDelLugar([deOtroLado], [sector])).toHaveLength(1);
  });

  it("trae las sin sector que caen adentro", () => {
    const sinSector = anotacion(2, null, { type: "Point", coordinates: [-64.95, -31.95] });
    expect(anotacionesDelLugar([sinSector], [sector])).toHaveLength(1);
  });

  it("no trae las sin sector que caen afuera", () => {
    const lejos = anotacion(3, null, { type: "Point", coordinates: [-60, -30] });
    expect(anotacionesDelLugar([lejos], [sector])).toHaveLength(0);
  });

  it("no trae las anotadas a otro sector aunque caigan adentro", () => {
    const deOtro = anotacion(4, 99, { type: "Point", coordinates: [-64.95, -31.95] });
    expect(anotacionesDelLugar([deOtro], [sector])).toHaveLength(0);
  });

  it("el rectángulo extra también cuenta: el de la ruta que se navega", () => {
    const cerca = anotacion(5, null, { type: "Point", coordinates: [-60.5, -30.5] });
    const ruta: Rectangulo = { latNorte: -30, latSur: -31, lonOeste: -61, lonEste: -60 };
    expect(anotacionesDelLugar([cerca], [], ruta)).toHaveLength(1);
  });
});
