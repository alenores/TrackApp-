/**
 * El estado del GPS del celular y qué decir cuando no anda.
 *
 * El GPS funciona por satélite: no necesita señal ni internet. En los mapas
 * del cerro se prende solo al entrar, así que los mensajes no mandan a tocar
 * ningún botón para prenderlo.
 */

export type EstadoDelGps =
  | "apagado"
  | "pidiendo"
  | "andando"
  | "sin_permiso"
  | "no_disponible";

/** Cómo se pinta la mira: azul si anda, amarilla si la posición envejeció, roja si falló. */
export type TonoDeLaMira = "bien" | "viejo" | "fallo";

export function tonoDeLaMira(estado: EstadoDelGps, posicionVieja: boolean): TonoDeLaMira {
  if (estado === "sin_permiso" || estado === "no_disponible") return "fallo";
  if (estado === "andando" && posicionVieja) return "viejo";
  return "bien";
}

export function etiquetaDeLaMira(tono: TonoDeLaMira): string {
  if (tono === "fallo") return "El GPS no anda";
  if (tono === "viejo") return "El GPS se perdió";
  return "Centrar en mi ubicación";
}

/**
 * El cartel sale solo si la app no tiene permiso o el GPS no está dando
 * posición. Si tarda o deja de responder, la mira queda roja y el cartel
 * espera a que la toquen.
 */
export function elCartelDelGpsSaleSolo(error: GeolocationPositionError): boolean {
  return error.code === error.PERMISSION_DENIED || error.code === error.POSITION_UNAVAILABLE;
}

export type AvisoDeFallaDelGps = {
  mensaje: string | null;
  abierto: boolean;
};

/**
 * Una falla que se repite no vuelve a abrir el cartel que el usuario cerró.
 * Una falla distinta sí, si es de las que salen solas.
 */
export function alLlegarUnaFalla(
  vigente: AvisoDeFallaDelGps,
  llegada: { mensaje: string; saleSolo: boolean },
): AvisoDeFallaDelGps {
  if (vigente.mensaje === llegada.mensaje) {
    return { mensaje: llegada.mensaje, abierto: vigente.abierto };
  }
  return { mensaje: llegada.mensaje, abierto: llegada.saleSolo };
}

/**
 * Qué decirle al usuario cuando el GPS no anda.
 *
 * Cada mensaje dice **qué pasó y qué hacer**. Prohibido «error desconocido»:
 * en el cerro, un mensaje que no informa nada es lo mismo que ningún mensaje.
 */
export function mensajeDeErrorDelGps(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "La app no tiene permiso para usar el GPS. Entrá a los ajustes del navegador, buscá los permisos de esta página y activá la ubicación. Después salí y volvé a entrar a esta pantalla.";
    case error.POSITION_UNAVAILABLE:
      return "El GPS no está dando posición. Fijate que la ubicación del celular esté prendida y salí a cielo abierto: bajo techo o entre paredes de roca puede tardar.";
    case error.TIMEOUT:
      return "El GPS tardó demasiado en dar la primera posición. Quedate quieto a cielo abierto unos segundos: sigue buscando solo.";
    default:
      return "El GPS dejó de responder y no dijo por qué. Probá apagar y prender la ubicación del celular.";
  }
}
