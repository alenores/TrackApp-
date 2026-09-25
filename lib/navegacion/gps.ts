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
