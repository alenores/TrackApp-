import { describe, expect, it } from "vitest";
import {
  comoLista,
  mapasPerdidos,
  rutasSinMapa,
  sectoresDeLasRutas,
  sectoresDeLaRuta,
} from "@/lib/mapas/lo-que-falta";
import type { MapaQueTenias } from "@/lib/supabase/mapas-bajados";
import type { Rectangulo, RutaResumen, Sector } from "@/types/database";

/**
 * Las pruebas de qué le falta al celular.
 *
 * **De esto depende que el usuario se entere en casa.** Si un mapa perdido no se
 * detecta, la persona sale al cerro creyendo que lo tiene; si uno que nunca bajó
 * se cuenta como perdido, la app le miente sobre lo que le pasó.
 */

function rect(lonOeste: number, ancho = 0.1): Rectangulo {
  return { latNorte: -31.8, latSur: -32.0, lonOeste, lonEste: lonOeste + ancho };
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

function ruta(id: number, lonOeste: number, ancho = 0.1): RutaResumen {
  return {
    id,
    perfilId: "alguien",
    nombre: `Ruta ${id}`,
    descripcion: null,
    actividades: ["trekking"],
    dificultadTecnica: null,
    nivelEsfuerzo: null,
    largoKm: 10,
    desnivelPositivoM: null,
    desnivelNegativoM: null,
    color: "naranja",
    rectangulo: rect(lonOeste, ancho),
    creadoEn: "2026-09-01T10:00:00Z",
    actualizadoEn: "2026-09-01T10:00:00Z",
  };
}

function tenias(sectorId: number): MapaQueTenias {
  return { sectorId, tipo: "simple", acercamientoMaximo: 15 };
}

describe("los mapas que se perdieron", () => {
  it("avisa del que la base dice que tenías y en el celular no está", () => {
    const perdidos = mapasPerdidos(
      [tenias(10), tenias(11)],
      [sector(10, -64.9), sector(11, -64.7)],
      new Set([11]),
    );

    expect(perdidos.map((cada) => cada.sector.id)).toEqual([10]);
  });

  it("no inventa una pérdida cuando el mapa sigue en el celular", () => {
    expect(mapasPerdidos([tenias(10)], [sector(10, -64.9)], new Set([10]))).toEqual(
      [],
    );
  });

  it("un sector que ya no existe no es una pérdida: no hay nada que recuperar", () => {
    // Si se borró la zona entera, ofrecerle bajar ese mapa sería ofrecer nada.
    expect(mapasPerdidos([tenias(99)], [sector(10, -64.9)], new Set())).toEqual([]);
  });

  it("se queda con el tipo y el acercamiento, para bajarlo igual que estaba", () => {
    const perdidos = mapasPerdidos(
      [{ sectorId: 10, tipo: "satelital", acercamientoMaximo: 14 }],
      [sector(10, -64.9)],
      new Set(),
    );

    expect(perdidos[0].tipo).toBe("satelital");
    expect(perdidos[0].acercamientoMaximo).toBe(14);
  });
});

describe("las rutas que nunca tuvieron mapa", () => {
  it("trae la ruta cuyo sector no está bajado", () => {
    const sinMapa = rutasSinMapa(
      [ruta(1, -64.9)],
      [sector(10, -64.95)],
      new Set(),
      [],
    );

    expect(sinMapa.map((cada) => cada.ruta.id)).toEqual([1]);
    expect(sinMapa[0].sectores.map((cada) => cada.id)).toEqual([10]);
  });

  it("deja afuera la ruta que ya tiene todos sus mapas", () => {
    expect(
      rutasSinMapa([ruta(1, -64.9)], [sector(10, -64.95)], new Set([10]), []),
    ).toEqual([]);
  });

  it("una ruta que no toca ningún sector no se ofrece: no hay mapa que bajarle", () => {
    expect(rutasSinMapa([ruta(1, -60.0)], [sector(10, -64.95)], new Set(), [])).toEqual(
      [],
    );
  });

  it("un sector perdido no se cuenta además como nunca bajado", () => {
    // Es el mismo problema: contarlo dos veces le pone dos carteles a una sola
    // cosa y el usuario no sabe cuál resolver.
    const elSector = sector(10, -64.95);

    const sinMapa = rutasSinMapa(
      [ruta(1, -64.9)],
      [elSector],
      new Set(),
      [{ sector: elSector, tipo: "simple", acercamientoMaximo: 15 }],
    );

    expect(sinMapa).toEqual([]);
  });

  it("una ruta con un sector perdido y otro nunca bajado avisa solo del nunca bajado", () => {
    const perdido = sector(10, -64.95);
    const nuevo = sector(11, -64.85);

    const sinMapa = rutasSinMapa(
      [ruta(1, -64.9, 0.2)],
      [perdido, nuevo],
      new Set(),
      [{ sector: perdido, tipo: "simple", acercamientoMaximo: 15 }],
    );

    expect(sinMapa[0].sectores.map((cada) => cada.id)).toEqual([11]);
  });
});

describe("los sectores de una ruta", () => {
  it("trae los que se cruzan con ella", () => {
    const tocados = sectoresDeLaRuta(ruta(1, -64.9), [
      sector(10, -64.95),
      sector(11, -60.0),
    ]);

    expect(tocados.map((cada) => cada.id)).toEqual([10]);
  });

  it("no repite un sector que aparece en dos rutas", () => {
    const compartido = sector(10, -64.95);

    const sueltos = sectoresDeLasRutas([
      { ruta: ruta(1, -64.9), sectores: [compartido] },
      { ruta: ruta(2, -64.9), sectores: [compartido] },
    ]);

    expect(sueltos.map((cada) => cada.id)).toEqual([10]);
  });
});

describe("los nombres en una oración", () => {
  it("usa «y» antes del último", () => {
    expect(comoLista(["Pampa", "Filo", "Cuesta"])).toBe("Pampa, Filo y Cuesta");
  });

  it("con uno solo no agrega nada", () => {
    expect(comoLista(["Pampa"])).toBe("Pampa");
  });

  it("con ninguno no devuelve nada", () => {
    expect(comoLista([])).toBe("");
  });
});
