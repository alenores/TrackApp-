import { describe, expect, it } from "vitest";
import { tituloDelPunto } from "@/lib/anotaciones/titulo-del-punto";

describe("el título del punto", () => {
  it("usa el título propio cuando está", () => {
    expect(tituloDelPunto({ titulo: "Cruce del arroyo", comentario: "Largo" })).toBe("Cruce del arroyo");
  });

  it("si no hay título, usa el comentario viejo", () => {
    expect(tituloDelPunto({ titulo: null, comentario: "Agua a la sombra" })).toBe("Agua a la sombra");
  });

  it("sin título ni comentario no hay texto", () => {
    expect(tituloDelPunto({ titulo: "  ", comentario: null })).toBeNull();
  });
});
