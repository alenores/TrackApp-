import { describe, expect, it } from "vitest";
import { filtrarPuntos } from "@/lib/anotaciones/filtros-de-puntos";
import type { Anotacion, Rectangulo, Sector, Zona } from "@/types/database";

const ZONA = { id: 2, nombre: "Sierras", rectangulo: { latNorte: -30, latSur: -33, lonEste: -63, lonOeste: -66 } as Rectangulo } as Zona;
const SECTOR = { id: 8, zonaId: ZONA.id, nombre: "Norte", rectangulo: { latNorte: -31, latSur: -32, lonEste: -64, lonOeste: -65 } as Rectangulo } as Sector;

function punto(id: number, sectorId: number | null, icono: Anotacion["icono"], coordinates: [number, number]): Anotacion {
  return {
    id, sectorId, perfilId: "perfil", deAdministrador: true, tipo: "punto", origen: "manual",
    icono, color: null, comentario: null, fotoUrl: null, fotoChicaUrl: null,
    geometria: { type: "Point", coordinates }, marcadaEn: "", precisionGpsMetros: null,
    creadoEn: "", actualizadoEn: "",
  };
}

describe("filtros de puntos", () => {
  const puntos = [
    punto(1, SECTOR.id, "arroyo", [-64.5, -31.5]),
    punto(2, null, "arroyo", [-65.5, -31.5]),
    punto(3, null, "refugio", [-60, -35]),
  ];

  it("filtra por zona e incluye los puntos asociados o ubicados dentro", () => {
    expect(filtrarPuntos(puntos, `zona:${ZONA.id}`, null, [ZONA], [SECTOR]).map((cada) => cada.id)).toEqual([1, 2]);
  });

  it("filtra por sector, tipo de ícono y su combinación", () => {
    expect(filtrarPuntos(puntos, `sector:${SECTOR.id}`, null, [ZONA], [SECTOR]).map((cada) => cada.id)).toEqual([1]);
    expect(filtrarPuntos(puntos, null, "arroyo", [ZONA], [SECTOR]).map((cada) => cada.id)).toEqual([1, 2]);
    expect(filtrarPuntos(puntos, `zona:${ZONA.id}`, "refugio", [ZONA], [SECTOR])).toEqual([]);
  });
});
