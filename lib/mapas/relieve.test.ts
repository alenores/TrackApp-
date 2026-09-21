import { describe, expect, it } from "vitest";
import {
  claveDeLaDireccionDelRelieve,
  pedazoDeRelieveQueCubre,
  CURVAS_CADA,
  CURVAS_DESDE,
} from "@/lib/mapas/relieve";

describe("la dirección del relieve guardado", () => {
  it("se traduce al nombre del pedazo en el depósito", () => {
    expect(claveDeLaDireccionDelRelieve("relieve://12/1309/2436")).toBe(
      "relieve/12/1309/2436",
    );
  });

  it("una dirección rota no llega al depósito", () => {
    expect(claveDeLaDireccionDelRelieve("relieve://12/1309")).toBeNull();
    expect(claveDeLaDireccionDelRelieve("relieve://a/b/c")).toBeNull();
    expect(claveDeLaDireccionDelRelieve("sin-protocolo")).toBeNull();
  });
});

describe("cada cuánto va una curva", () => {
  it("de cerca cada 25 m, como fija la decisión 013", () => {
    const masCerca = Math.max(...Object.keys(CURVAS_CADA).map(Number));
    expect(CURVAS_CADA[masCerca][0]).toBe(25);
  });

  it("la gruesa es siempre múltiplo de la fina, así el número cae sobre una curva", () => {
    for (const [fina, gruesa] of Object.values(CURVAS_CADA)) {
      expect(gruesa % fina).toBe(0);
    }
  });

  it("de lejos no se dibujan: serían una maraña", () => {
    expect(CURVAS_DESDE).toBeGreaterThanOrEqual(10);
  });
});

describe("qué pedazo de relieve cubre a cada pedazo de curvas", () => {
  it("al mismo acercamiento es el mismo pedazo", () => {
    expect(pedazoDeRelieveQueCubre("relieve-contour://12/1309/2436?x=1")).toBe(
      "relieve/12/1309/2436",
    );
  });

  it("de más cerca, es el pedazo grande que lo contiene", () => {
    expect(pedazoDeRelieveQueCubre("relieve-contour://14/5237/9745")).toBe(
      "relieve/12/1309/2436",
    );
    expect(pedazoDeRelieveQueCubre("relieve-contour://15/10474/19491")).toBe(
      "relieve/12/1309/2436",
    );
  });

  it("de más lejos que el relieve no hay curvas", () => {
    expect(pedazoDeRelieveQueCubre("relieve-contour://10/327/609")).toBeNull();
  });
});
