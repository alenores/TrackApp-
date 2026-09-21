import { describe, expect, it } from "vitest";
import { hayQueIgnorarElTiron } from "@/lib/sin-recargar-al-tirar";

/**
 * Que el tirón hacia abajo desde arriba de todo no recargue la app, y que
 * eso no se lleve puesto ni el desplazamiento normal ni el mapa.
 */

describe("el tirón hacia abajo", () => {
  it("se ignora cuando no queda nada por ver arriba: eso era recargar", () => {
    expect(hayQueIgnorarElTiron({ haciaAbajo: true, enElMapa: false, quedaAlgoArriba: false })).toBe(true);
  });

  it("se respeta cuando hay contenido arriba: es desplazarse", () => {
    expect(hayQueIgnorarElTiron({ haciaAbajo: true, enElMapa: false, quedaAlgoArriba: true })).toBe(false);
  });

  it("hacia arriba nunca se toca", () => {
    expect(hayQueIgnorarElTiron({ haciaAbajo: false, enElMapa: false, quedaAlgoArriba: false })).toBe(false);
  });

  it("adentro del mapa nunca se toca: el mapa se maneja solo", () => {
    expect(hayQueIgnorarElTiron({ haciaAbajo: true, enElMapa: true, quedaAlgoArriba: false })).toBe(false);
  });
});
