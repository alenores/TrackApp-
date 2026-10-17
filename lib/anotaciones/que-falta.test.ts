import { describe, expect, it } from "vitest";
import { avisoSiNoEligio } from "@/lib/anotaciones/que-falta";

describe("avisar si falta elegir", () => {
  it("un punto nuevo sin tipo dice qué falta", () => {
    expect(avisoSiNoEligio("punto", null, null)).toBe("Elegí qué es el punto.");
  });

  it("un punto con tipo no avisa", () => {
    expect(avisoSiNoEligio("punto", "fuente", null)).toBeNull();
  });

  it("un trazo nuevo sin color dice qué falta", () => {
    expect(avisoSiNoEligio("trazo", null, null)).toBe("Elegí el color del trazo.");
  });

  it("un trazo con color no avisa", () => {
    expect(avisoSiNoEligio("trazo", null, "agua")).toBeNull();
  });
});
