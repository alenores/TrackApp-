import { describe, expect, it } from "vitest";
import {
  SIN_FILTROS,
  circulosDeDificultad,
  filtrarRutas,
  filtrosPuestos,
  leerKm,
  problemaDelLargo,
  sinLoQueYaNoExiste,
  type FiltrosDeRutas,
} from "@/lib/rutas/filtros";
import type { RutaResumen, Zona } from "@/types/database";

function ruta(parcial: Partial<RutaResumen> & { id: number }): RutaResumen {
  return {
    perfilId: "p",
    nombre: `Ruta ${parcial.id}`,
    descripcion: null,
    actividades: [],
    dificultadTecnica: null,
    nivelEsfuerzo: null,
    largoKm: null,
    desnivelPositivoM: null,
    desnivelNegativoM: null,
    rectangulo: { latNorte: -31, latSur: -31.1, lonEste: -64.4, lonOeste: -64.5 },
    distanciasPorSector: {},
    color: "naranja",
    creadoEn: "2026-09-01",
    actualizadoEn: "2026-09-01",
    ...parcial,
  };
}

const zonaNorte: Zona = {
  id: 1,
  perfilId: "p",
  nombre: "Norte",
  descripcion: null,
  rectangulo: { latNorte: -30, latSur: -30.5, lonEste: -64, lonOeste: -65 },
  creadoEn: "",
  actualizadoEn: "",
};

const contexto = { zonas: [zonaNorte], conMapa: new Set<number>([7]) };
const con = (parcial: Partial<FiltrosDeRutas>) => ({ ...SIN_FILTROS, ...parcial });
const ids = (rutas: RutaResumen[]) => rutas.map((r) => r.id);

describe("filtrarRutas", () => {
  it("sin filtros devuelve todas", () => {
    const rutas = [ruta({ id: 1 }), ruta({ id: 2 })];
    expect(ids(filtrarRutas(rutas, SIN_FILTROS, contexto))).toEqual([1, 2]);
  });

  it("zona: deja solo las rutas que tocan el rectángulo de la zona", () => {
    const rutas = [
      ruta({ id: 1, rectangulo: { latNorte: -30.1, latSur: -30.2, lonEste: -64.4, lonOeste: -64.5 } }),
      ruta({ id: 2 }),
    ];
    expect(ids(filtrarRutas(rutas, con({ zonaId: 1 }), contexto))).toEqual([1]);
  });

  it("actividad: con varias elegidas alcanza con tener una", () => {
    const rutas = [
      ruta({ id: 1, actividades: ["trekking"] }),
      ruta({ id: 2, actividades: ["kayak"] }),
      ruta({ id: 3, actividades: ["canyoning", "mountain_bike"] }),
    ];
    const filtros = con({ actividades: ["kayak", "mountain_bike"] });
    expect(ids(filtrarRutas(rutas, filtros, contexto))).toEqual([2, 3]);
  });

  it("largo: respeta desde y hasta, acepta coma, y deja afuera las rutas sin largo", () => {
    const rutas = [
      ruta({ id: 1, largoKm: 4 }),
      ruta({ id: 2, largoKm: 12.5 }),
      ruta({ id: 3, largoKm: 30 }),
      ruta({ id: 4, largoKm: null }),
    ];
    expect(ids(filtrarRutas(rutas, con({ largoDesde: "5", largoHasta: "12,5" }), contexto))).toEqual([2]);
    expect(ids(filtrarRutas(rutas, con({ largoHasta: "5" }), contexto))).toEqual([1]);
    expect(ids(filtrarRutas(rutas, con({ largoDesde: "20" }), contexto))).toEqual([3]);
  });

  it("técnica: cada circulito vale 2 y marca el tope", () => {
    const rutas = [1, 2, 3, 6, 7, 10].map((d) => ruta({ id: d, dificultadTecnica: d }));
    expect(ids(filtrarRutas(rutas, con({ circulosDeTecnica: 1 }), contexto))).toEqual([1, 2]);
    expect(ids(filtrarRutas(rutas, con({ circulosDeTecnica: 3 }), contexto))).toEqual([1, 2, 3, 6]);
    expect(ids(filtrarRutas(rutas, con({ circulosDeTecnica: 5 }), contexto))).toEqual([1, 2, 3, 6, 7, 10]);
  });

  it("técnica: coincide con los circulitos que pinta la tarjeta", () => {
    for (let dificultad = 1; dificultad <= 10; dificultad++) {
      const r = ruta({ id: dificultad, dificultadTecnica: dificultad });
      const circulos = circulosDeDificultad(dificultad);
      expect(filtrarRutas([r], con({ circulosDeTecnica: circulos }), contexto)).toHaveLength(1);
      if (circulos > 1) {
        expect(filtrarRutas([r], con({ circulosDeTecnica: circulos - 1 }), contexto)).toHaveLength(0);
      }
    }
  });

  it("esfuerzo: compara contra los niveles de la carga, no contra números", () => {
    const rutas = [
      ruta({ id: 1, nivelEsfuerzo: "bajo" }),
      ruta({ id: 2, nivelEsfuerzo: "muy_alto" }),
      ruta({ id: 3, nivelEsfuerzo: null }),
    ];
    expect(ids(filtrarRutas(rutas, con({ esfuerzos: ["muy_alto"] }), contexto))).toEqual([2]);
  });

  it("mapa: completo o falta bajar, con la misma cuenta que la tarjeta", () => {
    const rutas = [
      ruta({ id: 1, distanciasPorSector: { "7": 1000 } }),
      ruta({ id: 2, distanciasPorSector: { "7": 500, "8": 500 } }),
    ];
    expect(ids(filtrarRutas(rutas, con({ mapa: "completo" }), contexto))).toEqual([1]);
    expect(ids(filtrarRutas(rutas, con({ mapa: "falta" }), contexto))).toEqual([2]);
  });
});

describe("largo escrito a mano", () => {
  it("lee coma y punto, y rechaza lo que no es número", () => {
    expect(leerKm("12,5")).toBe(12.5);
    expect(leerKm(" 8 ")).toBe(8);
    expect(leerKm("")).toBeNull();
    expect(leerKm("doce")).toBeNull();
  });

  it("avisa cuando el desde es mayor que el hasta", () => {
    expect(problemaDelLargo(con({ largoDesde: "20", largoHasta: "5" }))).not.toBeNull();
    expect(problemaDelLargo(con({ largoDesde: "abc" }))).not.toBeNull();
    expect(problemaDelLargo(con({ largoDesde: "5", largoHasta: "20" }))).toBeNull();
  });
});

describe("filtrosPuestos", () => {
  it("una pastilla por filtro, y cada una saca solo lo suyo", () => {
    const filtros = con({ zonaId: 1, actividades: ["kayak", "trekking"], circulosDeTecnica: 2 });
    const puestos = filtrosPuestos(filtros, [zonaNorte]);
    expect(puestos.map((p) => p.etiqueta)).toEqual(["Norte", "Kayak", "Trekking", "Técnica hasta 4"]);

    const sinKayak = puestos[1].sacar(filtros);
    expect(sinKayak.actividades).toEqual(["trekking"]);
    expect(sinKayak.zonaId).toBe(1);
  });
});

describe("sinLoQueYaNoExiste", () => {
  it("ignora una zona recordada que ya no está", () => {
    expect(sinLoQueYaNoExiste(con({ zonaId: 99 }), [zonaNorte]).zonaId).toBeNull();
    expect(sinLoQueYaNoExiste(con({ zonaId: 1 }), [zonaNorte]).zonaId).toBe(1);
  });
});
