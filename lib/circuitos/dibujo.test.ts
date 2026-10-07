import { describe, expect, it } from "vitest";
import type { Position } from "geojson";
import {
  dibujarCircuito,
  toqueLibre,
  toqueSobreCamino,
  type CaminoParaCircuito,
  type ToqueDelCircuito,
} from "@/lib/circuitos/dibujo";

const CAMINO: CaminoParaCircuito = {
  id: 7,
  versionForma: 1,
  coordenadas: [[0, 0], [0.001, 0], [0.001, 0.001]],
};

function libre(punto: Position): ToqueDelCircuito {
  const resultado = toqueLibre(punto);
  if (!resultado.ok) throw new Error(resultado.error);
  return resultado.datos;
}

function sobre(punto: Position): ToqueDelCircuito {
  const resultado = toqueSobreCamino(punto, CAMINO, "mountain_bike");
  if (!resultado.ok) throw new Error(resultado.error);
  return resultado.datos;
}

describe("dibujo de un Circuito punto por punto", () => {
  it("puede empezar y seguir fuera de todos los Caminos", () => {
    const resultado = dibujarCircuito([libre([0, 0.002]), libre([0.001, 0.002])], [CAMINO]);
    expect(resultado).toMatchObject({ ok: true, datos: [{ tipo: "libre", coordenadas: [[0, 0.002], [0.001, 0.002]] }] });
  });

  it("sigue los quiebres del Camino cuando los dos toques caen sobre él", () => {
    const resultado = dibujarCircuito([sobre([0, 0]), sobre([0.001, 0.001])], [CAMINO]);
    expect(resultado).toMatchObject({
      ok: true,
      datos: [{ tipo: "sobre_camino", caminoId: 7, coordenadas: [[0, 0], [0.001, 0], [0.001, 0.001]] }],
    });
  });

  it("sale del Camino al tocar afuera y puede volver a seguirlo", () => {
    const toques = [sobre([0, 0]), sobre([0.001, 0]), libre([0.002, 0.001]), sobre([0.001, 0]), sobre([0.001, 0.001])];
    const resultado = dibujarCircuito(toques, [CAMINO]);
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.datos.map((parte) => parte.tipo)).toEqual(["sobre_camino", "libre", "libre", "sobre_camino"]);
    expect(resultado.datos[1].coordenadas).toEqual([[0.001, 0], [0.002, 0.001]]);
  });

  it("también sigue el Camino en sentido contrario", () => {
    const resultado = dibujarCircuito([sobre([0.001, 0.001]), sobre([0, 0])], [CAMINO]);
    expect(resultado).toMatchObject({
      ok: true,
      datos: [{ tipo: "sobre_camino", coordenadas: [[0.001, 0.001], [0.001, 0], [0, 0]] }],
    });
  });

  it("no usa metros viejos sobre un Camino corregido sin actualizar el vínculo", () => {
    const toques = [sobre([0, 0]), sobre([0.001, 0.001])];
    const resultado = dibujarCircuito(toques, [{ ...CAMINO, versionForma: 2 }]);
    expect(resultado).toMatchObject({ ok: false });
    if (!resultado.ok) expect(resultado.error).toContain("Actualizá el Circuito con señal");
  });

  it("no modifica la línea del Camino al usarla para el Circuito", () => {
    const original = structuredClone(CAMINO.coordenadas);
    dibujarCircuito([sobre([0.001, 0.001]), sobre([0, 0])], [CAMINO]);
    expect(CAMINO.coordenadas).toEqual(original);
  });
});
