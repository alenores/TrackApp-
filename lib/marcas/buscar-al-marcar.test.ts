import { describe, expect, it } from "vitest";
import {
  buscarAlMarcar,
  encuadreAlMarcar,
  VALOR_AL_MARCAR,
  type ElementoAlMarcar,
} from "@/lib/marcas/buscar-al-marcar";
import type { Anotacion, Sector, Zona } from "@/types/database";
import type { CaminoGuardado } from "@/lib/caminos/datos";

function elemento(
  clase: ElementoAlMarcar["clase"],
  id: number,
  titulo: string,
  textos: string[] = [titulo],
): ElementoAlMarcar {
  const aclaracion = clase === "zona" ? "Zona" : clase === "sector" ? "Sector" : clase === "camino" ? "Camino" : clase === "punto" ? "Punto" : "Trazo";
  return { clase, id, titulo, aclaracion, textos };
}

const ELEMENTOS = [
  elemento("zona", 1, "Cerro del Río"),
  elemento("sector", 2, "Río chico"),
  elemento("camino", 3, "Río"),
  elemento("punto", 4, "vadeo", ["vadeo del río", "Arroyo"]),
  elemento("trazo", 5, "río seco"),
];

describe("buscar al marcar", () => {
  it("no distingue mayúsculas ni tildes", () => {
    const porMayusculas = buscarAlMarcar("RIO", ELEMENTOS).lista.map((cada) => cada.titulo);
    const porTildes = buscarAlMarcar("rio", ELEMENTOS).lista.map((cada) => cada.titulo);
    expect(porMayusculas).toEqual(["Cerro del Río", "Río chico", "Río", "río seco", "vadeo"]);
    expect(porTildes).toEqual(porMayusculas);
  });

  it("ordena zona, sector, Camino, y al final punto y trazo", () => {
    const lista = buscarAlMarcar("rio", ELEMENTOS).lista;
    expect(lista.map((cada) => cada.clase)).toEqual(["zona", "sector", "camino", "trazo", "punto"]);
    expect(lista[0]?.puntaje).toBe("rio".length * VALOR_AL_MARCAR.zona);
    expect(lista[3]?.puntaje).toBe(lista[4]?.puntaje);
  });

  it("no busca si no hay nada escrito", () => {
    expect(buscarAlMarcar("   ", ELEMENTOS)).toEqual({ lista: [], hayMas: false });
  });

  it("lleva el mapa a la zona o al sector elegido", () => {
    const zona = { id: 1, rectangulo: { latNorte: -31, latSur: -32, lonOeste: -65, lonEste: -64 } } as Zona;
    const sector = { id: 2, rectangulo: { latNorte: -31.2, latSur: -31.3, lonOeste: -64.5, lonEste: -64.4 } } as Sector;
    expect(encuadreAlMarcar({ clase: "zona", id: 1 }, [zona], [sector], [], [], false)).toEqual({ encuadre: zona.rectangulo });
    expect(encuadreAlMarcar({ clase: "sector", id: 2 }, [zona], [sector], [], [], false)).toEqual({ encuadre: sector.rectangulo });
  });

  it("avisa si el Camino todavía no tiene la línea", () => {
    const aviso = encuadreAlMarcar({ clase: "camino", id: 9 }, [], [], [], [], true);
    expect("aviso" in aviso && aviso.aviso).toMatch(/abriendo/);
  });

  it("avisa si el Camino no está guardado en el celular", () => {
    const aviso = encuadreAlMarcar({ clase: "camino", id: 9 }, [], [], [] as CaminoGuardado[], [], false);
    expect("aviso" in aviso && aviso.aviso).toMatch(/no tiene la línea/);
  });

  it("encuadra un punto", () => {
    const anotacion = { id: 4, geometria: { type: "Point", coordinates: [-64.5, -31.5] } } as Anotacion;
    const lugar = encuadreAlMarcar({ clase: "punto", id: 4 }, [], [], [], [anotacion], false);
    expect("encuadre" in lugar).toBe(true);
  });
});
