import { describe, expect, it } from "vitest";
import {
  clasesDibujadas,
  comoSectores,
  rectangulosDeLaRuta,
  zonasQueCruza,
} from "@/lib/mapas/rectangulos";
import type { Cobertura } from "@/lib/cobertura";
import type { Rectangulo, Sector, Zona } from "@/types/database";

/**
 * Las pruebas de qué se dibuja sobre la ruta.
 *
 * **Lo que se ve es lo que el usuario usa para decidir.** Si un sector bajado
 * se dibujara del color del que falta, o si una zona que la ruta no toca
 * apareciera igual, la persona sale al cerro creyendo otra cosa.
 */

function rect(lonOeste: number, ancho = 0.1): Rectangulo {
  return { latNorte: -31.8, latSur: -32.0, lonOeste, lonEste: lonOeste + ancho };
}

function zona(id: number, lonOeste: number): Zona {
  return {
    id,
    perfilId: "alguien",
    nombre: `Zona ${id}`,
    descripcion: null,
    rectangulo: rect(lonOeste, 0.4),
    creadoEn: "2026-09-01T10:00:00Z",
    actualizadoEn: "2026-09-01T10:00:00Z",
  };
}

function sector(id: number, lonOeste: number): Sector {
  return {
    id,
    zonaId: 1,
    perfilId: "alguien",
    nombre: `Sector ${id}`,
    descripcion: null,
    rectangulo: rect(lonOeste),
    creadoEn: "2026-09-01T10:00:00Z",
    actualizadoEn: "2026-09-01T10:00:00Z",
  };
}

function cobertura(sectores: Array<[Sector, "descargado" | "falta_descargar"]>): Cobertura {
  return {
    sectores: sectores.map(([sector, estado]) => ({ sector, estado, metros: 0 })),
    metrosSinCobertura: 0,
    metrosTotales: 10000,
  };
}

describe("qué zonas toca una ruta", () => {
  it("trae las que se cruzan y deja afuera las lejanas", () => {
    const tocadas = zonasQueCruza(rect(-64.9), [
      zona(1, -64.95),
      zona(2, -60.0),
      zona(3, -64.85),
    ]);

    expect(tocadas.map((cada) => cada.id)).toEqual([1, 3]);
  });

  it("una ruta puede no tocar ninguna zona, y no es un error", () => {
    expect(zonasQueCruza(rect(-64.9), [zona(1, -60.0)])).toEqual([]);
  });
});

describe("qué se dibuja sobre la ruta", () => {
  it("el sector bajado y el que falta no se dibujan igual", () => {
    // Si se dibujaran igual, el usuario no podría ver de un vistazo qué le
    // falta, que es justamente para lo que sirve el mapa.
    const dibujados = rectangulosDeLaRuta(
      cobertura([
        [sector(10, -64.95), "descargado"],
        [sector(11, -64.85), "falta_descargar"],
      ]),
      [],
      rect(-64.9),
    );

    expect(dibujados.map((cada) => cada.clase)).toEqual([
      "sector_bajado",
      "sector_sin_bajar",
    ]);
  });

  it("las zonas van primero, para que los sectores queden encima", () => {
    const dibujados = rectangulosDeLaRuta(
      cobertura([[sector(10, -64.95), "descargado"]]),
      [zona(1, -64.95)],
      rect(-64.9),
    );

    expect(dibujados[0].clase).toBe("zona");
    expect(dibujados[1].clase).toBe("sector_bajado");
  });

  it("una zona que la ruta no toca no se dibuja", () => {
    const dibujados = rectangulosDeLaRuta(cobertura([]), [zona(1, -60.0)], rect(-64.9));
    expect(dibujados).toEqual([]);
  });

  it("los vecinos de una pantalla de armar van todos como sector", () => {
    expect(comoSectores([rect(-64.9), rect(-64.8)]).map((c) => c.clase)).toEqual([
      "sector",
      "sector",
    ]);
  });
});

describe("la referencia de colores", () => {
  it("solo nombra lo que está dibujado", () => {
    // Explicar un color que no se ve confunde más de lo que ayuda.
    const clases = clasesDibujadas([
      { rectangulo: rect(-64.9), clase: "sector_bajado" },
      { rectangulo: rect(-64.8), clase: "zona" },
    ]);

    expect(clases).toEqual(["zona", "sector_bajado"]);
  });

  it("no repite una clase que aparece muchas veces", () => {
    const clases = clasesDibujadas([
      { rectangulo: rect(-64.9), clase: "sector" },
      { rectangulo: rect(-64.8), clase: "sector" },
    ]);

    expect(clases).toEqual(["sector"]);
  });

  it("sin nada dibujado no hay nada que explicar", () => {
    expect(clasesDibujadas([])).toEqual([]);
  });
});
