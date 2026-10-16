import { describe, expect, it } from "vitest";
import { elToqueMarcaEnElMapa } from "@/hooks/use-marcar-anotacion";

/**
 * Un punto se mueve con un toque. Un trazo no arranca en el GPS y no suma
 * puntos hasta que se aprieta comenzar a dibujar.
 */

describe("dónde marca un toque en el mapa", () => {
  it("en un punto, el toque mueve el lugar", () => {
    expect(elToqueMarcaEnElMapa("punto", false)).toBe(true);
  });

  it("en un trazo, el toque no marca mientras está el formulario", () => {
    expect(elToqueMarcaEnElMapa("trazo", false)).toBe(false);
  });

  it("en un trazo, el toque suma un punto recién al dibujar", () => {
    expect(elToqueMarcaEnElMapa("trazo", true)).toBe(true);
  });

  it("sin pantalla de marcar, el toque no marca", () => {
    expect(elToqueMarcaEnElMapa(null, false)).toBe(false);
  });
});
