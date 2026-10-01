import { describe, expect, it } from "vitest";
import {
  CORDOBA_COMPLETA,
  puntosDelMapaGeneral,
  sectoresPorZona,
  zonaEnElLugar,
  zonasEnElMapaGeneral,
} from "@/lib/mapas/general";
import type { Anotacion, Sector, Zona } from "@/types/database";

const zonaGrande = {
  id: 1,
  nombre: "Zona grande",
  rectangulo: { latNorte: -30, latSur: -33, lonOeste: -66, lonEste: -63 },
} as Zona;
const zonaChica = {
  id: 2,
  nombre: "Zona chica",
  rectangulo: { latNorte: -31, latSur: -32, lonOeste: -65, lonEste: -64 },
} as Zona;

describe("mapa general de Córdoba", () => {
  it("encuadra la provincia y dibuja solo perímetros de zonas con un nombre", () => {
    expect(CORDOBA_COMPLETA.latNorte).toBeGreaterThan(zonaGrande.rectangulo.latNorte);
    expect(CORDOBA_COMPLETA.latSur).toBeLessThan(zonaGrande.rectangulo.latSur);
    expect(zonasEnElMapaGeneral([zonaGrande, zonaChica])).toEqual([
      { id: 1, rectangulo: zonaGrande.rectangulo, clase: "zona_general", etiqueta: "Zona grande" },
      { id: 2, rectangulo: zonaChica.rectangulo, clase: "zona_general", etiqueta: "Zona chica" },
    ]);
  });

  it("muestra puntos aunque estén fuera de cualquier zona y omite trazos", () => {
    const fuera = { id: 7, tipo: "punto" } as Anotacion;
    const dentro = { id: 8, tipo: "punto" } as Anotacion;
    const trazo = { id: 9, tipo: "trazo" } as Anotacion;
    expect(puntosDelMapaGeneral([fuera, dentro, trazo])).toEqual([fuera, dentro]);
  });

  it("elige la zona más precisa en una superposición", () => {
    expect(zonaEnElLugar([zonaGrande, zonaChica], -64.5, -31.5)?.id).toBe(2);
    expect(zonaEnElLugar([zonaGrande], -60, -31.5)).toBeNull();
  });

  it("cuenta sectores sin dibujarlos", () => {
    expect(sectoresPorZona([{ zonaId: 1 }, { zonaId: 1 }, { zonaId: 2 }] as Sector[])).toEqual({ 1: 2, 2: 1 });
  });
});
