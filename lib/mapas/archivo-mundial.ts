import { PMTiles } from "pmtiles";

/**
 * El archivo con el mapa del mundo entero.
 *
 * **Vive en internet, pesa 138 gigas y no se baja nunca.** Se le piden pedacitos
 * sueltos, como cuando uno adelanta un video sin esperar a que baje entero.
 *
 * **Esto corre solo en el servidor de TrackApp, nunca en el celular.** El lugar
 * donde está el archivo entrega pedazos a otro servidor pero no a un navegador,
 * así que el celular le pide a TrackApp y TrackApp va a buscarlos. Dura lo que
 * dura la descarga; después el mapa ya está en el teléfono y esto no vuelve a
 * intervenir.
 *
 * **El nombre del archivo cambia todos los días y los viejos se borran a la
 * semana.** Por eso la dirección no se escribe en ningún lado: se busca. Si
 * estuviera escrita, la app dejaría de poder bajar mapas a los pocos días.
 */

const DE_DONDE = "https://build.protomaps.com";

/** Cuántos días para atrás se prueba antes de dar por caído el servicio. */
const DIAS_QUE_SE_PRUEBAN = 10;

/** Cada cuánto se vuelve a buscar la dirección. Un día alcanza: cambia una vez por día. */
const CUANTO_DURA_LA_BUSQUEDA = 6 * 60 * 60 * 1000;

function nombreDelDia(cuandoEnMilisegundos: number): string {
  const fecha = new Date(cuandoEnMilisegundos);
  const anio = fecha.getUTCFullYear();
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getUTCDate()).padStart(2, "0");
  return `${anio}${mes}${dia}`;
}

let encontrada: { direccion: string; buscadaEn: number } | null = null;

/**
 * La dirección del archivo de hoy.
 *
 * Se prueba desde hoy hacia atrás hasta encontrar uno que conteste. Se pide de
 * a 16 bytes: alcanza para saber si está y no gasta nada.
 */
export async function direccionDelArchivoMundial(): Promise<string> {
  if (encontrada && Date.now() - encontrada.buscadaEn < CUANTO_DURA_LA_BUSQUEDA) {
    return encontrada.direccion;
  }

  const hoy = Date.now();
  let ultimoMotivo = "no contestó ninguno";

  for (let atras = 0; atras < DIAS_QUE_SE_PRUEBAN; atras += 1) {
    const direccion = `${DE_DONDE}/${nombreDelDia(hoy - atras * 24 * 60 * 60 * 1000)}.pmtiles`;

    try {
      const respuesta = await fetch(direccion, { headers: { range: "bytes=0-15" } });
      if (respuesta.ok) {
        // El cuerpo se descarta: solo interesaba saber que está.
        await respuesta.arrayBuffer();
        encontrada = { direccion, buscadaEn: Date.now() };
        return direccion;
      }
      ultimoMotivo = `el servidor contestó ${respuesta.status}`;
    } catch (error) {
      ultimoMotivo = error instanceof Error ? error.message : "no se pudo llegar";
    }
  }

  throw new Error(
    `No se encontró el mapa del mundo en ${DE_DONDE}: ${ultimoMotivo}. Probá de nuevo más tarde.`,
  );
}

/**
 * El archivo abierto, guardado entre pedidos.
 *
 * Adentro trae su índice: sin guardarlo, cada pedacito volvería a leer el índice
 * del archivo y la descarga de un sector tardaría muchísimo más.
 */
let abierto: { direccion: string; archivo: PMTiles } | null = null;

export async function archivoMundial(): Promise<PMTiles> {
  const direccion = await direccionDelArchivoMundial();
  if (!abierto || abierto.direccion !== direccion) {
    abierto = { direccion, archivo: new PMTiles(direccion) };
  }
  return abierto.archivo;
}
