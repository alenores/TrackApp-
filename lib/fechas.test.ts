import { describe, expect, it } from "vitest";
import { diaEnPalabras } from "@/lib/fechas";

describe("diaEnPalabras", () => {
  it("no corre el día por la diferencia horaria", () => {
    expect(diaEnPalabras("2026-10-02")).toBe("2 de octubre de 2026");
  });

  it("dice que no hay fecha cuando no la entiende", () => {
    expect(diaEnPalabras("cualquier cosa")).toBe("—");
  });
});
