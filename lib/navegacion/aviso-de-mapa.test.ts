import type { FeatureCollection } from "geojson";
import { describe, expect, it, vi } from "vitest";
import { avisoPorFaltaDeMapa } from "@/lib/navegacion/aviso-de-mapa";
import type { Sector } from "@/types/database";

/**
 * Las pruebas del aviso de falta de mapa.
 *
 * La decisión es que **la navegación arranca igual**, aunque falte mapa. Eso
 * solo es aceptable si el cartel aparece siempre que corresponde: si el aviso
 * se pierde, el usuario cree que está mirando un mapa que no existe.
 */

vi.mock("@/components/mapa/capas-base", () => ({
  sePuedenDescargarMapas: () => hayMapasCargados,
}));

let hayMapasCargados = true;

function sector(id: number, nombre: string, rectangulo: Sector["rectangulo"]): Sector {
  return {
    id,
    zonaId: 1,
    perfilId: "alguien",
    nombre,
    descripcion: null,
    rectangulo,
    creadoEn: "2026-01-01T00:00:00Z",
    actualizadoEn: "2026-01-01T00:00:00Z",
  };
}

function recorrido(coordenadas: number[][]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: coordenadas },
      },
    ],
  };
}

const CUBRE_TODO = sector(1, "Villa Alpina", {
  latNorte: -31.9,
  latSur: -32.1,
  lonEste: -64.8,
  lonOeste: -65.0,
});

const ADENTRO = recorrido([
  [-64.95, -32.0],
  [-64.9, -31.98],
  [-64.85, -31.95],
]);

describe("el aviso de que falta mapa", () => {
  it("avisa siempre que todavía no hay mapas cargados en la app", () => {
    hayMapasCargados = false;

    const aviso = avisoPorFaltaDeMapa(ADENTRO, [CUBRE_TODO], new Set([1]));

    expect(aviso).not.toBeNull();
    expect(aviso).toContain("sin fondo de mapa");
  });

  it("no dice nada cuando está todo cubierto y todo bajado", () => {
    hayMapasCargados = true;

    expect(avisoPorFaltaDeMapa(ADENTRO, [CUBRE_TODO], new Set([1]))).toBeNull();
  });

  it("nombra el sector que falta bajar cuando es uno solo", () => {
    hayMapasCargados = true;

    const aviso = avisoPorFaltaDeMapa(ADENTRO, [CUBRE_TODO], new Set());

    expect(aviso).toContain("Villa Alpina");
    expect(aviso).toContain("sin fondo");
  });

  it("cuenta los sectores cuando falta bajar más de uno", () => {
    hayMapasCargados = true;

    const oeste = sector(1, "Oeste", {
      latNorte: -31.9,
      latSur: -32.1,
      lonEste: -64.9,
      lonOeste: -65.0,
    });
    const este = sector(2, "Este", {
      latNorte: -31.9,
      latSur: -32.1,
      lonEste: -64.8,
      lonOeste: -64.9,
    });

    const aviso = avisoPorFaltaDeMapa(ADENTRO, [oeste, este], new Set());

    expect(aviso).toContain("2 mapas");
  });

  it("avisa cuántos kilómetros quedan fuera de todo sector", () => {
    hayMapasCargados = true;

    // La ruta se va bien al este, fuera del único sector.
    const seSale = recorrido([
      [-64.95, -32.0],
      [-64.3, -32.0],
    ]);

    const aviso = avisoPorFaltaDeMapa(seSale, [CUBRE_TODO], new Set([1]));

    expect(aviso).toContain("km de esta ruta sin mapa");
  });

  it("prioriza el hueco sobre el mapa sin bajar, que es lo más grave", () => {
    hayMapasCargados = true;

    const seSale = recorrido([
      [-64.95, -32.0],
      [-64.3, -32.0],
    ]);

    const aviso = avisoPorFaltaDeMapa(seSale, [CUBRE_TODO], new Set());

    expect(aviso).toContain("sin mapa");
    expect(aviso).not.toContain("Te falta bajar");
  });
});
