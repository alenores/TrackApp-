import { describe, expect, it } from "vitest";
import { hoyEnCordoba, leerNumero, revisarLaSalida, type DatosDeSalida } from "@/lib/salidas/reglas";

const BIEN: DatosDeSalida = {
  titulo: "Champaquí por Villa Alpina",
  fecha: "2026-10-01",
  descripcion: "",
  actividades: ["trekking"],
  nivelEsfuerzo: null,
  largoKm: null,
  desnivelPositivoM: null,
  desnivelNegativoM: null,
  companeros: [],
};

const HOY = "2026-10-02";

describe("revisarLaSalida", () => {
  it("acepta una salida completa", () => {
    expect(revisarLaSalida(BIEN, HOY)).toBeNull();
  });

  it("pide título", () => {
    expect(revisarLaSalida({ ...BIEN, titulo: "   " }, HOY)).toMatch(/título/);
  });

  it("pide al menos una actividad", () => {
    expect(revisarLaSalida({ ...BIEN, actividades: [] }, HOY)).toMatch(/actividad/);
  });

  it("no acepta una fecha futura", () => {
    expect(revisarLaSalida({ ...BIEN, fecha: "2026-10-03" }, HOY)).toMatch(/más adelante/);
  });

  it("acepta hoy", () => {
    expect(revisarLaSalida({ ...BIEN, fecha: HOY }, HOY)).toBeNull();
  });

  it("pide la fecha", () => {
    expect(revisarLaSalida({ ...BIEN, fecha: "" }, HOY)).toMatch(/día/);
  });

  it("no acepta números negativos ni ilegibles", () => {
    expect(revisarLaSalida({ ...BIEN, largoKm: -1 }, HOY)).toMatch(/kilómetros/);
    expect(revisarLaSalida({ ...BIEN, desnivelPositivoM: Number.NaN }, HOY)).toMatch(/subiste/);
  });
});

describe("leerNumero", () => {
  it("vacío es «no lo sé», no cero", () => {
    expect(leerNumero("")).toBeNull();
    expect(leerNumero("  ")).toBeNull();
  });

  it("acepta coma decimal", () => {
    expect(leerNumero("14,5")).toBe(14.5);
    expect(leerNumero("14.5")).toBe(14.5);
  });

  it("marca lo que no es un número", () => {
    expect(leerNumero("abc")).toBeNaN();
  });
});

describe("hoyEnCordoba", () => {
  it("usa la hora de Córdoba y no la del mundo", () => {
    // 02:00 del 3 en Greenwich son las 23:00 del 2 en Córdoba.
    expect(hoyEnCordoba(new Date("2026-10-03T02:00:00Z"))).toBe("2026-10-02");
  });
});
