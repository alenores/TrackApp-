import { describe, expect, it } from "vitest";
import {
  ANCHO_DE_CAMINO,
  ANCHO_DE_CAMINO_SECUNDARIO,
  ANCHO_DE_CAMINO_TENTATIVO,
  ANCHO_DE_PARTE_ELEGIDA,
  BORDE_DE_CAMINO,
  grosorSegunZoom,
} from "@/components/mapa/anchos-de-camino";

describe("anchos de Camino según el zoom", () => {
  it("de lejos es más fino que de cerca, y de cerca queda como antes", () => {
    expect(grosorSegunZoom(ANCHO_DE_CAMINO, 10)).toBeLessThan(grosorSegunZoom(ANCHO_DE_CAMINO, 14));
    expect(grosorSegunZoom(ANCHO_DE_CAMINO, 16)).toBe(5);
    expect(grosorSegunZoom(BORDE_DE_CAMINO, 16)).toBe(8);
    expect(grosorSegunZoom(ANCHO_DE_CAMINO_TENTATIVO, 16)).toBe(2.5);
    expect(grosorSegunZoom(ANCHO_DE_CAMINO_SECUNDARIO, 16)).toBe(3);
  });

  it("al alejarse no queda tan grueso como para armar una mancha", () => {
    expect(grosorSegunZoom(ANCHO_DE_CAMINO, 10)).toBeLessThan(2);
    expect(grosorSegunZoom(BORDE_DE_CAMINO, 10)).toBeLessThan(3);
  });

  it("el halo de la parte elegida es más ancho que el Camino a cualquier zoom", () => {
    for (const zoom of [10, 12, 14, 16]) {
      expect(grosorSegunZoom(ANCHO_DE_PARTE_ELEGIDA, zoom))
        .toBeGreaterThan(grosorSegunZoom(BORDE_DE_CAMINO, zoom));
    }
  });
});
