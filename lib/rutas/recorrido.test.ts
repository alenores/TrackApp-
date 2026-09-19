import { describe, expect, it } from "vitest";
import type { FeatureCollection } from "geojson";
import {
  calcularDesnivel,
  calcularLargoKm,
  calcularNumerosDelRecorrido,
  rectanguloDelRecorrido,
} from "@/lib/rutas/recorrido";

/**
 * Estos números se muestran como datos duros de la ruta y nadie los puede
 * corregir a mano. Si el cálculo se rompe, la app miente con cara de certeza.
 */

function recorrido(puntos: number[][]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: puntos },
      },
    ],
  };
}

const VACIO: FeatureCollection = { type: "FeatureCollection", features: [] };

describe("calcularLargoKm", () => {
  it("mide una línea recta conocida", () => {
    // Un grado de longitud a 31° de latitud sur son unos 95 km.
    const largo = calcularLargoKm(
      recorrido([
        [-64.8, -31.5],
        [-63.8, -31.5],
      ]),
    );

    expect(largo).toBeGreaterThan(90);
    expect(largo).toBeLessThan(100);
  });

  it("suma los tramos, no mide punta a punta", () => {
    const ida = calcularLargoKm(
      recorrido([
        [-64.8, -31.5],
        [-64.7, -31.5],
      ]),
    );

    const idaYVuelta = calcularLargoKm(
      recorrido([
        [-64.8, -31.5],
        [-64.7, -31.5],
        [-64.8, -31.5],
      ]),
    );

    expect(idaYVuelta).toBeCloseTo(ida * 2, 1);
  });

  it("da cero con un recorrido vacío", () => {
    expect(calcularLargoKm(VACIO)).toBe(0);
  });
});

describe("calcularDesnivel", () => {
  it("cuenta lo que se sube y lo que se baja por separado", () => {
    const desnivel = calcularDesnivel(
      recorrido([
        [-64.8, -31.5, 1000],
        [-64.79, -31.5, 1400],
        [-64.78, -31.5, 1200],
      ]),
    );

    expect(desnivel.positivoM).toBe(400);
    expect(desnivel.negativoM).toBe(200);
  });

  it("no confunde subir 800 y bajar 800 con subir 800 y bajar 200", () => {
    const vaYVuelve = calcularDesnivel(
      recorrido([
        [-64.8, -31.5, 1000],
        [-64.79, -31.5, 1800],
        [-64.78, -31.5, 1000],
      ]),
    );

    const soloSube = calcularDesnivel(
      recorrido([
        [-64.8, -31.5, 1000],
        [-64.79, -31.5, 1800],
        [-64.78, -31.5, 1600],
      ]),
    );

    expect(vaYVuelve.negativoM).toBe(800);
    expect(soloSube.negativoM).toBe(200);
    expect(vaYVuelve.positivoM).toBe(soloSube.positivoM);
  });

  it("ignora el temblequeo del GPS en una caminata llana", () => {
    // Cien puntos oscilando dos metros: ruido del sensor, no desnivel real.
    const puntos = Array.from({ length: 100 }, (_, i) => [
      -64.8 + i * 0.0001,
      -31.5,
      1000 + (i % 2 === 0 ? 2 : -2),
    ]);

    const desnivel = calcularDesnivel(recorrido(puntos));

    expect(desnivel.positivoM).toBe(0);
    expect(desnivel.negativoM).toBe(0);
  });

  it("sí cuenta una subida real hecha de pasos chicos", () => {
    // Cien pasos de seis metros: mil metros de subida de verdad.
    const puntos = Array.from({ length: 100 }, (_, i) => [
      -64.8 + i * 0.0001,
      -31.5,
      1000 + i * 6,
    ]);

    const desnivel = calcularDesnivel(recorrido(puntos));

    expect(desnivel.positivoM).toBeGreaterThan(500);
    expect(desnivel.negativoM).toBe(0);
  });

  it("da cero cuando el archivo no trae alturas", () => {
    const desnivel = calcularDesnivel(
      recorrido([
        [-64.8, -31.5],
        [-64.7, -31.5],
      ]),
    );

    expect(desnivel.positivoM).toBe(0);
    expect(desnivel.negativoM).toBe(0);
  });
});

describe("rectanguloDelRecorrido", () => {
  it("abarca todos los puntos", () => {
    const rectangulo = rectanguloDelRecorrido(
      recorrido([
        [-64.9, -31.6],
        [-64.5, -31.4],
      ]),
    );

    expect(rectangulo).toEqual({
      latNorte: -31.4,
      latSur: -31.6,
      lonEste: -64.5,
      lonOeste: -64.9,
    });
  });

  it("nunca devuelve un rectángulo sin alto ni ancho, que la base rechazaría", () => {
    const rectangulo = rectanguloDelRecorrido(
      recorrido([
        [-64.8, -31.5],
        [-64.8, -31.5],
      ]),
    );

    expect(rectangulo).not.toBeNull();
    expect(rectangulo!.latNorte).toBeGreaterThan(rectangulo!.latSur);
    expect(rectangulo!.lonEste).toBeGreaterThan(rectangulo!.lonOeste);
  });

  it("devuelve nada cuando no hay ninguna línea", () => {
    expect(rectanguloDelRecorrido(VACIO)).toBeNull();
  });
});

describe("calcularNumerosDelRecorrido", () => {
  it("devuelve nada cuando el archivo no tiene un recorrido usable", () => {
    expect(calcularNumerosDelRecorrido(VACIO)).toBeNull();
  });

  it("devuelve los cuatro datos juntos", () => {
    const numeros = calcularNumerosDelRecorrido(
      recorrido([
        [-64.8, -31.5, 1000],
        [-64.7, -31.5, 1300],
      ]),
    );

    expect(numeros).not.toBeNull();
    expect(numeros!.largoKm).toBeGreaterThan(0);
    expect(numeros!.desnivelPositivoM).toBe(300);
    expect(numeros!.desnivelNegativoM).toBe(0);
    expect(numeros!.rectangulo.latNorte).toBeGreaterThan(
      numeros!.rectangulo.latSur,
    );
  });
});

describe("cuántos puntos trae el archivo", () => {
  it("los cuenta sumando todas las líneas del recorrido", () => {
    const numeros = calcularNumerosDelRecorrido({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [
              [-64.9, -31.9, 900],
              [-64.8, -31.8, 950],
              [-64.7, -31.7, 1000],
            ],
          },
        },
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [
              [-64.6, -31.6, 1050],
              [-64.5, -31.5, 1100],
            ],
          },
        },
      ],
    });

    expect(numeros?.puntos).toBe(5);
  });
});
