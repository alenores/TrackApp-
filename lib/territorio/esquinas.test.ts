import { describe, expect, it } from "vitest";
import {
  rectanguloDeLosCampos,
  territorioDesdeRectangulo,
  TERRITORIO_VACIO,
} from "@/lib/territorio/esquinas";

/**
 * Las pruebas de las dos esquinas.
 *
 * Que las esquinas queden al revés no rompe nada visible: guarda un rectángulo
 * dado vuelta, y lo que se descarga después es el pedazo de mapa equivocado.
 * Por eso lo tiene que agarrar la máquina.
 */

const NOROESTE = "-31.9542, -64.9402";
const SUDESTE = "-31.9968, -64.8931";

describe("armar el rectángulo con las dos esquinas", () => {
  it("lo arma cuando las dos esquinas están bien", () => {
    const armado = rectanguloDeLosCampos({
      ...TERRITORIO_VACIO,
      noroeste: NOROESTE,
      sudeste: SUDESTE,
    });

    expect(armado.ok).toBe(true);
    if (!armado.ok) return;

    expect(armado.rectangulo.latNorte).toBeCloseTo(-31.9542, 4);
    expect(armado.rectangulo.latSur).toBeCloseTo(-31.9968, 4);
    expect(armado.rectangulo.lonOeste).toBeCloseTo(-64.9402, 4);
    expect(armado.rectangulo.lonEste).toBeCloseTo(-64.8931, 4);
  });

  it("siempre deja el norte más al norte que el sur", () => {
    const armado = rectanguloDeLosCampos({
      ...TERRITORIO_VACIO,
      noroeste: NOROESTE,
      sudeste: SUDESTE,
    });

    expect(armado.ok).toBe(true);
    if (!armado.ok) return;
    expect(armado.rectangulo.latNorte).toBeGreaterThan(armado.rectangulo.latSur);
    expect(armado.rectangulo.lonEste).toBeGreaterThan(armado.rectangulo.lonOeste);
  });

  it("avisa cuando las esquinas están pegadas al revés de norte a sur", () => {
    const armado = rectanguloDeLosCampos({
      ...TERRITORIO_VACIO,
      noroeste: SUDESTE,
      sudeste: NOROESTE,
    });

    expect(armado.ok).toBe(false);
    if (armado.ok) return;
    expect(armado.error).toContain("al revés");
  });

  it("avisa cuando las esquinas están pegadas al revés de este a oeste", () => {
    const armado = rectanguloDeLosCampos({
      ...TERRITORIO_VACIO,
      noroeste: "-31.9542, -64.8931",
      sudeste: "-31.9968, -64.9402",
    });

    expect(armado.ok).toBe(false);
    if (armado.ok) return;
    expect(armado.error).toContain("al revés");
  });

  it("no reta al usuario cuando todavía no completó una esquina", () => {
    const armado = rectanguloDeLosCampos({
      ...TERRITORIO_VACIO,
      noroeste: NOROESTE,
      sudeste: "",
    });

    expect(armado.ok).toBe(false);
    if (armado.ok) return;
    expect(armado.error).toBeNull();
  });

  it("avisa cuando una esquina no se entiende", () => {
    const armado = rectanguloDeLosCampos({
      ...TERRITORIO_VACIO,
      noroeste: NOROESTE,
      sudeste: "el refugio",
    });

    expect(armado.ok).toBe(false);
    if (armado.ok) return;
    expect(armado.error).toContain("no se entiende");
  });

  it("no acepta un rectángulo de altura cero", () => {
    const armado = rectanguloDeLosCampos({
      ...TERRITORIO_VACIO,
      noroeste: "-31.9542, -64.9402",
      sudeste: "-31.9542, -64.8931",
    });

    expect(armado.ok).toBe(false);
  });
});

describe("volver del rectángulo a los campos", () => {
  it("vuelve a armar las mismas dos esquinas", () => {
    const original = {
      latNorte: -31.9542,
      latSur: -31.9968,
      lonEste: -64.8931,
      lonOeste: -64.9402,
    };

    const campos = territorioDesdeRectangulo("Refugio", null, original);
    const devuelta = rectanguloDeLosCampos(campos);

    expect(devuelta.ok).toBe(true);
    if (!devuelta.ok) return;
    expect(devuelta.rectangulo).toEqual(original);
  });
});
