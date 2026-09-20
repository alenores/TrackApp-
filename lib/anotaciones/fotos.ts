/**
 * La foto de una anotación: dónde va y qué se acepta.
 *
 * **Verificado contra la base el 2026-09-20.** Si la app aceptara una foto que
 * la base va a rechazar, el usuario se entera recién después de esperar la
 * subida, con un error que no entiende.
 *
 * La carpeta arranca con el id del usuario porque la seguridad de la base
 * exige justamente eso: cada uno escribe en la suya y en ninguna otra.
 */

export const DEPOSITO_DE_FOTOS_DE_ANOTACION = "fotos-anotaciones";

/** Verificado: la base corta en 2 MB. */
export const MAXIMO_DE_BYTES = 2 * 1024 * 1024;

/** Verificado: la base solo admite WebP. */
export const FORMATO = "image/webp";

export function rutaDeLaFotoDeAnotacion(
  perfilId: string,
  anotacionId: number,
): string {
  return `${perfilId}/${anotacionId}.webp`;
}

/** Devuelve `null` cuando está bien, o qué pasó y qué hacer cuando no. */
export function revisarLaFotoDeAnotacion(archivo: File): string | null {
  if (archivo.type !== FORMATO) {
    return "La foto tiene que estar en formato WebP. Si la tenés en JPG o PNG, convertila antes de subirla.";
  }

  if (archivo.size > MAXIMO_DE_BYTES) {
    const pesa = (archivo.size / 1024 / 1024).toFixed(1).replace(".", ",");
    return `La foto pesa ${pesa} MB y el máximo son 2 MB. Achicala y volvé a probar.`;
  }

  return null;
}
