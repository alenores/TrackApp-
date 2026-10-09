import { describe, expect, it } from "vitest";
import type { Position } from "geojson";
import { exito, falla } from "@/lib/datos/resultado";
import { largoDeLinea } from "@/lib/caminos/geometria";
import {
  alturaEnDistancia,
  alturasParaLaBase,
  cantidadDeAlturas,
  desnivelesDe,
  leerAlturasDeLaBase,
  medirAlturas,
  perfilDeLinea,
  puntosParaMedir,
  type FuenteDeAlturas,
} from "@/lib/alturas/perfil";

// Una línea recta hacia el norte de unos 1000 m (0,009° de latitud ≈ 1000 m).
const RECTA: Position[] = [[-64.5, -31.5], [-64.5, -31.491]];

/** Un relieve inventado: la altura sube con la latitud, 1 m cada 10 m hacia el norte. */
const RAMPA: FuenteDeAlturas = async (puntos) => exito(puntos.map(([, lat]) => 800 + (lat + 31.5) * 111_195 / 10));

describe("dónde se mide", () => {
  it("una altura en el comienzo, una cada 25 m y una en el final exacto", () => {
    const largo = largoDeLinea(RECTA);
    const puntos = puntosParaMedir(RECTA, 25);
    expect(puntos).toHaveLength(cantidadDeAlturas(largo, 25));
    expect(puntos[0]).toEqual(RECTA[0]);
    expect(puntos[puntos.length - 1][1]).toBeCloseTo(RECTA[1][1], 9);
  });

  it("mide sobre la línea aunque tenga quiebres, sin saltearse ninguno", () => {
    const quebrada: Position[] = [[-64.5, -31.5], [-64.5, -31.4955], [-64.4947, -31.4955]];
    const puntos = puntosParaMedir(quebrada, 25);
    expect(puntos).toHaveLength(cantidadDeAlturas(largoDeLinea(quebrada), 25));
    for (const [lon, lat] of puntos) {
      const sobreElPrimero = Math.abs(lon + 64.5) < 1e-9 && lat <= -31.4955 + 1e-9;
      const sobreElSegundo = Math.abs(lat + 31.4955) < 1e-9;
      expect(sobreElPrimero || sobreElSegundo).toBe(true);
    }
  });
});

describe("desnivel", () => {
  it("una subida pareja suma entera", () => {
    const valores = Array.from({ length: 101 }, (_, i) => 1000 + i);
    expect(desnivelesDe(valores, 3)).toEqual({ positivoM: 99, negativoM: 0 });
  });

  it("subir y bajar se cuentan por separado", () => {
    expect(desnivelesDe([700, 800, 900, 850, 600], 3)).toEqual({ positivoM: 200, negativoM: 300 });
  });

  it("ondulaciones menores que el umbral no inflan el desnivel", () => {
    const serrucho = Array.from({ length: 200 }, (_, i) => 1000 + (i % 2 === 0 ? 0 : 2));
    expect(desnivelesDe(serrucho, 3)).toEqual({ positivoM: 0, negativoM: 0 });
  });

  it("al revés, lo positivo pasa a negativo", () => {
    const ida = [700, 820, 760, 980, 650];
    const vuelta = [...ida].reverse();
    expect(desnivelesDe(vuelta, 3)).toEqual({ positivoM: desnivelesDe(ida, 3).negativoM, negativoM: desnivelesDe(ida, 3).positivoM });
  });
});

describe("medir alturas de una línea", () => {
  it("guarda una altura por punto y el desnivel que sale de ellas", async () => {
    const medidas = await medirAlturas(RECTA, RAMPA, 25);
    expect(medidas.ok).toBe(true);
    if (!medidas.ok) return;
    expect(medidas.datos.valores).toHaveLength(cantidadDeAlturas(largoDeLinea(RECTA), 25));
    expect(medidas.datos.valores[0]).toBeCloseTo(800, 1);
    expect(medidas.datos.desnivelPositivoM).toBeGreaterThanOrEqual(97);
    expect(medidas.datos.desnivelPositivoM).toBeLessThanOrEqual(100);
    expect(medidas.datos.desnivelNegativoM).toBe(0);
  });

  it("si el relieve falla, se dice el motivo y no se inventan alturas", async () => {
    const caido: FuenteDeAlturas = async () => falla("No se pudo leer el relieve: el servidor no contestó.");
    const medidas = await medirAlturas(RECTA, caido);
    expect(medidas).toEqual({ ok: false, error: "No se pudo leer el relieve: el servidor no contestó." });
  });

  it("si faltan alturas, no se guarda a medias", async () => {
    const corto: FuenteDeAlturas = async (puntos) => exito(puntos.slice(1).map(() => 900));
    const medidas = await medirAlturas(RECTA, corto);
    expect(medidas.ok).toBe(false);
  });
});

describe("leer y escribir en la base", () => {
  it("ida y vuelta sin perder nada", async () => {
    const medidas = await medirAlturas(RECTA, RAMPA, 25);
    if (!medidas.ok) throw new Error(medidas.error);
    const columnas = alturasParaLaBase(medidas.datos);
    const leidas = leerAlturasDeLaBase(columnas.alturas, columnas.desnivel_positivo_m, columnas.desnivel_negativo_m, largoDeLinea(RECTA));
    expect(leidas).toEqual(medidas.datos);
  });

  it("vacías es «todavía no se calcularon», no un error", () => {
    expect(leerAlturasDeLaBase(null, null, null, 1000)).toBeNull();
  });

  it("si no coinciden con el largo de la línea, están rotas", () => {
    expect(leerAlturasDeLaBase({ cada_m: 25, valores: [1, 2, 3] }, 2, 0, 1000)).toBeUndefined();
    expect(leerAlturasDeLaBase(null, 10, 5, 1000)).toBeUndefined();
  });
});

describe("altura en cualquier lugar y perfil", () => {
  const alturas = { cadaM: 25, valores: [700, 710, 730, 735] }; // largo 60 m: 0, 25, 50, 60

  it("interpola entre las dos medidas más cercanas, también en el último tramo corto", () => {
    expect(alturaEnDistancia(alturas, 12.5, 60)).toBeCloseTo(705);
    expect(alturaEnDistancia(alturas, 55, 60)).toBeCloseTo(732.5);
    expect(alturaEnDistancia(alturas, -5, 60)).toBe(700);
    expect(alturaEnDistancia(alturas, 80, 60)).toBe(735);
  });

  it("el último punto del perfil cae en el largo exacto", () => {
    expect(perfilDeLinea(alturas, 60).map((punto) => punto.distanciaM)).toEqual([0, 25, 50, 60]);
  });
});
