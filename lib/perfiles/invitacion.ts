/**
 * La invitación a TrackApp: el texto y los links para pasarle la app a un amigo.
 *
 * Lógica pura, sin pantalla. El link es siempre la dirección desde donde se
 * está usando la app, así apunta al mismo lugar donde ya la abrió el usuario.
 */

export function textoDeInvitacion(link: string): string {
  return [
    "Te paso TrackApp, la app que uso para seguir rutas al aire libre.",
    "Funciona sin señal: bajás el mapa en tu casa y en el cerro te guía igual.",
    "",
    `Abrila acá: ${link}`,
  ].join("\n");
}

export function linkDeWhatsApp(link: string): string {
  return `https://wa.me/?text=${encodeURIComponent(textoDeInvitacion(link))}`;
}
