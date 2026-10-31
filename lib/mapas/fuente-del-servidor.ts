import type { FuenteDeTeselas } from "@/lib/mapas/descarga";
import { CABECERA_DE_MENOS_DETALLE } from "@/lib/mapas/sombra";
import { armarSombraDeLejos, herramientasDelNavegador } from "@/lib/mapas/sombra-de-lejos";
import { claveDeTesela, type Tesela } from "@/lib/mapas/teselas";
import { anotarDetalleDeLaSombra } from "@/lib/offline/sombra-gruesa";

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

/**
 * Cuántos pedazos de sombreado se le piden a Córdoba a la vez, **entre todas
 * las descargas**. Bajar varios sectores juntos multiplicaba los pedidos y
 * Córdoba no llegaba a contestar (Ale, 2026-10-31).
 */
const SOMBRA_A_LA_VEZ = 3;
let sombraPidiendo = 0;
const sombraEsperando: Array<() => void> = [];

async function conTurnoDeSombra<T>(pedir: () => Promise<T>): Promise<T> {
  if (sombraPidiendo >= SOMBRA_A_LA_VEZ) {
    // El que termina le pasa su lugar directo: nadie se cuela en el medio.
    await new Promise<void>((seguir) => sombraEsperando.push(seguir));
  } else {
    sombraPidiendo += 1;
  }
  try {
    return await pedir();
  } finally {
    const siguiente = sombraEsperando.shift();
    if (siguiente) siguiente();
    else sombraPidiendo -= 1;
  }
}

export function fuenteDelServidor(): FuenteDeTeselas {
  return {
    nombre: NOMBRE_DE_LA_FUENTE,
    armarSombraDeLejos: (tesela) => armarSombraDeLejos(tesela, herramientasDelNavegador),
    async pedirTesela({ z, x, y, capa }: Tesela, senal: AbortSignal) {
      const puente = capa ?? "mapa";
      const pedir = () => fetch(`/api/${puente}/${z}/${x}/${y}`, { signal: senal });
      const respuesta = capa === "sombra" ? await conTurnoDeSombra(pedir) : await pedir();

      // Sin contenido: ahí no hay nada dibujado. Es normal, no es una falla.
      if (respuesta.status === 204) return null;

      if (!respuesta.ok) {
        throw new Error(await motivoDelServidor(respuesta));
      }

      const bytes = new Uint8Array(await respuesta.arrayBuffer());

      // El sombreado puede llegar con menos detalle si el servicio de Córdoba
      // no contestó: llega igual, y queda anotado con el motivo para avisar y
      // poder reintentar (decisión 079). Si llega completo, se borra la marca.
      if (capa === "sombra") {
        const motivo = respuesta.headers?.get(CABECERA_DE_MENOS_DETALLE);
        anotarDetalleDeLaSombra(claveDeTesela({ z, x, y, capa }), motivo ? decodeURIComponent(motivo) : null);
      }

      return bytes;
    },
  };
}
