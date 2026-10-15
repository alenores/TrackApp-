import { describe, expect, it } from "vitest";
import { buscarEnConsultas, VALOR_DE_CADA_CARACTER, type ElementoBuscable } from "@/lib/marcas/buscar-en-consultas";

function elemento(
  capa: ElementoBuscable["capa"],
  id: number,
  titulo: string,
  textos: string[] = [titulo],
  grupo: ElementoBuscable["grupo"] = capa === "zonas" ? "zona" : capa === "caminos" ? "camino" : "punto",
): ElementoBuscable {
  const aclaracion = capa === "zonas" ? "Zona" : capa === "caminos" ? "Camino" : "Detalle";
  return { capa, id, titulo, aclaracion, textos, grupo };
}

describe("buscar en Consultas", () => {
  const elementos = [
    elemento("zonas", 1, "Cerro del Río"),
    elemento("caminos", 2, "Río"),
    elemento("detalles", 3, "vadeo", ["vadeo del río", "Arroyo"]),
    elemento("zonas", 4, "Los Gigantes"),
    elemento("caminos", 5, "Huella de los gigantes"),
  ];

  it("no distingue mayúsculas ni tildes", () => {
    const porMayusculas = buscarEnConsultas("RIO", elementos).lista.map((cada) => cada.titulo);
    const porTildes = buscarEnConsultas("rio", elementos).lista.map((cada) => cada.titulo);
    expect(porMayusculas).toEqual(["Cerro del Río", "Río", "vadeo"]);
    expect(porTildes).toEqual(porMayusculas);
    expect(buscarEnConsultas("champaqui", [elemento("zonas", 8, "Champaquí")]).lista).toHaveLength(1);
    expect(buscarEnConsultas("canada", [elemento("zonas", 9, "Cañada")]).lista).toHaveLength(1);
  });

  it("cada carácter vale más en una zona, después en un Camino y al final en un detalle", () => {
    const lista = buscarEnConsultas("rio", elementos).lista;
    expect(lista.map((cada) => cada.capa)).toEqual(["zonas", "caminos", "detalles"]);
    expect(lista.map((cada) => cada.puntaje)).toEqual([
      "rio".length * VALOR_DE_CADA_CARACTER.zonas,
      "rio".length * VALOR_DE_CADA_CARACTER.caminos,
      "rio".length * VALOR_DE_CADA_CARACTER.detalles,
    ]);
  });

  it("entre dos de la misma clase, gana el nombre donde el texto empieza antes", () => {
    const titulos = buscarEnConsultas("los", elementos).lista.map((cada) => cada.titulo);
    expect(titulos[0]).toBe("Los Gigantes");
    expect(titulos[1]).toBe("Huella de los gigantes");
  });

  it("en un detalle busca el comentario y el nombre del ícono", () => {
    const hallados = buscarEnConsultas("tranquera", [
      elemento("detalles", 7, "del puesto", ["del puesto", "Tranquera"], "punto"),
    ]).lista;
    expect(hallados.map((cada) => cada.titulo)).toEqual(["del puesto"]);
  });

  it("no alcanza con letras sueltas, y no busca si no hay nada escrito", () => {
    expect(buscarEnConsultas("lg", elementos).lista).toEqual([]);
    expect(buscarEnConsultas("   ", elementos)).toEqual({ lista: [], hayMas: false });
    expect(buscarEnConsultas("no-esta", elementos).lista).toEqual([]);
  });

  it("muestra las primeras y avisa que hay más", () => {
    const muchas = Array.from({ length: 31 }, (_, indice) => elemento("zonas", indice + 1, `Río ${indice + 1}`));
    const busqueda = buscarEnConsultas("rio", muchas);
    expect(busqueda.lista).toHaveLength(30);
    expect(busqueda.hayMas).toBe(true);
  });
});
