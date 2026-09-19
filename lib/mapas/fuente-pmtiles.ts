import { PMTiles, TileType } from "pmtiles";
import type { FuenteDeTeselas } from "@/lib/mapas/descarga";
import type { Tesela } from "@/lib/mapas/teselas";

/**
 * De dónde salen los bytes cuando el usuario baja un mapa.
 *
 * El mapa del mundo entero vive en **un solo archivo** en el servidor del
 * proveedor. Pesa más de cien gigas, y no hace falta bajarlo: el navegador sabe
 * pedir *un pedazo* de un archivo remoto, como cuando uno adelanta un video sin
 * esperar a que baje entero. Se piden los pedacitos del rectángulo que eligió
 * el usuario y nada más.
 *
 * **Esto corre en casa, con señal, y nunca durante una navegación.** Una vez que
 * los pedazos están en el celular, el mapa los lee por `protocolo.ts` y esta
 * pieza no vuelve a intervenir.
 *
 * Qué dirección tiene ese archivo se decide en un solo lugar
 * (`components/mapa/capas-base.ts`), no acá.
 */

export type ArchivoDeMapa = {
  fuente: FuenteDeTeselas;
  /**
   * Hasta qué acercamiento tiene detalle el archivo, según lo que el archivo
   * mismo declara. **No se adivina**: pedirle pedazos que no tiene sería bajar
   * agujeros y marcar el sector como listo.
   */
  acercamientoMaximo(): Promise<number>;
  /** Si el archivo trae dibujo vectorial, que es lo que la app sabe pintar. */
  esVectorial(): Promise<boolean>;
};

function motivoDe(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "no se pudo llegar al servidor";
}

export function archivoDeMapa(direccion: string, nombre: string): ArchivoDeMapa {
  // Una sola instancia: guarda en memoria el índice del archivo, así los miles
  // de pedidos de una descarga no vuelven a pedir lo mismo una y otra vez.
  const archivo = new PMTiles(direccion);

  const fuente: FuenteDeTeselas = {
    nombre,
    async pedirTesela({ z, x, y }: Tesela, senal: AbortSignal) {
      try {
        const traido = await archivo.getZxy(z, x, y, senal);
        // Sin respuesta quiere decir que en ese pedazo no hay nada dibujado.
        // Es normal y no es una falla.
        return traido ? new Uint8Array(traido.data) : null;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") throw error;
        throw new Error(
          `No se pudo traer un pedazo del mapa de ${nombre}: ${motivoDe(error)}`,
        );
      }
    },
  };

  return {
    fuente,
    async acercamientoMaximo() {
      try {
        return (await archivo.getHeader()).maxZoom;
      } catch (error) {
        throw new Error(
          `No se pudo leer el mapa de ${nombre}: ${motivoDe(error)}`,
        );
      }
    },
    async esVectorial() {
      try {
        return (await archivo.getHeader()).tileType === TileType.Mvt;
      } catch {
        return false;
      }
    },
  };
}
