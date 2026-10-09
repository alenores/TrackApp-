import type { Position } from "geojson";
import { exito, falla, type Resultado } from "@/lib/datos/resultado";
import { distanciasAcumuladas } from "@/lib/caminos/geometria";

/**
 * Las alturas de una línea: dónde medirlas, cuánto se sube y cuánto se baja,
 * y la altura en cualquier lugar de la línea.
 *
 * **Las líneas de Google Earth no traen altura.** La app la averigua con el
 * relieve del terreno al guardar —en la computadora, con conexión— y guarda
 * una altura cada `cadaM` metros desde el comienzo, más una en el final. Con
 * eso alcanza para el gráfico, para el desnivel y para saber la altura en
 * cualquier punto sin volver a preguntar. Ver decisión 049.
 *
 * **Ninguna de estas alturas se carga ni se corrige a mano.** Son una
 * estimación del relieve, no una medición de GPS.
 *
 * Cuenta pura, sin pantalla ni conexión. Quién averigua la altura de cada
 * punto lo decide quien llama: el servidor usa el relieve
 * (`lib/alturas/relieve.ts`), las pruebas usan uno inventado.
 */

/** Cada cuántos metros se mide. El relieve tiene un punto cada unos 30 m: medir más fino no agrega nada. */
export const CADA_CUANTO_SE_MIDE_M = 25;

/**
 * Lo mínimo que tiene que cambiar la altura para contarse como subida o bajada.
 * Sin esto, las ondulaciones mínimas del relieve se suman como si fueran
 * cuestas y el desnivel sale inflado.
 */
export const UMBRAL_DE_DESNIVEL_M = 3;

export type AlturasDeLinea = {
  cadaM: number;
  /** `valores[i]` es la altura a `i * cadaM` metros del comienzo; el último, en el final. */
  valores: number[];
  /** Lo que se sube yendo desde el comienzo hasta el final. */
  desnivelPositivoM: number;
  /** Lo que se baja en ese mismo sentido. */
  desnivelNegativoM: number;
};

/** Quien sabe la altura del terreno: recibe puntos y devuelve una altura por punto, en el mismo orden. */
export type FuenteDeAlturas = (puntos: Position[]) => Promise<Resultado<number[]>>;

/** Cuántas alturas lleva una línea de este largo: el comienzo, una cada `cadaM` y el final. */
export function cantidadDeAlturas(largoM: number, cadaM: number = CADA_CUANTO_SE_MIDE_M): number {
  return Math.ceil(largoM / cadaM) + 1;
}

