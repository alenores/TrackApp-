import { describe, expect, it } from "vitest";
import { colorDeLasCurvas, type ColoresDelMapa } from "@/components/mapa/colores";

const colores = {
  curva: "violeta",
  curvaSobreFoto: "naranja",
} as ColoresDelMapa;

describe("color de las curvas de nivel", () => {
  it("sobre la foto satelital van en naranja clarito", () => {
    expect(colorDeLasCurvas(true, colores)).toBe("naranja");
  });

  it("en el mapa simple siguen en violeta", () => {
    expect(colorDeLasCurvas(false, colores)).toBe("violeta");
  });
});
