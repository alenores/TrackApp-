import sharp from "sharp";
import type { Position } from "geojson";
import type { Resultado } from "@/lib/datos/resultado";
import { archivoDelRelieve } from "@/lib/mapas/archivo-del-relieve";
import { alturasDePuntos, type PedazoDeRelieve } from "@/lib/alturas/relieve";

/**
 * La fuente de alturas de verdad: el archivo del relieve en internet, abierto
 * en el servidor de TrackApp.
 *
 * Cada pedazo es una imagen WebP. Se abre con la misma pieza que ya usa el
 * proyecto para armar íconos, y se guardan los últimos pedazos abiertos: al
 * importar varios Caminos de una misma zona, caen casi siempre en los mismos.
 */

/** Cada pedazo abierto ocupa 1 MB. Con esto alcanza para una zona sin llenar el servidor. */
const PEDAZOS_QUE_SE_RECUERDAN = 24;

const recordados = new Map<string, PedazoDeRelieve | null>();

async function abrirPedazo(z: number, x: number, y: number): Promise<PedazoDeRelieve | null> {
  const clave = `${z}/${x}/${y}`;
  if (recordados.has(clave)) {
    const pedazo = recordados.get(clave)!;
    // El que se vuelve a usar pasa al final: los que se van son los más viejos.
    recordados.delete(clave);
    recordados.set(clave, pedazo);
    return pedazo;
  }

  const traido = await archivoDelRelieve().getZxy(z, x, y);
  let pedazo: PedazoDeRelieve | null = null;
  if (traido) {
    const { data, info } = await sharp(Buffer.from(traido.data)).raw().toBuffer({ resolveWithObject: true });
    pedazo = { ancho: info.width, alto: info.height, canales: info.channels, datos: new Uint8Array(data) };
  }

  recordados.set(clave, pedazo);
  while (recordados.size > PEDAZOS_QUE_SE_RECUERDAN) {
    recordados.delete(recordados.keys().next().value as string);
  }
  return pedazo;
}

/** La altura de cada punto según el relieve. Solo para guardar, nunca para navegar. */
export function alturasDelRelieve(puntos: Position[]): Promise<Resultado<number[]>> {
  return alturasDePuntos(puntos, abrirPedazo);
}
