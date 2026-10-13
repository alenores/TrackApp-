import type { RespuestaDeOsm } from "@/lib/anotaciones/importar";
import type { Rectangulo } from "@/types/database";

/**
 * Preguntarle a OpenStreetMap por las tranqueras y los alambrados de un
 * rectángulo.
 *
 * **Existe porque el mapa de fondo no los trae**: Protomaps los descarta al
 * armar el archivo del mundo, y en el Champaquí hay veinte tranqueras que
 * marcan por dónde se pasa. Se le pregunta directamente a OpenStreetMap, por
 * Overpass.
 *
 * **Solo desde el servidor y con señal**, al crear o agrandar una zona. Nunca
 * durante una navegación: lo traído viaja con el paquete.
 *
 * Overpass es un servicio comunitario: se lo identifica y se le pide poco.
 */

const OVERPASS = "https://overpass-api.de/api/interpreter";

/** Quién pregunta, como pide la política de uso de Overpass. */
const QUIEN = "TrackApp (https://track-app-hazel.vercel.app)";

/** Más que esto ya no es una zona de sierra: Overpass tardaría o se negaría. */
export const LADO_MAXIMO_EN_GRADOS = 1.5;

/** Cuánto se espera a Overpass, que a veces tarda. */
const SEGUNDOS_DE_ESPERA = 90;

export type RespuestaDeOverpass = { ok: true; respuesta: RespuestaDeOsm } | { ok: false; motivo: string };

export async function preguntarBarreras(rectangulo: Rectangulo): Promise<RespuestaDeOverpass> {
  const { latNorte: norte, latSur: sur, lonEste: este, lonOeste: oeste } = rectangulo;
  if (norte - sur > LADO_MAXIMO_EN_GRADOS || este - oeste > LADO_MAXIMO_EN_GRADOS) {
    return { ok: false, motivo: "la zona es demasiado grande para pedírsela de una vez" };
  }

  const caja = `${sur},${oeste},${norte},${este}`;
  const consulta = `[out:json][timeout:${SEGUNDOS_DE_ESPERA}];
(
  node["barrier"="gate"](${caja});
  way["barrier"="fence"](${caja});
);
out geom;`;

  try {
    const respuesta = await fetch(OVERPASS, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": QUIEN },
      body: `data=${encodeURIComponent(consulta)}`,
      signal: AbortSignal.timeout((SEGUNDOS_DE_ESPERA + 5) * 1000),
    });
    if (respuesta.status === 429 || respuesta.status === 504) {
      return { ok: false, motivo: "OpenStreetMap está ocupado en este momento" };
    }
    if (!respuesta.ok) return { ok: false, motivo: `OpenStreetMap contestó ${respuesta.status}` };
    const cuerpo = (await respuesta.json()) as { elements?: RespuestaDeOsm["elements"] };
    return { ok: true, respuesta: { elements: cuerpo.elements ?? [] } };
  } catch (error) {
    const motivo = error instanceof Error && error.name === "TimeoutError"
      ? "OpenStreetMap tardó demasiado en contestar"
      : `no se pudo preguntar a OpenStreetMap (${error instanceof Error && error.message ? error.message : "no contestó"})`;
    return { ok: false, motivo };
  }
}
