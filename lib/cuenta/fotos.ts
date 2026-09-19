/**
 * La foto de perfil: dónde va y qué se acepta.
 *
 * **Todo esto está verificado contra la base el 2026-09-19**, y tiene que
 * seguir coincidiendo. Si la app acepta una foto que la base va a rechazar, el
 * usuario se entera después de esperar la subida, con un error que no entiende.
 *
 * Lo que decía antes estaba mal en dos cosas a la vez: mandaba las fotos a
 * `avatars`, que es el depósito de la app vieja, y aceptaba el triple de peso y
 * dos formatos que la base no admite.
 */

/** Verificado: el depósito se llama así. El viejo era `avatars`. */
export const DEPOSITO_DE_FOTOS = "avatares";

/** Verificado: la base corta en 2 MB. */
export const MAXIMO_DE_BYTES_DE_FOTO = 2 * 1024 * 1024;

/** Verificado: la base solo admite WebP. */
export const FORMATO_DE_FOTO = "image/webp";

export function rutaDeLaFoto(perfilId: string): string {
  return `${perfilId}/avatar`;
}

/**
 * Revisa la foto antes de subirla.
 *
 * Devuelve `null` cuando está bien, o **qué pasó y qué hacer** cuando no.
 */
export function revisarLaFoto(archivo: File): string | null {
  if (archivo.type !== FORMATO_DE_FOTO) {
    return "La foto tiene que estar en formato WebP. Si la tenés en JPG o PNG, convertila antes de subirla.";
  }

  if (archivo.size > MAXIMO_DE_BYTES_DE_FOTO) {
    const pesa = (archivo.size / 1024 / 1024).toFixed(1).replace(".", ",");
    return `La foto pesa ${pesa} MB y el máximo son 2 MB. Achicala y volvé a probar.`;
  }

  return null;
}
