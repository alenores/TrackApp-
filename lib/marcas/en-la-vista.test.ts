import { describe, expect, it } from "vitest";
import { asomaEnLaVista, entraEnLoQueSeMira, lugarDeMarca, type LugarEnElMapa } from "@/lib/marcas/en-la-vista";
import type { Rectangulo } from "@/types/database";

const VISTA: Rectangulo = { latNorte: -31.4, latSur: -31.6, lonOeste: -64.7, lonEste: -64.5 };

describe("lo que entra en el mapa que se mira", () => {
  it("un punto adentro o en el borde queda, y uno afuera no", () => {
    expect(asomaEnLaVista({ forma: "punto", lon: -64.6, lat: -31.5 }, VISTA)).toBe(true);
    expect(asomaEnLaVista({ forma: "punto", lon: -64.5, lat: -31.4 }, VISTA)).toBe(true);
    expect(asomaEnLaVista({ forma: "punto", lon: -64.4, lat: -31.5 }, VISTA)).toBe(false);
  });

  it("una zona que asoma apenas queda, y una entera afuera no", () => {
    const asoma: LugarEnElMapa = {
      forma: "zona",
      rectangulo: { latNorte: -31.35, latSur: -31.45, lonOeste: -64.8, lonEste: -64.65 },
    };
    const afuera: LugarEnElMapa = {
      forma: "zona",
      rectangulo: { latNorte: -32, latSur: -32.2, lonOeste: -65, lonEste: -64.8 },
    };
    const laTapa: LugarEnElMapa = {
      forma: "zona",
      rectangulo: { latNorte: -31, latSur: -32, lonOeste: -65, lonEste: -64 },
    };
    expect(asomaEnLaVista(asoma, VISTA)).toBe(true);
    expect(asomaEnLaVista(afuera, VISTA)).toBe(false);
    expect(asomaEnLaVista(laTapa, VISTA)).toBe(true);
  });

  it("un Camino que cruza el mapa queda aunque sus puntas estén afuera", () => {
    expect(asomaEnLaVista({
      forma: "linea",
      coordenadas: [[-64.9, -31.5], [-64.3, -31.5]],
    }, VISTA)).toBe(true);
  });

  it("un Camino que rodea el mapa sin entrar no queda, aunque su caja sí lo tape", () => {
    expect(asomaEnLaVista({
      forma: "linea",
      coordenadas: [[-64.8, -31.7], [-64.4, -31.7], [-64.4, -31.3]],
    }, VISTA)).toBe(false);
  });

  it("sin vista se lista todo, y sin lugar solo mientras se abre la línea", () => {
    expect(entraEnLoQueSeMira(null, null, false)).toBe(true);
    expect(entraEnLoQueSeMira(null, VISTA, true)).toBe(true);
    expect(entraEnLoQueSeMira(null, VISTA, false)).toBe(false);
    expect(entraEnLoQueSeMira({ forma: "punto", lon: -64.6, lat: -31.5 }, VISTA, false)).toBe(true);
  });

  it("saca el lugar de una zona, un punto, un trazo y un Camino", () => {
    const zona = lugarDeMarca(
      { grupo: "zona", id: 1 },
      new Map(),
      new Map(),
      new Map([[1, { rectangulo: VISTA }]]),
    );
    const punto = lugarDeMarca(
      { grupo: "punto", id: 2 },
      new Map(),
      new Map([[2, { geometria: { type: "Point", coordinates: [-64.6, -31.5] } }]]),
      new Map(),
    );
    const camino = lugarDeMarca(
      { grupo: "camino", id: 3 },
      new Map([[3, { coordenadas: [[-64.6, -31.5], [-64.55, -31.52]] }]]),
      new Map(),
      new Map(),
    );
    const sinLinea = lugarDeMarca({ grupo: "camino", id: 4 }, new Map(), new Map(), new Map());
    expect(zona).toEqual({ forma: "zona", rectangulo: VISTA });
    expect(punto).toEqual({ forma: "punto", lon: -64.6, lat: -31.5 });
    expect(camino?.forma).toBe("linea");
    expect(sinLinea).toBeNull();
  });
});
