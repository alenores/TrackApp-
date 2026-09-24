import { describe, expect, it } from "vitest";
import { areaDeLasZonas, areaDeLoBajado, rutasParaElegir, zonaDondeEstas } from "@/lib/navegacion/mapa-libre";
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

describe("rutasParaElegir", () => {
  const rutas = [champaqui, gigantes, uritorco];

  it("propone primero las rutas de tu zona y deja las lejanas aparte", () => {
    const eleccion = rutasParaElegir(rutas, [punilla, traslasierra], { lat: -31.0, lon: -64.5 });
    expect(eleccion.zona?.nombre).toBe("Punilla");
    expect(eleccion.deTuZona.map((r) => r.nombre)).toEqual(["Uritorco"]);
    expect(eleccion.otras.map((r) => r.nombre)).toEqual(["Champaquí", "Los Gigantes"]);
  });

  it("sin GPS van todas juntas, por nombre", () => {
    const eleccion = rutasParaElegir(rutas, [punilla], null);
    expect(eleccion.zona).toBeNull();
    expect(eleccion.deTuZona).toEqual([]);
    expect(eleccion.otras.map((r) => r.nombre)).toEqual(["Champaquí", "Los Gigantes", "Uritorco"]);
  });
});

describe("areaDeLoBajado", () => {
  const sector = (id: number, rectangulo: Rectangulo): Sector => ({
    id,
    zonaId: 1,
    perfilId: "p",
    nombre: `S${id}`,
    descripcion: null,
    rectangulo,
    creadoEn: "",
    actualizadoEn: "",
  });

  it("abarca solo los sectores con mapa bajado", () => {
    const sectores = [sector(1, rect(-31, -31.1, -64.4, -64.5)), sector(2, rect(-32, -32.1, -65, -65.1)), sector(3, rect(-20, -21, -60, -61))];
    expect(areaDeLoBajado(sectores, new Set([1, 2]))).toEqual(rect(-31, -32.1, -64.4, -65.1));
  });

  it("sin nada bajado no hay área", () => {
    expect(areaDeLoBajado([], new Set())).toBeNull();
  });
});

describe("areaDeLasZonas", () => {
  it("abarca todas las zonas, para abrir el mapa sin nada bajado", () => {
    expect(areaDeLasZonas([punilla, traslasierra])).toEqual(rect(-30.8, -32.2, -64.3, -65.3));
    expect(areaDeLasZonas([])).toBeNull();
  });
});
