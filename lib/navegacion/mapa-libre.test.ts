import { describe, expect, it } from "vitest";
import {
  areaDeLasZonas,
  rutasDelSector,
  sectorDondeEstas,
  sectorEnElLugar,
  sectorPrincipalDeLaRuta,
  zonaDondeEstas,
} from "@/lib/navegacion/mapa-libre";
import type { Rectangulo, RutaResumen, Sector, Zona } from "@/types/database";

const rect = (latNorte: number, latSur: number, lonEste: number, lonOeste: number): Rectangulo => ({
  latNorte,
  latSur,
  lonEste,
  lonOeste,
});

const zona = (id: number, nombre: string, rectangulo: Rectangulo): Zona => ({
  id,
  perfilId: "p",
  nombre,
  descripcion: null,
  rectangulo,
  creadoEn: "",
  actualizadoEn: "",
});

const ruta = (id: number, nombre: string, rectangulo: Rectangulo): RutaResumen => ({
  id,
  perfilId: "p",
  nombre,
  descripcion: null,
  actividades: [],
  dificultadTecnica: null,
  nivelEsfuerzo: null,
  largoKm: null,
  desnivelPositivoM: null,
  desnivelNegativoM: null,
  rectangulo,
  distanciasPorSector: {},
  color: "naranja",
  creadoEn: "",
  actualizadoEn: "",
});

const punilla = zona(1, "Punilla", rect(-30.8, -31.3, -64.3, -64.7));
const traslasierra = zona(2, "Traslasierra", rect(-31.6, -32.2, -64.9, -65.3));

const uritorco = ruta(1, "Uritorco", rect(-30.85, -30.9, -64.45, -64.5));
const gigantes = ruta(2, "Los Gigantes", rect(-31.35, -31.45, -64.75, -64.8));
const champaqui = ruta(3, "Champaquí", rect(-31.9, -32.0, -65.0, -65.1));

describe("zonaDondeEstas", () => {
  it("encuentra la zona que contiene tu posición", () => {
    expect(zonaDondeEstas([punilla, traslasierra], { lat: -31.0, lon: -64.5 })?.nombre).toBe("Punilla");
  });

  it("sin GPS o fuera de toda zona, no hay zona", () => {
    expect(zonaDondeEstas([punilla], null)).toBeNull();
    expect(zonaDondeEstas([punilla], { lat: -25, lon: -60 })).toBeNull();
  });
});

const sector = (id: number, zonaId: number, rectangulo: Rectangulo): Sector => ({
  id,
  zonaId,
  perfilId: "p",
  nombre: `S${id}`,
  descripcion: null,
  rectangulo,
  creadoEn: "",
  actualizadoEn: "",
});

const conMetros = (base: RutaResumen, distanciasPorSector: Record<string, number>): RutaResumen => ({
  ...base,
  distanciasPorSector,
});

const norte = sector(10, 1, rect(-30.8, -31.0, -64.3, -64.7));
const sur = sector(11, 1, rect(-31.0, -31.3, -64.3, -64.7));

describe("sectorDondeEstas", () => {
  it("encuentra el sector que contiene tu posición", () => {
    expect(sectorDondeEstas([norte, sur], { lat: -31.1, lon: -64.5 })?.id).toBe(11);
  });

  it("sin GPS o fuera de todo sector, no hay sector", () => {
    expect(sectorDondeEstas([norte, sur], null)).toBeNull();
    expect(sectorDondeEstas([norte, sur], { lat: -25, lon: -60 })).toBeNull();
  });
});

describe("sectorEnElLugar", () => {
  it("devuelve el sector tocado en el mapa chico, o ninguno", () => {
    expect(sectorEnElLugar([norte, sur], { lat: -30.9, lon: -64.5 })?.id).toBe(10);
    expect(sectorEnElLugar([norte, sur], { lat: -20, lon: -60 })).toBeNull();
  });
});

describe("sectorPrincipalDeLaRuta", () => {
  it("elige el sector por donde pasa la mayor parte de la ruta", () => {
    const larga = conMetros(uritorco, { "10": 300, "11": 1200, sin_sector: 5000 });
    expect(sectorPrincipalDeLaRuta(larga, [norte, sur])?.id).toBe(11);
  });

  it("sin metros anotados, el primer sector que toca su rectángulo", () => {
    expect(sectorPrincipalDeLaRuta(uritorco, [sur, norte])?.id).toBe(10);
  });

  it("una ruta afuera de todo sector no tiene sector", () => {
    expect(sectorPrincipalDeLaRuta(champaqui, [norte, sur])).toBeNull();
  });
});

describe("rutasDelSector", () => {
  it("trae solo las rutas con metros adentro del sector, por nombre", () => {
    const rutas = [
      conMetros(uritorco, { "10": 500 }),
      conMetros(gigantes, { "10": 20, "11": 900 }),
      conMetros(champaqui, { "11": 100 }),
    ];
    expect(rutasDelSector(rutas, norte).map((r) => r.nombre)).toEqual(["Los Gigantes", "Uritorco"]);
    expect(rutasDelSector(rutas, sur).map((r) => r.nombre)).toEqual(["Champaquí", "Los Gigantes"]);
  });

  it("una ruta sin metros anotados cae en los sectores que toca su rectángulo", () => {
    expect(rutasDelSector([uritorco, champaqui], norte).map((r) => r.nombre)).toEqual(["Uritorco"]);
  });
});

describe("areaDeLasZonas", () => {
  it("abarca todas las zonas, para abrir el mapa sin nada bajado", () => {
    expect(areaDeLasZonas([punilla, traslasierra])).toEqual(rect(-30.8, -32.2, -64.3, -65.3));
    expect(areaDeLasZonas([])).toBeNull();
  });
});
