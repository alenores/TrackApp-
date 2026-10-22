import { describe, expect, it } from "vitest";
import {
  direccionDeSalidas,
  filtrosPuestos,
  leerFiltros,
  filtrarSalidas,
  paginaDeSalidas,
  SALIDAS_POR_PAGINA,
  SIN_FILTROS,
} from "@/lib/salidas/filtros";
import type { Salida } from "@/types/database";

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

describe("un día elegido en el calendario", () => {
  it("es una sola pastilla, que saca las dos fechas", () => {
    const puestos = filtrosPuestos({ ...SIN_FILTROS, desde: "2026-05-02", hasta: "2026-05-02" }, () => "");
    expect(puestos).toHaveLength(1);
    expect(puestos[0].etiqueta).toBe("El 2 de mayo de 2026");
    expect(puestos[0].sinEste).toEqual(SIN_FILTROS);
  });
});

const PEPA = "a1b2c3d4-0000-4000-8000-000000000002";

function salida(parcial: Partial<Salida> & { id: number }): Salida {
  return {
    estado: "publicada",
    rutaId: null,
    perfil: { id: ALE, nombre: "Ale", avatarUrl: null },
    titulo: "Salida",
    fecha: "2026-05-02",
    descripcion: null,
    actividades: ["trekking"],
    nivelEsfuerzo: "medio",
    largoKm: null,
    desnivelPositivoM: null,
    desnivelNegativoM: null,
    archivoUrl: null,
    linea: null,
    fotos: [],
    companeros: [],
    creadoEn: "2026-05-02T12:00:00Z",
    ...parcial,
  };
}

describe("filtrarSalidas", () => {
  const champaqui = salida({ id: 1, titulo: "Subida al Champaquí", fecha: "2026-03-10" });
  const kayak = salida({
    id: 2,
    titulo: "Kayak en el dique",
    actividades: ["kayak"],
    nivelEsfuerzo: "bajo",
    perfil: { id: PEPA, nombre: "Pepa", avatarUrl: null },
    companeros: [{ id: ALE, nombre: "Ale", avatarUrl: null }],
  });
  const todas = [champaqui, kayak];

  it("sin filtros están todas", () => {
    expect(filtrarSalidas(todas, SIN_FILTROS)).toEqual(todas);
  });

  it("el título se busca sin mayúsculas ni tildes", () => {
    expect(filtrarSalidas(todas, { ...SIN_FILTROS, titulo: "CHAMPAQUI" })).toEqual([champaqui]);
  });

  it("actividad y esfuerzo", () => {
    expect(filtrarSalidas(todas, { ...SIN_FILTROS, actividades: ["kayak"] })).toEqual([kayak]);
    expect(filtrarSalidas(todas, { ...SIN_FILTROS, esfuerzos: ["medio"] })).toEqual([champaqui]);
  });

  it("participante: la cargó o fue de compañero", () => {
    expect(filtrarSalidas(todas, { ...SIN_FILTROS, participantes: [ALE] })).toEqual(todas);
    expect(filtrarSalidas(todas, { ...SIN_FILTROS, participantes: [PEPA] })).toEqual([kayak]);
  });

  it("entre fechas, con los dos extremos adentro", () => {
    expect(filtrarSalidas(todas, { ...SIN_FILTROS, desde: "2026-03-10", hasta: "2026-03-10" })).toEqual([
      champaqui,
    ]);
  });

  it("todos los filtros juntos tienen que cumplirse", () => {
    expect(filtrarSalidas(todas, { ...SIN_FILTROS, titulo: "kayak", esfuerzos: ["alto"] })).toEqual([]);
  });
});

describe("paginaDeSalidas", () => {
  const muchas = Array.from({ length: SALIDAS_POR_PAGINA + 1 }, (_, indice) => salida({ id: indice + 1 }));

  it("corta en páginas y dice si hay más", () => {
    expect(paginaDeSalidas(muchas, 1)).toMatchObject({ pagina: 1, hayMas: true });
    expect(paginaDeSalidas(muchas, 1).salidas).toHaveLength(SALIDAS_POR_PAGINA);
    expect(paginaDeSalidas(muchas, 2)).toMatchObject({ salidas: [muchas[SALIDAS_POR_PAGINA]], hayMas: false });
  });
});
