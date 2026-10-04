// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { elQueSeDesplaza, hayQueIgnorarElTiron } from "@/lib/sin-recargar-al-tirar";

/**
 * Que el tirón hacia abajo desde arriba de todo no recargue la app, y que
 * eso no se lleve puesto ni el desplazamiento normal ni el mapa.
 */

describe("el tirón hacia abajo", () => {
  it("se ignora cuando no queda nada por ver arriba: eso era recargar", () => {
    expect(hayQueIgnorarElTiron({ haciaAbajo: true, enElMapa: false, quedaAlgoArriba: false })).toBe(true);
  });

  it("se respeta cuando hay contenido arriba: es desplazarse", () => {
    expect(hayQueIgnorarElTiron({ haciaAbajo: true, enElMapa: false, quedaAlgoArriba: true })).toBe(false);
  });

  it("hacia arriba nunca se toca", () => {
    expect(hayQueIgnorarElTiron({ haciaAbajo: false, enElMapa: false, quedaAlgoArriba: false })).toBe(false);
  });

  it("adentro del mapa nunca se toca: el mapa se maneja solo", () => {
    expect(hayQueIgnorarElTiron({ haciaAbajo: true, enElMapa: true, quedaAlgoArriba: false })).toBe(false);
  });
});

describe("qué se desplaza debajo del dedo", () => {
  /** La lista de la app, ya desplazada hacia abajo, con un dibujo adentro. */
  function listaDesplazadaConUnDibujo() {
    const lista = document.createElement("div");
    lista.style.overflowY = "auto";
    Object.defineProperty(lista, "scrollHeight", { value: 2000 });
    Object.defineProperty(lista, "clientHeight", { value: 800 });
    lista.scrollTop = 600;
    const tarjeta = document.createElement("div");
    const dibujo = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const linea = document.createElementNS("http://www.w3.org/2000/svg", "path");
    dibujo.append(linea);
    tarjeta.append(dibujo);
    lista.append(tarjeta);
    document.body.append(lista);
    return { lista, tarjeta, linea };
  }

  it("encuentra la lista desde un elemento común", () => {
    const { lista, tarjeta } = listaDesplazadaConUnDibujo();
    expect(elQueSeDesplaza(tarjeta)).toBe(lista);
    lista.remove();
  });

  it("encuentra la lista también desde un dibujo, como la línea de una salida", () => {
    // Pasó en Salidas el 2026-10-04: tocando la línea de la portada o un ícono
    // no se podía volver hacia arriba, porque desde un dibujo no se encontraba
    // la lista y se creía que era un tirón para recargar.
    const { lista, linea } = listaDesplazadaConUnDibujo();
    expect(elQueSeDesplaza(linea)).toBe(lista);
    lista.remove();
  });
});
