import { describe, expect, it } from "vitest";
import { descripcionCorta } from "@/lib/anotaciones/descripcion-en-el-mapa";

describe("la descripción que se escribe en el mapa", () => {
  it("una corta va entera", () => {
    expect(descripcionCorta("Agua todo el año")).toBe("Agua todo el año");
  });

  it("una larga se corta en una palabra entera, con «…»", () => {
    const corta = descripcionCorta("Tranquera con candado, pedir permiso al dueño de la casa de piedra");
    expect(corta).toBe("Tranquera con candado, pedir permiso al…");
    expect(corta!.length).toBeLessThanOrEqual(41);
  });

  it("los saltos de línea y espacios de más quedan en uno", () => {
    expect(descripcionCorta("  Mirador\n\nnorte  ")).toBe("Mirador norte");
  });

  it("sin descripción no hay texto", () => {
    expect(descripcionCorta(null)).toBeNull();
    expect(descripcionCorta("   ")).toBeNull();
  });
});
