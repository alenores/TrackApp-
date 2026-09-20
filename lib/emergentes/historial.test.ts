// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  abrirEnElHistorial,
  cerrarEnElHistorial,
  hayEntradaDeSobra,
  olvidarLaEntradaDeSobra,
} from "@/lib/emergentes/historial";

/**
 * Las pruebas del historial de las emergentes.
 *
 * **Lo que se prueba acá se rompió una vez y no se vio.** Cerrar un cartel con
 * la X le pedía al navegador volver atrás, y volver atrás rearma la pantalla
 * entera: el mapa se destruía y el toque siguiente caía en el vacío. En el
 * cerro eso es tocar una anotación y que no pase nada.
 *
 * Por eso las dos que mandan son: que cerrar **no** mueva el historial, y que
 * abrir y cerrar muchas veces no deje una pila de entradas muertas.
 */

beforeEach(() => {
  olvidarLaEntradaDeSobra();
  window.history.replaceState({}, "");
});

describe("abrir y cerrar una emergente", () => {
  it("al abrir deja la marca que hace que el atrás la cierre", () => {
    abrirEnElHistorial();
    expect(window.history.state?.emergenteAbierta).toBe(true);
  });

  it("cerrar con un botón NO mueve el historial", () => {
    const antes = window.history.length;

    abrirEnElHistorial();
    cerrarEnElHistorial();

    // Una entrada más por el abrir; ninguna vuelta atrás por el cerrar.
    expect(window.history.length).toBe(antes + 1);
    expect(window.history.state?.emergenteAbierta).toBe(false);
  });

  it("abrir y cerrar diez veces deja UNA sola entrada, no diez", () => {
    const antes = window.history.length;

    for (let vez = 0; vez < 10; vez += 1) {
      abrirEnElHistorial();
      cerrarEnElHistorial();
    }

    expect(window.history.length).toBe(antes + 1);
  });

  it("dos emergentes apiladas usan una entrada cada una", () => {
    const antes = window.history.length;

    abrirEnElHistorial();
    abrirEnElHistorial();

    expect(window.history.length).toBe(antes + 2);
  });

  it("no se pierde lo que el navegador ya tenía guardado en la entrada", () => {
    window.history.replaceState({ loDeAntes: "sigue acá" }, "");

    abrirEnElHistorial();
    expect(window.history.state?.loDeAntes).toBe("sigue acá");

    cerrarEnElHistorial();
    expect(window.history.state?.loDeAntes).toBe("sigue acá");
  });
});

describe("la entrada de sobra", () => {
  it("queda marcada después de cerrar con un botón", () => {
    abrirEnElHistorial();
    cerrarEnElHistorial();

    expect(hayEntradaDeSobra()).toBe(true);
  });

  it("la siguiente emergente la reusa y deja de estar de sobra", () => {
    abrirEnElHistorial();
    cerrarEnElHistorial();

    abrirEnElHistorial();
    expect(hayEntradaDeSobra()).toBe(false);
    expect(window.history.state?.emergenteAbierta).toBe(true);
  });

  it("cerrar con el atrás físico no deja nada de sobra", () => {
    abrirEnElHistorial();

    // Así queda el historial después de un atrás de verdad: la entrada con la
    // marca ya no está.
    window.history.replaceState({}, "");
    cerrarEnElHistorial();

    expect(hayEntradaDeSobra()).toBe(false);
  });
});
