import { describe, expect, it } from "vitest";
import {
  direccionDeSalidas,
  filtrosPuestos,
  leerFiltros,
  SIN_FILTROS,
  tituloParaBuscar,
} from "@/lib/salidas/filtros";

const ALE = "e0068d54-4f7f-41cb-aad2-a56ba27a1704";

describe("leerFiltros", () => {
  it("sin nada en la dirección, no hay filtros", () => {
    expect(leerFiltros({})).toEqual(SIN_FILTROS);
  });

  it("lee todos los filtros", () => {
    expect(
      leerFiltros({
        titulo: " Champaquí ",
        actividad: "trekking,mountain_bike",
        esfuerzo: "alto",
        participante: ALE,
        desde: "2026-01-01",
        hasta: "2026-03-31",
      }),
    ).toEqual({
      titulo: "Champaquí",
      actividades: ["trekking", "mountain_bike"],
      esfuerzos: ["alto"],
      participantes: [ALE],
      desde: "2026-01-01",
      hasta: "2026-03-31",
    });
  });

  it("descarta lo que no se entiende", () => {
    const filtros = leerFiltros({
      actividad: "parapente",
      esfuerzo: "extremo",
      participante: "'; drop table",
      desde: "ayer",
    });
    expect(filtros).toEqual(SIN_FILTROS);
  });

  it("da vuelta las fechas si vinieron al revés", () => {
    const filtros = leerFiltros({ desde: "2026-05-01", hasta: "2026-01-01" });
    expect(filtros.desde).toBe("2026-01-01");
    expect(filtros.hasta).toBe("2026-05-01");
  });
});

describe("direccionDeSalidas", () => {
  it("sin filtros es la lista pelada", () => {
    expect(direccionDeSalidas(SIN_FILTROS)).toBe("/salidas");
  });

  it("ida y vuelta: lo que se escribe se vuelve a leer igual", () => {
    const filtros = { ...SIN_FILTROS, actividades: ["kayak" as const], desde: "2026-02-01" };
    const direccion = direccionDeSalidas(filtros, 3);
    const parametros = Object.fromEntries(new URL(direccion, "https://x").searchParams);
    expect(leerFiltros(parametros)).toEqual(filtros);
    expect(parametros.pagina).toBe("3");
  });
});

describe("filtrosPuestos", () => {
  it("cada filtro se puede sacar solo", () => {
    const filtros = { ...SIN_FILTROS, esfuerzos: ["alto" as const, "bajo" as const], participantes: [ALE] };
    const puestos = filtrosPuestos(filtros, () => "Ale");
    expect(puestos.map((puesto) => puesto.etiqueta)).toEqual([
      "Esfuerzo alto",
      "Esfuerzo bajo",
      "Con Ale",
    ]);
    expect(puestos[0].sinEste.esfuerzos).toEqual(["bajo"]);
  });
});

describe("tituloParaBuscar", () => {
  it("los comodines de la base se buscan como letras", () => {
    expect(tituloParaBuscar(" 50%_ ")).toBe("50\\%\\_");
  });
});
