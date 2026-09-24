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

/**
 * La foto satelital guardada tiene su propia dirección, con el mismo candado.
 *
 * Va aparte porque el mapa la dibuja como imagen y no como dibujo: son dos
 * fuentes distintas para el motor, aunque vivan en el mismo depósito.
 */
export const PROTOCOLO_DE_LA_FOTO = "foto-guardada";

export const DIRECCION_DE_LA_FOTO_GUARDADA = `${PROTOCOLO_DE_LA_FOTO}://{z}/{x}/{y}`;

const VACIO = new Uint8Array(0);

/**
 * Una copia propia de los bytes, siempre.
 *
 * **Nunca se entrega el mismo bloque de memoria dos veces.** El mapa se queda
 * con lo que se le pasa —deja de estar disponible de este lado— así que el
 * segundo pedido del mismo pedazo encontraría el bloque vacío y fallaría. Con
 * el pedazo vacío, que es uno solo compartido por todos los lugares donde no
 * hay nada dibujado, eso rompía el mapa entero al segundo pedido.
 *
 * Copiar cuesta unos bytes; no copiar cuesta el mapa.
 */
function comoArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer as ArrayBuffer;
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

/**
 * Un pedazo de la foto satelital guardada.
 *
 * Si no está —el sector no se bajó satelital, o ahí no hay foto— devuelve
 * vacío, y el mapa lo dibuja transparente: se ve lo que haya debajo. Tampoco
 * sale a internet.
 */
export async function servirFotoGuardada(direccion: string): Promise<ArrayBuffer> {
  const clave = claveDeLaDireccion(direccion);
  if (!clave) return comoArrayBuffer(VACIO);

  const guardada = await leerTesela(`satelital/${clave}`);
  return comoArrayBuffer(guardada ?? VACIO);
}

let registrado = false;

export function registrarElMapaGuardado(): void {
  if (registrado) return;
  addProtocol(PROTOCOLO, async ({ url }) => ({
    data: await servirTeselaGuardada(url),
  }));
  addProtocol(PROTOCOLO_DE_LA_FOTO, async ({ url }) => ({
    data: await servirFotoGuardada(url),
  }));
  registrado = true;
}

export function olvidarElMapaGuardado(): void {
  if (!registrado) return;
  removeProtocol(PROTOCOLO);
  removeProtocol(PROTOCOLO_DE_LA_FOTO);
  registrado = false;
}
