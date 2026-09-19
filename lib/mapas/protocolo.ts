import { addProtocol, removeProtocol } from "maplibre-gl";
import { leerTesela } from "@/lib/mapas/deposito";

/**
 * Cómo el mapa lee los pedazos que están en el celular.
 *
 * El motor del mapa sabe pedir direcciones de internet. Acá se le enseña una
 * dirección que **no es de internet**: `guardado://12/1234/5678` no sale del
 * teléfono, va derecho al depósito.
 *
 * **Este es el candado de la regla más importante de la app.** Navegar una ruta
 * no consulta internet nunca, por ningún motivo. Mientras el mapa lea por acá,
 * eso no depende de que nadie se acuerde de cumplirlo: no hay a dónde salir.
 *
 * Un pedazo que no está guardado devuelve vacío, no un error. El mapa dibuja lo
 * que tiene y sigue andando; avisar de lo que falta es tarea de las pantallas,
 * que ya lo hicieron en casa y con señal.
 */

export const PROTOCOLO = "guardado";

/** La dirección que va en el estilo del mapa. */
export const DIRECCION_DE_LAS_TESELAS = `${PROTOCOLO}://{z}/{x}/{y}`;

const VACIO = new Uint8Array(0);

function comoArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  // Cuando la vista tapa exactamente todo su buffer se pasa el buffer tal cual;
  // si no, se copia. Pasar un buffer más grande de la cuenta le daría al mapa
  // bytes de otro pedazo.
  if (bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength) {
    return bytes.buffer as ArrayBuffer;
  }
  return bytes.slice().buffer;
}

/**
 * El nombre de grilla que hay adentro de una dirección `guardado://`.
 *
 * Devuelve nada si la dirección no tiene la forma esperada, y ahí el mapa
 * recibe un pedazo vacío en vez de romperse.
 */
export function claveDeLaDireccion(direccion: string): string | null {
  const separador = direccion.indexOf("://");
  if (separador === -1) return null;

  const clave = direccion.slice(separador + 3);
  return /^\d+\/\d+\/\d+$/.test(clave) ? clave : null;
}

export async function servirTeselaGuardada(direccion: string): Promise<ArrayBuffer> {
  const clave = claveDeLaDireccion(direccion);
  if (!clave) return comoArrayBuffer(VACIO);

  const guardada = await leerTesela(clave);
  return comoArrayBuffer(guardada ?? VACIO);
}

let registrado = false;

export function registrarElMapaGuardado(): void {
  if (registrado) return;
  addProtocol(PROTOCOLO, async ({ url }) => ({
    data: await servirTeselaGuardada(url),
  }));
  registrado = true;
}

export function olvidarElMapaGuardado(): void {
  if (!registrado) return;
  removeProtocol(PROTOCOLO);
  registrado = false;
}
