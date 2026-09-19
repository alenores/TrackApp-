import type { FeatureCollection } from "geojson";
import { describe, expect, it } from "vitest";
import {
  distanciaALaRutaEnMetros,
  METROS_DE_DESVIO_QUE_AVISAN,
  mensajeDeErrorDelGps,
  voyPorLaRuta,
} from "@/lib/navegacion/desvio";

/**
 * Las pruebas del desvío.
 *
 * **Es la función de la que más depende la seguridad del usuario** y estuvo sin
 * ninguna prueba. Si mide de menos, alguien sigue caminando convencido de que
 * va bien. Si mide de más, la app avisa todo el tiempo y el usuario deja de
 * creerle, que termina siendo lo mismo.
 */

/** Una línea recta de un kilómetro, de oeste a este, a la altura de Córdoba. */
const RUTA_RECTA: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [-64.5, -31.5],
          [-64.4894, -31.5],
        ],
      },
    },
  ],
};

describe("a qué distancia estoy de la ruta", () => {
  it("da cero parado justo sobre la línea", () => {
    const metros = distanciaALaRutaEnMetros(-31.5, -64.495, RUTA_RECTA);
    expect(metros).toBeLessThan(1);
  });

  it("mide bien un desvío conocido", () => {
    // Un centésimo de grado de latitud son unos 1.111 metros.
    const metros = distanciaALaRutaEnMetros(-31.49, -64.495, RUTA_RECTA);
    expect(metros).toBeGreaterThan(1050);
    expect(metros).toBeLessThan(1170);
  });

  it("mide contra el punto más cercano de la línea, no contra las puntas", () => {
    // Justo en el medio, apenas al norte: la punta está a 500 m, la línea a 20.
    const metros = distanciaALaRutaEnMetros(-31.49982, -64.4947, RUTA_RECTA);
    expect(metros).toBeLessThan(40);
  });

  it("se queda con la línea más cercana cuando el recorrido tiene varias", () => {
    const dosLineas: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        ...RUTA_RECTA.features,
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [
              [-64.5, -31.6],
              [-64.4894, -31.6],
            ],
          },
        },
      ],
    };

    // Pegado a la segunda línea: tiene que dar casi cero, no los 11 km a la primera.
    const metros = distanciaALaRutaEnMetros(-31.6, -64.495, dosLineas);
    expect(metros).toBeLessThan(5);
  });

  it("entiende un recorrido que viene como MultiLineString", () => {
    const multiple: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "MultiLineString",
            coordinates: [
              [
                [-64.5, -31.5],
                [-64.4894, -31.5],
              ],
            ],
          },
        },
      ],
    };

    expect(distanciaALaRutaEnMetros(-31.5, -64.495, multiple)).toBeLessThan(1);
  });

  it("entiende un recorrido que viene como GeometryCollection", () => {
    const coleccion: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "GeometryCollection",
            geometries: [
              {
                type: "LineString",
                coordinates: [
                  [-64.5, -31.5],
                  [-64.4894, -31.5],
                ],
              },
            ],
          },
        },
      ],
    };

    expect(distanciaALaRutaEnMetros(-31.5, -64.495, coleccion)).toBeLessThan(1);
  });

  it("ante un recorrido vacío avisa que estás fuera de ruta, no que vas bien", () => {
    const vacio: FeatureCollection = { type: "FeatureCollection", features: [] };

    expect(distanciaALaRutaEnMetros(-31.5, -64.495, vacio)).toBe(Infinity);
    expect(voyPorLaRuta(-31.5, -64.495, vacio)).toBe(false);
  });

  it("ignora una línea de un solo punto, que no es una línea", () => {
    const suelta: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [[-64.5, -31.5]] },
        },
      ],
    };

    expect(distanciaALaRutaEnMetros(-31.5, -64.495, suelta)).toBe(Infinity);
  });
});

describe("cuándo se avisa que me desvié", () => {
  it("no avisa justo en el límite de los 50 metros", () => {
    expect(METROS_DE_DESVIO_QUE_AVISAN).toBe(50);

    // 45 metros al norte de la línea: todavía no.
    expect(voyPorLaRuta(-31.4995951, -64.495, RUTA_RECTA)).toBe(true);
  });

  it("avisa apenas se pasa del límite", () => {
    // 90 metros al norte de la línea.
    expect(voyPorLaRuta(-31.49919, -64.495, RUTA_RECTA)).toBe(false);
  });

  it("respeta un límite distinto si se lo pasan", () => {
    expect(voyPorLaRuta(-31.49919, -64.495, RUTA_RECTA, 200)).toBe(true);
  });
});

describe("los mensajes cuando el GPS no anda", () => {
  const error = (code: number): GeolocationPositionError =>
    ({
      code,
      message: "",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    }) as GeolocationPositionError;

  it("cada mensaje dice qué hacer, no solo qué pasó", () => {
    for (const codigo of [1, 2, 3, 99]) {
      const mensaje = mensajeDeErrorDelGps(error(codigo));

      expect(mensaje.length).toBeGreaterThan(40);
      // Todos tienen que traer una instrucción en voseo.
      expect(mensaje).toMatch(
        /activá|fijate|quedate|probá|entrá|salí|volvé|revisá/i,
      );
    }
  });

  it("ninguno es un «error desconocido» a secas", () => {
    for (const codigo of [1, 2, 3, 99]) {
      const mensaje = mensajeDeErrorDelGps(error(codigo));
      expect(mensaje).not.toMatch(/^Error desconocido\.?$/i);
      expect(mensaje).not.toMatch(/algo salió mal/i);
    }
  });
});
