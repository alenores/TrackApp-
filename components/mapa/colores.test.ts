import { describe, expect, it } from "vitest";
import { colorDeLasCurvas, colorDelEnvoltorio, type ColoresDelMapa } from "@/components/mapa/colores";

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

describe("envoltorio de la línea", () => {
  const par = { parteX: "oscuro", parteXHalo: "claro" } as ColoresDelMapa;

  it("va claro sobre terreno oscuro", () => {
    expect(colorDelEnvoltorio(true, par)).toBe("claro");
  });

  it("va oscuro sobre el mapa simple de día", () => {
    expect(colorDelEnvoltorio(false, par)).toBe("oscuro");
  });
});
