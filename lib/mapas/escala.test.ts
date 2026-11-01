import { describe, expect, it } from "vitest";
import { escalaDelMapa, metrosPorPunto } from "@/lib/mapas/escala";

/**
 * La escala dice cuánto mide el terreno en pantalla. Si la cuenta está mal,
 * el usuario calcula mal cuánto le falta, y eso se descubre caminando.
 */

describe("la escala del mapa", () => {
  it("en el ecuador, en el acercamiento 0, un punto son unos 78 km", () => {
    expect(metrosPorPunto(0, 0)).toBeCloseTo(78271.5, 0);
  });

  it("en la sierra el mismo acercamiento abarca menos metros que en el ecuador", () => {
    expect(metrosPorPunto(-31.4, 15)).toBeLessThan(metrosPorPunto(0, 15));
  });

  it("siempre muestra un largo redondo que entra en el ancho máximo", () => {
    for (const acercamiento of [10, 12, 14, 15, 16, 18]) {
      const { texto, ancho } = escalaDelMapa(-31.4, acercamiento, 100);
      expect(ancho).toBeLessThanOrEqual(100);
      expect(ancho).toBeGreaterThan(30);
      expect(texto).toMatch(/^(1|2|5|10|20|50|100|200|500) (m|km)$/);
    }
  });

  it("el ancho de la regla corresponde a los metros que dice", () => {
    const { texto, ancho } = escalaDelMapa(-31.4, 15, 100);
    const metros = texto.endsWith("km") ? Number(texto.split(" ")[0]) * 1000 : Number(texto.split(" ")[0]);
    expect(ancho * metrosPorPunto(-31.4, 15)).toBeCloseTo(metros, -1);
  });

  it("a partir de mil metros habla en kilómetros", () => {
    expect(escalaDelMapa(-31.4, 10).texto).toMatch(/km$/);
    expect(escalaDelMapa(-31.4, 18).texto).toMatch(/ m$/);
  });
});
