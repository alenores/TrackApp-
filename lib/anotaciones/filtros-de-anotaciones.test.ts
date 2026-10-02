import { describe, expect, it } from "vitest";
import {
  dondeQueda,
  filtrarAnotaciones,
  SIN_FILTROS_DE_ANOTACIONES,
} from "@/lib/anotaciones/filtros-de-anotaciones";
import type { Anotacion, Rectangulo, Sector, Zona } from "@/types/database";

const ZONA = { id: 2, nombre: "Sierras", rectangulo: { latNorte: -30, latSur: -33, lonEste: -63, lonOeste: -66 } as Rectangulo } as Zona;
const SECTOR = { id: 8, zonaId: ZONA.id, nombre: "Norte", rectangulo: { latNorte: -31, latSur: -32, lonEste: -64, lonOeste: -65 } as Rectangulo } as Sector;

const base = {
  perfilId: "perfil", deAdministrador: true, origen: "manual" as const, comentario: null,
  fotoUrl: null, fotoChicaUrl: null, marcadaEn: "", precisionGpsMetros: null, creadoEn: "", actualizadoEn: "",
};

function punto(id: number, sectorId: number | null, icono: Anotacion["icono"], coordinates: [number, number]): Anotacion {
  return { ...base, id, sectorId, tipo: "punto", icono, color: null, geometria: { type: "Point", coordinates } };
}

function trazo(id: number, sectorId: number | null, coordinates: [number, number][]): Anotacion {
  return { ...base, id, sectorId, tipo: "trazo", icono: null, color: "#f59e0b", geometria: { type: "LineString", coordinates } };
}

const lista = [
  punto(1, SECTOR.id, "arroyo", [-64.5, -31.5]),
  punto(2, null, "arroyo", [-65.5, -31.5]),
  punto(3, null, "refugio", [-60, -35]),
  trazo(4, null, [[-64.6, -31.6], [-64.4, -31.4]]),
];
const ids = (anotaciones: Anotacion[]) => anotaciones.map((cada) => cada.id);
const filtrar = (filtros: Partial<typeof SIN_FILTROS_DE_ANOTACIONES>) =>
  ids(filtrarAnotaciones(lista, { ...SIN_FILTROS_DE_ANOTACIONES, ...filtros }, [ZONA], [SECTOR]));

describe("filtros de anotaciones", () => {
  it("sin filtros trae todo, puntos y trazos", () => {
    expect(filtrar({})).toEqual([1, 2, 3, 4]);
  });

  it("filtra por tipo", () => {
    expect(filtrar({ tipo: "punto" })).toEqual([1, 2, 3]);
    expect(filtrar({ tipo: "trazo" })).toEqual([4]);
  });

  it("filtra por zona: las anotadas a sus sectores y las que caen adentro", () => {
    expect(filtrar({ lugar: `zona:${ZONA.id}` })).toEqual([1, 2, 4]);
  });

  it("filtra por sector, también un trazo sin sector que lo cruza", () => {
    expect(filtrar({ lugar: `sector:${SECTOR.id}` })).toEqual([1, 4]);
  });

  it("el ícono deja solo puntos de ese ícono, y se combina con el lugar", () => {
    expect(filtrar({ icono: "arroyo" })).toEqual([1, 2]);
    expect(filtrar({ lugar: `zona:${ZONA.id}`, icono: "refugio" })).toEqual([]);
  });
});

describe("dondeQueda", () => {
  it("nombra la zona y el sector donde cae", () => {
    expect(dondeQueda(lista[0], [ZONA], [SECTOR])).toBe("Sierras · Norte");
    expect(dondeQueda(lista[1], [ZONA], [SECTOR])).toBe("Sierras · fuera de los sectores");
    expect(dondeQueda(lista[2], [ZONA], [SECTOR])).toBe("Fuera de las zonas");
  });
});
