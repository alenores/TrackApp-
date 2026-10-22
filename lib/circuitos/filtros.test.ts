import { describe, expect, it } from "vitest";
import {
  filtrarCircuitos,
  filtrosDeCircuitosPuestos,
  leerKilometros,
  SIN_FILTROS_DE_CIRCUITOS as SIN_FILTROS,
  type CircuitoParaFiltrar,
} from "@/lib/circuitos/filtros";

const mogote: CircuitoParaFiltrar = {
  nombre: "Vuelta del Mogote",
  actividad: "mountain_bike",
  autorId: "ale",
  esfuerzo: "alto",
  largoM: 4300,
};
const champaqui: CircuitoParaFiltrar = {
  nombre: "Champaquí por Villa Alpina",
  actividad: "trekking",
  autorId: "pepa",
  esfuerzo: "muy_alto",
  largoM: 32000,
};
const sinMedir: CircuitoParaFiltrar = {
  nombre: "Nuevo",
  actividad: "trekking",
  autorId: null,
  esfuerzo: null,
  largoM: null,
};
const todos = [mogote, champaqui, sinMedir];

describe("filtrarCircuitos", () => {
  it("sin filtros están todos", () => {
    expect(filtrarCircuitos(todos, SIN_FILTROS)).toEqual(todos);
  });

  it("el nombre se busca sin mayúsculas ni tildes", () => {
    expect(filtrarCircuitos(todos, { ...SIN_FILTROS, nombre: "CHAMPAQUI" })).toEqual([champaqui]);
  });

  it("actividad, creado por y esfuerzo", () => {
    expect(filtrarCircuitos(todos, { ...SIN_FILTROS, actividades: ["trekking"] })).toEqual([champaqui, sinMedir]);
    expect(filtrarCircuitos(todos, { ...SIN_FILTROS, autores: ["ale"] })).toEqual([mogote]);
    expect(filtrarCircuitos(todos, { ...SIN_FILTROS, esfuerzos: ["alto", "muy_alto"] })).toEqual([mogote, champaqui]);
  });

  it("largo entre dos valores, con los extremos adentro; sin medir queda afuera", () => {
    expect(filtrarCircuitos(todos, { ...SIN_FILTROS, largoDesdeKm: 4.3, largoHastaKm: 10 })).toEqual([mogote]);
    expect(filtrarCircuitos(todos, { ...SIN_FILTROS, largoDesdeKm: 5 })).toEqual([champaqui]);
    expect(filtrarCircuitos(todos, { ...SIN_FILTROS, largoHastaKm: 32 })).toEqual([mogote, champaqui]);
  });

  it("todos los filtros juntos tienen que cumplirse", () => {
    expect(filtrarCircuitos(todos, { ...SIN_FILTROS, actividades: ["trekking"], autores: ["ale"] })).toEqual([]);
  });
});

describe("filtrosDeCircuitosPuestos", () => {
  it("nombra cada filtro y sabe sacarlo", () => {
    const puestos = filtrosDeCircuitosPuestos(
      { ...SIN_FILTROS, nombre: "mogote", autores: ["ale"], largoDesdeKm: 2.5, largoHastaKm: 10 },
      (id) => (id === "ale" ? "Alejandro" : "?"),
    );
    expect(puestos.map((puesto) => puesto.etiqueta)).toEqual(["Creado por Alejandro", "De 2,5 km a 10 km"]);
    expect(puestos[1].sinEste).toMatchObject({ nombre: "mogote", largoDesdeKm: null, largoHastaKm: null });
  });
});

describe("leerKilometros", () => {
  it("acepta coma o punto; vacío o inválido es sin límite", () => {
    expect(leerKilometros("12,5")).toBe(12.5);
    expect(leerKilometros("3.2")).toBe(3.2);
    expect(leerKilometros("")).toBeNull();
    expect(leerKilometros("-1")).toBeNull();
    expect(leerKilometros("doce")).toBeNull();
  });
});