/** Los puntos de la línea donde se mide: a 0, `cadaM`, `2 * cadaM`… metros, y el final exacto. */
export function puntosParaMedir(coordenadas: Position[], cadaM: number = CADA_CUANTO_SE_MIDE_M): Position[] {
  const acumuladas = distanciasAcumuladas(coordenadas);
  const largoM = acumuladas[acumuladas.length - 1];
  const cantidad = cantidadDeAlturas(largoM, cadaM);
  const puntos: Position[] = [];
  let segmento = 1;
  for (let i = 0; i < cantidad; i += 1) {
    const distanciaM = i === cantidad - 1 ? largoM : i * cadaM;
    while (segmento < acumuladas.length - 1 && acumuladas[segmento] < distanciaM) segmento += 1;
    const desde = acumuladas[segmento - 1];
    const largoDelSegmento = acumuladas[segmento] - desde;
    const t = largoDelSegmento === 0 ? 0 : Math.min(1, Math.max(0, (distanciaM - desde) / largoDelSegmento));
    const a = coordenadas[segmento - 1];
    const b = coordenadas[segmento];
    puntos.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return puntos;
}

/**
 * Cuánto se sube y cuánto se baja recorriendo las alturas en orden.
 *
 * Se cuenta un cambio recién cuando supera el umbral desde la última altura
 * contada: así una subida larga suma entera y las ondulaciones mínimas no.
 */
export function desnivelesDe(valores: number[], umbralM: number = UMBRAL_DE_DESNIVEL_M): { positivoM: number; negativoM: number } {
  let positivoM = 0;
  let negativoM = 0;
  if (valores.length === 0) return { positivoM, negativoM };
  let referencia = valores[0];
  for (const valor of valores) {
    const diferencia = valor - referencia;
    if (diferencia >= umbralM) {
      positivoM += diferencia;
      referencia = valor;
    } else if (-diferencia >= umbralM) {
      negativoM -= diferencia;
      referencia = valor;
    }
  }
  return { positivoM: Math.round(positivoM), negativoM: Math.round(negativoM) };
}

/** Con un decimal alcanza: el relieve no tiene más precisión que eso, y el dato pesa menos. */
function redondear(altura: number): number {
  return Math.round(altura * 10) / 10;
}

/** Las alturas de una línea, preguntándole a `fuente` por cada punto donde se mide. */
export async function medirAlturas(
  coordenadas: Position[],
  fuente: FuenteDeAlturas,
  cadaM: number = CADA_CUANTO_SE_MIDE_M,
): Promise<Resultado<AlturasDeLinea>> {
  if (coordenadas.length < 2) return falla("La línea necesita al menos dos puntos para medir sus alturas.");
  const puntos = puntosParaMedir(coordenadas, cadaM);
  const respuesta = await fuente(puntos);
  if (!respuesta.ok) return respuesta;
  if (respuesta.datos.length !== puntos.length || !respuesta.datos.every(Number.isFinite)) {
    return falla("El relieve devolvió alturas incompletas para esta línea. Probá guardar de nuevo en un rato.");
  }
  const valores = respuesta.datos.map(redondear);
  const { positivoM, negativoM } = desnivelesDe(valores);
  return exito({ cadaM, valores, desnivelPositivoM: positivoM, desnivelNegativoM: negativoM });
}

/** La altura a tantos metros del comienzo, entre las dos medidas más cercanas. */
export function alturaEnDistancia(alturas: Pick<AlturasDeLinea, "cadaM" | "valores">, distanciaM: number, largoM: number): number {
  const { cadaM, valores } = alturas;
  const ultimo = valores.length - 1;
  if (distanciaM <= 0) return valores[0];
  if (distanciaM >= largoM) return valores[ultimo];
  const indice = Math.min(Math.floor(distanciaM / cadaM), ultimo - 1);
  const desde = indice * cadaM;
  const hasta = indice + 1 === ultimo ? largoM : (indice + 1) * cadaM;
  const t = hasta === desde ? 0 : (distanciaM - desde) / (hasta - desde);
  return valores[indice] + (valores[indice + 1] - valores[indice]) * t;
}

/** Un punto del gráfico: a cuántos metros del comienzo y a qué altura. */
export type PuntoDelPerfil = { distanciaM: number; alturaM: number };

/** El perfil completo de una línea, listo para dibujar. */
export function perfilDeLinea(alturas: Pick<AlturasDeLinea, "cadaM" | "valores">, largoM: number): PuntoDelPerfil[] {
  const ultimo = alturas.valores.length - 1;
  return alturas.valores.map((alturaM, i) => ({ distanciaM: i === ultimo ? largoM : i * alturas.cadaM, alturaM }));
}

/**
 * Las alturas que vienen de la base, revisadas. `null` es «todavía no se
 * calcularon»; `undefined`, que llegaron rotas.
 */
export function leerAlturasDeLaBase(
  alturas: unknown,
  desnivelPositivo: unknown,
  desnivelNegativo: unknown,
  largoM: number,
): AlturasDeLinea | null | undefined {
  if (alturas === null || alturas === undefined) {
    return desnivelPositivo == null && desnivelNegativo == null ? null : undefined;
  }
  if (typeof alturas !== "object" || Array.isArray(alturas)) return undefined;
  const { cada_m: cadaM, valores } = alturas as { cada_m?: unknown; valores?: unknown };
  if (typeof cadaM !== "number" || !(cadaM > 0)) return undefined;
  if (!Array.isArray(valores) || !valores.every((valor) => typeof valor === "number" && Number.isFinite(valor))) return undefined;
  if (valores.length !== cantidadDeAlturas(largoM, cadaM)) return undefined;
  const positivo = Number(desnivelPositivo);
  const negativo = Number(desnivelNegativo);
  if (desnivelPositivo == null || desnivelNegativo == null || !Number.isFinite(positivo) || !Number.isFinite(negativo)) return undefined;
  return { cadaM, valores: valores as number[], desnivelPositivoM: positivo, desnivelNegativoM: negativo };
}

/** Las tres columnas de la base, o las tres vacías. */
export function alturasParaLaBase(alturas: AlturasDeLinea | null): {
  alturas: { cada_m: number; valores: number[] } | null;
  desnivel_positivo_m: number | null;
  desnivel_negativo_m: number | null;
} {
  if (!alturas) return { alturas: null, desnivel_positivo_m: null, desnivel_negativo_m: null };
  return {
    alturas: { cada_m: alturas.cadaM, valores: [...alturas.valores] },
    desnivel_positivo_m: alturas.desnivelPositivoM,
    desnivel_negativo_m: alturas.desnivelNegativoM,
  };
}
