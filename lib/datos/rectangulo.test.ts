import { describe, expect, it } from "vitest";
import {
  estaAdentroDe,
  rectanguloEsValido,
  rectanguloQueAbarca,
  seSuperponen,
} from "@/lib/datos/rectangulo";
import type { Rectangulo } from "@/types/database";

/**
 * Las pruebas de los rectángulos.
 *
 * De esto sale qué pedazo de mapa se baja y qué parte del territorio queda
 * cubierta. Un signo cambiado no rompe nada a la vista: deja el pedazo corrido,
 * y eso se descubre en el cerro.
 */

const ZONA: Rectangulo = {
  latNorte: -31.9,
  latSur: -32.1,
  lonOeste: -65.0,
  lonEste: -64.8,
};

function adentro(parcial: Partial<Rectangulo>): Rectangulo {
  return { latNorte: -31.95, latSur: -32.0, lonOeste: -64.95, lonEste: -64.9, ...parcial };
}

describe("un sector adentro de su zona", () => {
  it("uno bien adentro está adentro", () => {
    expect(estaAdentroDe(adentro({}), ZONA)).toBe(true);
  });

  it("uno que calza exacto con el borde también está adentro", () => {
    expect(estaAdentroDe(ZONA, ZONA)).toBe(true);
  });

  it("se sale por cada uno de los cuatro lados", () => {
    expect(estaAdentroDe(adentro({ latNorte: -31.5 }), ZONA)).toBe(false);
    expect(estaAdentroDe(adentro({ latSur: -32.5 }), ZONA)).toBe(false);
    expect(estaAdentroDe(adentro({ lonOeste: -65.5 }), ZONA)).toBe(false);
    expect(estaAdentroDe(adentro({ lonEste: -64.5 }), ZONA)).toBe(false);
  });

  it("uno que envuelve a la zona no está adentro", () => {
    const envolvente = { latNorte: -31.0, latSur: -33.0, lonOeste: -66.0, lonEste: -64.0 };
    expect(estaAdentroDe(envolvente, ZONA)).toBe(false);
    expect(estaAdentroDe(ZONA, envolvente)).toBe(true);
  });

  it("estar adentro es más exigente que tocarse", () => {
    // Dos que se superponen a medias se tocan, pero uno no está adentro del
    // otro. Confundir las dos ideas dejaría pasar sectores que se salen.
    const aMedias = adentro({ lonEste: -64.5 });
    expect(seSuperponen(aMedias, ZONA)).toBe(true);
    expect(estaAdentroDe(aMedias, ZONA)).toBe(false);
  });
});

describe("armar el rectángulo con dos esquinas marcadas", () => {
  it("da igual en qué orden se marquen", () => {
    const unOrden = rectanguloQueAbarca([
      [-64.95, -32.0],
      [-64.9, -31.95],
    ]);
    const elOtro = rectanguloQueAbarca([
      [-64.9, -31.95],
      [-64.95, -32.0],
    ]);

    expect(unOrden).toEqual(elOtro);
    expect(unOrden).toEqual({
      latNorte: -31.95,
      latSur: -32.0,
      lonOeste: -64.95,
      lonEste: -64.9,
    });
  });

  it("lo que sale de marcar dos esquinas siempre es válido", () => {
    const armado = rectanguloQueAbarca([
      [-64.9, -31.95],
      [-64.95, -32.0],
    ]);
    expect(armado).not.toBeNull();
    expect(rectanguloEsValido(armado as Rectangulo)).toBe(true);
  });
});
