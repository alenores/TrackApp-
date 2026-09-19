import { describe, expect, it } from "vitest";
import { leerCoordenada, mostrarCoordenada } from "@/lib/coordenadas";

/**
 * Las pruebas del lector de coordenadas.
 *
 * Esta es de las que no se pueden entregar sin prueba: una coordenada mal
 * leída no falla, no avisa y no se ve. Simplemente descarga el pedazo de mapa
 * equivocado, y el usuario se entera en el cerro.
 */

const DMS = "31°58'41.5\"S 64°56'04.2\"W";
const DMS_CON_COMA = "31°58'41.5\"S, 64°56'04.2\"O";

const LINK_CON_PUNTO_MARCADO =
  "https://www.google.com/maps/place/Refugio+Tabaquillo/@-31.9612,-64.9488,15z/data=!4m6!3m5!1s0x0:0x0!8m2!3d-31.9542!4d-64.9402";
const LINK_SOLO_CON_CENTRO = "https://www.google.com/maps/@-31.9612,-64.9488,15z";

describe("leer una coordenada de lo que pegue el usuario", () => {
  it("de un link de Maps agarra el punto marcado, no el centro de la pantalla", () => {
    const leida = leerCoordenada(LINK_CON_PUNTO_MARCADO);

    expect(leida.clase).toBe("leida");
    if (leida.clase !== "leida") return;

    // Los del centro de la pantalla son -31.9612, -64.9488. No son estos.
    expect(leida.lat).toBeCloseTo(-31.9542, 4);
    expect(leida.lon).toBeCloseTo(-64.9402, 4);
    expect(leida.aviso).toBeNull();
  });

  it("avisa cuando el link solo trae el centro de la pantalla", () => {
    const leida = leerCoordenada(LINK_SOLO_CON_CENTRO);

    expect(leida.clase).toBe("leida");
    if (leida.clase !== "leida") return;

    expect(leida.lat).toBeCloseTo(-31.9612, 4);
    expect(leida.lon).toBeCloseTo(-64.9488, 4);
    expect(leida.aviso).not.toBeNull();
    expect(leida.aviso).toContain("no el punto que marcaste");
  });

  it("lee dos números separados por coma", () => {
    const leida = leerCoordenada("-31.9782, -64.9345");

    expect(leida.clase).toBe("leida");
    if (leida.clase !== "leida") return;
    expect(leida.lat).toBeCloseTo(-31.9782, 4);
    expect(leida.lon).toBeCloseTo(-64.9345, 4);
    expect(leida.aviso).toBeNull();
  });

  it("lee grados, minutos y segundos", () => {
    const leida = leerCoordenada(DMS);

    expect(leida.clase).toBe("leida");
    if (leida.clase !== "leida") return;
    expect(leida.lat).toBeCloseTo(-31.9782, 3);
    expect(leida.lon).toBeCloseTo(-64.9345, 3);
  });

  it("lee grados con O de oeste, no solo con W", () => {
    const leida = leerCoordenada(DMS_CON_COMA);

    expect(leida.clase).toBe("leida");
    if (leida.clase !== "leida") return;
    expect(leida.lon).toBeLessThan(0);
  });

  it("lee un link de place con los números adentro", () => {
    const leida = leerCoordenada("https://www.google.com/maps/place/-31.9542,-64.9402");

    expect(leida.clase).toBe("leida");
    if (leida.clase !== "leida") return;
    expect(leida.lat).toBeCloseTo(-31.9542, 4);
  });

  it("no toma números sueltos de adentro de un link", () => {
    // El 15 del zoom y el 4m6 de los datos no son una coordenada.
    const leida = leerCoordenada(LINK_CON_PUNTO_MARCADO);

    expect(leida.clase).toBe("leida");
    if (leida.clase !== "leida") return;
    expect(leida.lat).toBeCloseTo(-31.9542, 4);
  });

  it("rechaza coordenadas positivas, porque acá los dos números son negativos", () => {
    const leida = leerCoordenada("31.9782, 64.9345");

    expect(leida.clase).toBe("error");
    if (leida.clase !== "error") return;
    expect(leida.titulo).toContain("Argentina");
    expect(leida.detalle).toContain("negativos");
  });

  it("rechaza una latitud fuera de rango", () => {
    const leida = leerCoordenada("-931.97, -64.93");

    expect(leida.clase).toBe("error");
  });

  it("dice que no encontró nada cuando el texto no tiene coordenadas", () => {
    const leida = leerCoordenada("el refugio de tabaquillo");

    expect(leida.clase).toBe("error");
    if (leida.clase !== "error") return;
    expect(leida.detalle).toContain("Google Maps");
  });

  it("distingue el campo vacío de un error, para no retar al que todavía no escribió", () => {
    expect(leerCoordenada("").clase).toBe("vacio");
    expect(leerCoordenada("   ").clase).toBe("vacio");
  });

  it("no explota con nada raro", () => {
    for (const raro of ["...", "-", ",", "-,-", "http://", "@", "!3d!4d"]) {
      expect(() => leerCoordenada(raro)).not.toThrow();
    }
  });
});

describe("cómo se muestra una coordenada", () => {
  it("siempre con cinco decimales, para poder comparar dos de un vistazo", () => {
    expect(mostrarCoordenada(-31.9, -64.5)).toBe("-31.90000, -64.50000");
    expect(mostrarCoordenada(-31.978244, -64.934512)).toBe("-31.97824, -64.93451");
  });
});
