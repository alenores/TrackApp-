import type { FuenteDeTeselas } from "@/lib/mapas/descarga";
import type { Tesela } from "@/lib/mapas/teselas";

/**
 * De dónde saca el celular los pedazos del mapa: del propio TrackApp.
 *
 * **El celular no va al mapa del mundo, va a TrackApp.** El lugar donde vive ese
 * mapa le entrega pedazos a otro servidor pero no a un navegador, así que
 * TrackApp los busca y se los pasa. Ver `app/api/mapa`. El relieve, de donde
 * salen las curvas de nivel, viene de otro archivo por el mismo tipo de puente:
 * ver `app/api/relieve`. La foto satelital, lo mismo: `app/api/satelital`.
 *
 * Esto solo se usa mientras el usuario está bajando un sector, en casa y con
 * señal. Después el mapa se lee de lo guardado en el teléfono y por acá no pasa
 * nadie.
 */

export const NOMBRE_DE_LA_FUENTE = "TrackApp";

async function motivoDelServidor(respuesta: Response): Promise<string> {
  try {
    const cuerpo = (await respuesta.json()) as { error?: unknown };
    if (typeof cuerpo?.error === "string" && cuerpo.error) return cuerpo.error;
  } catch {
    // El servidor puede contestar algo que no sea un mensaje. Se sigue.
  }
  return `el servidor contestó ${respuesta.status}`;
}

export function fuenteDelServidor(): FuenteDeTeselas {
  return {
    nombre: NOMBRE_DE_LA_FUENTE,
    async pedirTesela({ z, x, y, capa }: Tesela, senal: AbortSignal) {
      const puente = capa ?? "mapa";
      const respuesta = await fetch(`/api/${puente}/${z}/${x}/${y}`, { signal: senal });

      // Sin contenido: ahí no hay nada dibujado. Es normal, no es una falla.
      if (respuesta.status === 204) return null;

      if (!respuesta.ok) {
        throw new Error(await motivoDelServidor(respuesta));
      }

      return new Uint8Array(await respuesta.arrayBuffer());
    },
  };
}
