import { describe, expect, it } from "vitest";
import {
  distanciaEnKm,
  distanciaEnMetros,
  puntoDeCoordenada,
} from "@/lib/geo";

/**
 * Las pruebas de la fórmula de distancia.
 *
 * Ahora todo el resto de la app la usa: el largo de una ruta y el tramo sin
 * cobertura. Si esta se equivoca, se equivocan los dos a la vez y ninguno
 * avisa.
 */

describe("distancia entre dos puntos", () => {
  it("da cero entre un punto y sí mismo", () => {
    const donde = { lat: -31.5, lon: -64.5 };
    expect(distanciaEnMetros(donde, donde)).toBe(0);
  });

  it("un grado de latitud son unos 111 kilómetros", () => {
    const km = distanciaEnKm({ lat: -31, lon: -64 }, { lat: -32, lon: -64 });

    expect(km).toBeGreaterThan(111);
    expect(km).toBeLessThan(111.4);
  });

  it("un grado de longitud mide menos lejos del ecuador", () => {
    const enElEcuador = distanciaEnKm({ lat: 0, lon: 0 }, { lat: 0, lon: 1 });
    const enCordoba = distanciaEnKm(
      { lat: -31.5, lon: -64 },
      { lat: -31.5, lon: -63 },
    );

    expect(enElEcuador).toBeGreaterThan(111);
    // A 31.5 grados de latitud, un grado de longitud mide el coseno de eso.
    expect(enCordoba).toBeGreaterThan(94);
    expect(enCordoba).toBeLessThan(95.5);
  });

  it("da lo mismo medir de ida que de vuelta", () => {
    const a = { lat: -31.4201, lon: -64.1888 };
    const b = { lat: -34.6037, lon: -58.3816 };

    expect(distanciaEnMetros(a, b)).toBeCloseTo(distanciaEnMetros(b, a), 6);
  });

  it("mide bien una distancia larga conocida: Córdoba a Buenos Aires", () => {
    const km = distanciaEnKm(
      { lat: -31.4201, lon: -64.1888 },
      { lat: -34.6037, lon: -58.3816 },
    );

    expect(km).toBeGreaterThan(640);
    expect(km).toBeLessThan(655);
  });

  it("lee una coordenada de GeoJSON con la longitud primero, que es como vienen", () => {
    // En GeoJSON el par es [longitud, latitud], al revés de como se dicen.
    const punto = puntoDeCoordenada([-64.1888, -31.4201, 400]);

    expect(punto.lon).toBe(-64.1888);
    expect(punto.lat).toBe(-31.4201);
  });

  it("una coordenada de GeoJSON mal leída daría una distancia muy distinta", () => {
    // Esta es la prueba que protege contra el error que casi se cuela al
    // unificar la fórmula: dar vuelta latitud y longitud.
    //
    // Bien leído son 0,1 grados de LONGITUD a 31,5 grados de latitud: 9,5 km.
    // Al revés son 0,1 grados de LATITUD: 11,1 km. Un 17% de diferencia que no
    // falla, no avisa, y deja mal el largo de todas las rutas.
    const bienLeido = distanciaEnKm(
      puntoDeCoordenada([-64.5, -31.5]),
      puntoDeCoordenada([-64.4, -31.5]),
    );
    const alReves = distanciaEnKm(
      { lat: -64.5, lon: -31.5 },
      { lat: -64.4, lon: -31.5 },
    );

    expect(bienLeido).toBeGreaterThan(9.4);
    expect(bienLeido).toBeLessThan(9.6);
    expect(alReves / bienLeido).toBeGreaterThan(1.15);
  });
});
