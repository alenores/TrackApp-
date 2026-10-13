import type { LineString, Point } from "geojson";
import { candidatasDeOsm, firma, type AnotacionParaImportar, type RespuestaDeOsm } from "@/lib/anotaciones/importar";

/**
 * **Tranqueras y alambrados de una zona**, traídos solos de OpenStreetMap al
 * crear la zona (decisión 052). Nadie los pide ni los elige. Hoy una zona no
 * se puede agrandar después de creada; el día que se pueda, se vuelven a
 * pedir al agrandarla y lo que ya estaba no se repite.
 *
 * - Entra **entero** todo lo que toca la zona: un alambrado que cruza el borde
 *   no se corta. OpenStreetMap ya contesta solo lo que toca el rectángulo.
 * - **Nunca se repite** lo que ya estaba, aunque se vuelva a pedir: así se
 *   puede reintentar sin miedo y agrandar una zona no duplica nada.
 * - Quedan fijos: no se corrigen, no se borran y no se vuelven a buscar solos.
 *   Si la zona se achica o se borra, se quedan.
 */

export type BarrerasNuevas = {
  nuevas: AnotacionParaImportar[];
  /** Ya estaban guardadas, o venían repetidas en la respuesta. */
  repetidas: number;
  /** Lo que contestó OpenStreetMap que no es ni tranquera ni alambrado. */
  ignoradas: number;
};

export function barrerasNuevas(respuesta: RespuestaDeOsm, yaEstan: Array<Point | LineString>): BarrerasNuevas {
  const conocidas = new Set(yaEstan.map(firma));
  const resultado: BarrerasNuevas = { nuevas: [], repetidas: 0, ignoradas: 0 };
  for (const candidata of candidatasDeOsm(respuesta)) {
    if (!candidata) {
      resultado.ignoradas += 1;
      continue;
    }
    const suFirma = firma(candidata.geometria);
    if (conocidas.has(suFirma)) {
      resultado.repetidas += 1;
      continue;
    }
    conocidas.add(suFirma);
    resultado.nuevas.push(candidata);
  }
  return resultado;
}

/** Lo que se cuenta al terminar, en palabras. */
export function resumenDeBarreras({ nuevas }: BarrerasNuevas): string {
  const tranqueras = nuevas.filter((cada) => cada.tipo === "punto").length;
  const alambrados = nuevas.length - tranqueras;
  if (nuevas.length === 0) return "OpenStreetMap no tiene tranqueras ni alambrados nuevos para esta zona.";
  const partes = [
    tranqueras ? `${tranqueras} ${tranqueras === 1 ? "tranquera" : "tranqueras"}` : null,
    alambrados ? `${alambrados} ${alambrados === 1 ? "alambrado" : "alambrados"}` : null,
  ].filter(Boolean);
  return `Se sumaron ${partes.join(" y ")} de OpenStreetMap.`;
}
