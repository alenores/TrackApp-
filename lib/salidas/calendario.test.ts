import { describe, expect, it } from "vitest";
import {
  limitesDelMes,
  mesDe,
  mesVecino,
  nombreDelMes,
  semanasDelMes,
} from "@/lib/salidas/calendario";

describe("semanasDelMes", () => {
  it("octubre de 2026 arranca un jueves: la semana empieza el lunes", () => {
    const semanas = semanasDelMes({ anio: 2026, mes: 10 });
    expect(semanas[0]).toEqual([null, null, null, "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
    expect(semanas.at(-1)).toEqual(["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", null]);
  });

  it("todas las semanas tienen siete días y están todos los días del mes", () => {
    const semanas = semanasDelMes({ anio: 2028, mes: 2 });
    expect(semanas.every((semana) => semana.length === 7)).toBe(true);
    expect(semanas.flat().filter(Boolean)).toHaveLength(29);
  });
});

describe("moverse entre meses", () => {
  it("pasa de año para adelante y para atrás", () => {
    expect(mesVecino({ anio: 2026, mes: 12 }, 1)).toEqual({ anio: 2027, mes: 1 });
    expect(mesVecino({ anio: 2026, mes: 1 }, -1)).toEqual({ anio: 2025, mes: 12 });
  });

  it("sabe los límites y el nombre del mes", () => {
    expect(limitesDelMes({ anio: 2026, mes: 2 })).toEqual({ desde: "2026-02-01", hasta: "2026-02-28" });
    expect(nombreDelMes(mesDe("2026-10-04"))).toBe("Octubre 2026");
  });
});
