import { describe, expect, it } from "vitest";
import { SIN_FILTROS } from "@/lib/rutas/filtros";
import { leerFiltrosGuardados } from "@/lib/rutas/filtros-guardados";

describe("leerFiltrosGuardados", () => {
  it("sin nada guardado, o con algo roto, arranca sin filtros", () => {
    expect(leerFiltrosGuardados(null)).toEqual(SIN_FILTROS);
    expect(leerFiltrosGuardados("{no es json")).toEqual(SIN_FILTROS);
    expect(leerFiltrosGuardados("[1,2]")).toEqual(SIN_FILTROS);
  });

  it("recupera tal cual lo que se guardó bien", () => {
    const filtros = {
      zonaId: 3,
      actividades: ["kayak"],
      largoDesde: "5",
      largoHasta: "12,5",
      circulosDeTecnica: 3,
      esfuerzos: ["alto", "muy_alto"],
      mapa: "falta",
    };
    expect(leerFiltrosGuardados(JSON.stringify(filtros))).toEqual(filtros);
  });

  it("descarta lo que no existe en la carga en vez de dejar la lista vacía", () => {
    const viejo = {
      zonaId: "3",
      actividades: ["bici", "trekking", "4x4"],
      circulosDeTecnica: 9,
      esfuerzos: [2, "bajo"],
      mapa: "cualquiera",
      km: "corta",
    };
    expect(leerFiltrosGuardados(JSON.stringify(viejo))).toEqual({
      ...SIN_FILTROS,
      actividades: ["trekking"],
      esfuerzos: ["bajo"],
    });
  });
});
