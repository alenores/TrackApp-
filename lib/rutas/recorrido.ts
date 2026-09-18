import type { FeatureCollection, Position } from "geojson";
import { rectanguloQueAbarca } from "@/lib/datos/rectangulo";
import type { Rectangulo } from "@/types/database";

/**
 * Los números de una ruta se calculan desde el archivo que se sube. Nunca se
 * cargan a mano: tener el mismo dato en dos lugares es tener dos verdades, y el
 * día que no coinciden nadie sabe cuál vale.
 *
 * Acá vive solo el cálculo, sin nada de archivos ni de pantalla, así se puede
 * probar entero.
 */

const RADIO_TIERRA_KM = 6371;

/**
 * Cuántos metros tiene que cambiar la altura para que el cambio se cuente.
 *
 * El GPS mide la altura con mucho ruido: en un rato quieto puede oscilar varios
 * metros. Sumando cada subidita y cada bajadita del archivo crudo, una caminata
 * llana informa cientos de metros de desnivel que nunca existieron.
 *
 * Por eso se arrastra una altura de referencia y solo se cuenta cuando la
 * diferencia supera este umbral. Es lo mismo que hacen los relojes y las apps
 * de deporte.
 */
const UMBRAL_DE_ALTURA_M = 5;

export type NumerosDelRecorrido = {
  largoKm: number;
  desnivelPositivoM: number;
  desnivelNegativoM: number;
  rectangulo: Rectangulo;
};

function aRadianes(grados: number): number {
  return (grados * Math.PI) / 180;
}

function distanciaKm(
  lonA: number,
  latA: number,
  lonB: number,
  latB: number,
): number {
  const dLat = aRadianes(latB - latA);
  const dLon = aRadianes(lonB - lonA);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(latA)) *
      Math.cos(aRadianes(latB)) *
      Math.sin(dLon / 2) ** 2;
  return RADIO_TIERRA_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Saca todas las líneas del recorrido, sea cual sea la forma que traiga. */
export function lineasDelRecorrido(
  geometria: FeatureCollection,
): Position[][] {
  const lineas: Position[][] = [];

  for (const elemento of geometria.features ?? []) {
    const forma = elemento.geometry;
    if (!forma) continue;

    if (forma.type === "LineString") {
      lineas.push(forma.coordinates);
    } else if (forma.type === "MultiLineString") {
      lineas.push(...forma.coordinates);
    } else if (forma.type === "GeometryCollection") {
      for (const parte of forma.geometries) {
        if (parte.type === "LineString") lineas.push(parte.coordinates);
        else if (parte.type === "MultiLineString")
          lineas.push(...parte.coordinates);
      }
    }
  }

  return lineas.filter((linea) => linea.length >= 2);
}

function esCoordenadaValida(punto: Position | undefined): boolean {
  return (
    Array.isArray(punto) &&
    Number.isFinite(punto[0]) &&
    Number.isFinite(punto[1])
  );
}

export function calcularLargoKm(geometria: FeatureCollection): number {
  let total = 0;

  for (const linea of lineasDelRecorrido(geometria)) {
    for (let i = 1; i < linea.length; i += 1) {
      const anterior = linea[i - 1];
      const actual = linea[i];
      if (!esCoordenadaValida(anterior) || !esCoordenadaValida(actual)) continue;

      total += distanciaKm(anterior[0], anterior[1], actual[0], actual[1]);
    }
  }

  return Math.round(total * 100) / 100;
}

/**
 * Lo que se sube y lo que se baja, por separado.
 *
 * Subir 800 y bajar 800 no es lo mismo que subir 800 y bajar 200: en montaña la
 * bajada castiga distinto, así que los dos números importan.
 *
 * Si el archivo no trae alturas, los dos dan cero. Es un dato que simplemente
 * no está, no un error.
 */
export function calcularDesnivel(geometria: FeatureCollection): {
  positivoM: number;
  negativoM: number;
} {
  let positivo = 0;
  let negativo = 0;

  for (const linea of lineasDelRecorrido(geometria)) {
    let referencia: number | null = null;

    for (const punto of linea) {
      const altura = punto[2];
      if (!Number.isFinite(altura)) continue;

      if (referencia === null) {
        referencia = altura as number;
        continue;
      }

      const diferencia = (altura as number) - referencia;

      if (diferencia >= UMBRAL_DE_ALTURA_M) {
        positivo += diferencia;
        referencia = altura as number;
      } else if (diferencia <= -UMBRAL_DE_ALTURA_M) {
        negativo += -diferencia;
        referencia = altura as number;
      }
    }
  }

  return {
    positivoM: Math.round(positivo),
    negativoM: Math.round(negativo),
  };
}

/**
 * Un recorrido que va y vuelve por el mismo punto daría un rectángulo sin
 * ancho, y la base lo rechaza porque exige que el norte sea mayor que el sur.
 * En ese caso se lo agranda lo mínimo: unos diez metros de lado.
 */
const MARGEN_MINIMO_GRADOS = 0.0001;

export function rectanguloDelRecorrido(
  geometria: FeatureCollection,
): Rectangulo | null {
  const coordenadas: Array<[number, number]> = [];

  for (const linea of lineasDelRecorrido(geometria)) {
    for (const punto of linea) {
      if (esCoordenadaValida(punto)) {
        coordenadas.push([punto[0], punto[1]]);
      }
    }
  }

  const rectangulo = rectanguloQueAbarca(coordenadas);
  if (!rectangulo) return null;

  const sinAlto = rectangulo.latNorte - rectangulo.latSur < MARGEN_MINIMO_GRADOS;
  const sinAncho = rectangulo.lonEste - rectangulo.lonOeste < MARGEN_MINIMO_GRADOS;

  if (!sinAlto && !sinAncho) return rectangulo;

  return {
    latNorte: rectangulo.latNorte + (sinAlto ? MARGEN_MINIMO_GRADOS : 0),
    latSur: rectangulo.latSur - (sinAlto ? MARGEN_MINIMO_GRADOS : 0),
    lonEste: rectangulo.lonEste + (sinAncho ? MARGEN_MINIMO_GRADOS : 0),
    lonOeste: rectangulo.lonOeste - (sinAncho ? MARGEN_MINIMO_GRADOS : 0),
  };
}

/**
 * Todos los números de una ruta, de una sola pasada.
 *
 * Devuelve `null` cuando el recorrido no tiene ninguna línea utilizable: eso no
 * es una ruta y no se puede guardar.
 */
export function calcularNumerosDelRecorrido(
  geometria: FeatureCollection,
): NumerosDelRecorrido | null {
  const rectangulo = rectanguloDelRecorrido(geometria);
  if (!rectangulo) return null;

  const desnivel = calcularDesnivel(geometria);

  return {
    largoKm: calcularLargoKm(geometria),
    desnivelPositivoM: desnivel.positivoM,
    desnivelNegativoM: desnivel.negativoM,
    rectangulo,
  };
}
