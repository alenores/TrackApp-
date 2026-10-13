import { describe, expect, it } from "vitest";
import type { Anotacion, Zona } from "@/types/database";
import type { CaminoSinLinea } from "@/lib/caminos/datos";
import { claseDelDetalle, esFija } from "@/lib/marcas/clases";
import {
  agrupar,
  alternarGrupo,
  alternarUna,
  armarLaLista,
  lasDelMapa,
  leerFiltrosDeMarcas,
  rectanguloDe,
  SIN_FILTROS,
} from "@/lib/marcas/lista";

const camino = (id: number, perfilId: string, actividades: CaminoSinLinea["actividades"]) =>
  ({ id, perfilId, actividades, nombre: `Camino ${id}` }) as CaminoSinLinea;
const detalle = (id: number, perfilId: string, tipo: Anotacion["tipo"], origen: Anotacion["origen"]) =>
  ({ id, perfilId, tipo, origen }) as Anotacion;
const zona = (id: number) => ({ id, perfilId: "ale" }) as Zona;

const lista = armarLaLista(
  [camino(1, "ale", ["trekking"]), camino(2, "amigo", ["kayak"])],
  [
    detalle(10, "ale", "punto", "manual"),
    detalle(11, "amigo", "trazo", "google_earth"),
    detalle(12, "ale", "punto", "openstreetmap"),
    detalle(13, "ale", "trazo", "openstreetmap"),
  ],
  [zona(5)],
);

describe("clases de marcas", () => {
  it("lo de OpenStreetMap es un punto o un trazo, y queda fijo", () => {
    expect(claseDelDetalle({ tipo: "punto" })).toBe("punto");
    expect(claseDelDetalle({ tipo: "trazo" })).toBe("trazo");
    expect(esFija({ origen: "openstreetmap" })).toBe(true);
  });

  it("lo marcado a mano o navegando se puede cambiar", () => {
    expect(esFija({ origen: "manual" })).toBe(false);
    expect(esFija({ origen: "navegacion" })).toBe(false);
  });
});

describe("lista de Marcas", () => {
  it("agrupa en el orden decidido, con las zonas al final", () => {
    expect(agrupar(lista, new Set()).map((grupo) => grupo.grupo)).toEqual([
      "camino", "punto", "trazo", "zona",
    ]);
  });

  it("todo arranca tildado y en el mapa", () => {
    expect(lasDelMapa(lista, SIN_FILTROS, "ale", new Set())).toHaveLength(lista.length);
  });

  it("en el mapa queda solo lo tildado que además pasa los filtros", () => {
    const filtros = { ...SIN_FILTROS, clases: ["camino" as const] };
    const enElMapa = lasDelMapa(lista, filtros, "ale", new Set(["camino:2"]));
    expect(enElMapa.map((marca) => marca.clave)).toEqual(["camino:1", "zona:5"]);
  });

  it("la actividad deja solo los Caminos que la tienen, sin tocar el resto", () => {
    const enElMapa = lasDelMapa(lista, { ...SIN_FILTROS, actividad: "kayak" }, "ale", new Set());
    expect(enElMapa.filter((marca) => marca.grupo === "camino").map((marca) => marca.id)).toEqual([2]);
    expect(enElMapa.some((marca) => marca.grupo === "punto")).toBe(true);
  });

  it("el origen separa lo de OpenStreetMap de lo propio, y no toca Caminos ni zonas", () => {
    const deOsm = lasDelMapa(lista, { ...SIN_FILTROS, origen: "openstreetmap" }, "ale", new Set());
    expect(deOsm.map((marca) => marca.clave)).toEqual(["camino:1", "camino:2", "detalle:12", "detalle:13", "zona:5"]);
    const propios = lasDelMapa(lista, { ...SIN_FILTROS, origen: "propios" }, "ale", new Set());
    expect(propios.map((marca) => marca.clave)).toEqual(["camino:1", "camino:2", "detalle:10", "detalle:11", "zona:5"]);
  });

  it("separa lo mío de lo de otros, y las zonas no cuentan", () => {
    const mias = lasDelMapa(lista, { ...SIN_FILTROS, autoria: "mias" }, "ale", new Set());
    expect(mias.map((marca) => marca.clave)).toEqual(["camino:1", "detalle:10", "detalle:12", "detalle:13", "zona:5"]);
    const deOtros = lasDelMapa(lista, { ...SIN_FILTROS, autoria: "de_otros" }, "ale", new Set());
    expect(deOtros.map((marca) => marca.clave)).toEqual(["camino:2", "detalle:11", "zona:5"]);
  });

  it("el tilde del grupo destilda todo si estaba todo, y si no tilda todo", () => {
    const [caminos] = agrupar(lista, new Set());
    const destildadas = alternarGrupo(caminos, []);
    expect(destildadas.sort()).toEqual(["camino:1", "camino:2"]);
    const [aMedias] = agrupar(lista, new Set(["camino:1"]));
    expect(alternarGrupo(aMedias, ["camino:1", "zona:5"])).toEqual(["zona:5"]);
  });

  it("tildar y destildar de a una", () => {
    expect(alternarUna("camino:1", [])).toEqual(["camino:1"]);
    expect(alternarUna("camino:1", ["camino:1", "zona:5"])).toEqual(["zona:5"]);
  });

  it("lo guardado que no se entiende vuelve a lo de siempre", () => {
    expect(leerFiltrosDeMarcas("cualquier cosa")).toBeNull();
    expect(leerFiltrosDeMarcas({ clases: [], actividad: "volar", autoria: "nadie", origen: "marte" })).toEqual(SIN_FILTROS);
    expect(leerFiltrosDeMarcas({ clases: ["punto"], actividad: "kayak", autoria: "mias", origen: "propios" }))
      .toEqual({ clases: ["punto"], actividad: "kayak", autoria: "mias", origen: "propios" });
  });

  it("el encuadre abarca todo, y a un punto solo le da terreno alrededor", () => {
    expect(rectanguloDe([])).toBeNull();
    const deDos = rectanguloDe([[-64.5, -31.5], [-64.4, -31.4]])!;
    expect(deDos).toEqual({ latNorte: -31.4, latSur: -31.5, lonEste: -64.4, lonOeste: -64.5 });
    const deUno = rectanguloDe([[-64.5, -31.5]])!;
    expect(deUno.latNorte - deUno.latSur).toBeGreaterThan(0);
    expect(deUno.lonEste - deUno.lonOeste).toBeGreaterThan(0);
  });
});

describe("filtros que se aplican en Marcas", () => {
  it("las clases las deciden las casillas de cada grupo: un filtro de clases viejo guardado ya no esconde nada", async () => {
    const { filtrosQueSeAplican } = await import("@/lib/marcas/lista");
    const viejo = { clases: ["punto" as const], actividad: "kayak" as const, autoria: "mias" as const, origen: "todos" as const };
    expect(filtrosQueSeAplican(viejo)).toEqual({ ...SIN_FILTROS, actividad: "kayak" });
  });
});
