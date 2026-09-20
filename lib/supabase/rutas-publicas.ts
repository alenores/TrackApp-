/**
 * Qué direcciones **no** pasan por el control de sesión.
 *
 * Vive aparte del control de sesión porque es una lista de reglas que se puede
 * probar sola, y porque equivocarse acá no da error: da algo peor.
 *
 * **Lo que no está en esta lista y no es una pantalla, se rompe en silencio.**
 * El control de sesión contesta con la página de entrar, así que quien pedía un
 * archivo recibe una página web. El motor del mapa recibiendo una página web no
 * dibuja nada; el motor offline recibiendo una página web se cae al arrancar y
 * la app deja de guardar **todo**, anda con señal como si nada y sin señal no
 * hay nada. Las dos cosas pasaron en producción, el 2026-09-19 y el 2026-09-20.
 *
 * Regla: **si no es una pantalla, va acá.**
 */

/** Los archivos que hacen andar a la app sin señal. */
const DEL_MOTOR_OFFLINE = ["/sw.js", "/workbox-", "/fallback-"];

/** Los archivos del mapa: su motor, sus íconos y sus letras. */
const DEL_MAPA = ["/motor-del-mapa/", "/iconos-del-mapa/", "/fuentes-del-mapa/"];

export function esRutaPublica(pathname: string): boolean {
  if (pathname === "/sw.js" || pathname === "/manifest.webmanifest") return true;
  if (pathname.endsWith(".png") || pathname.endsWith(".ico")) return true;

  const comienzos = [
    "/offline",
    "/_next",
    "/api",
    ...DEL_MOTOR_OFFLINE,
    ...DEL_MAPA,
  ];

  return comienzos.some((comienzo) => pathname.startsWith(comienzo));
}

/** La pantalla de entrar, que se muestra justamente cuando no hay sesión. */
export function esRutaDeEntrar(pathname: string): boolean {
  return pathname.startsWith("/login");
}

/**
 * Las pantallas que se dejan abrir sin sesión **si el celular ya tiene datos
 * guardados**. Sin señal no hay con qué revisar la sesión, y dejar al usuario
 * afuera de sus propias rutas en el cerro sería lo peor que puede pasar.
 */
export function esRutaQueAndaSinSenal(pathname: string): boolean {
  return pathname === "/" || /^\/rutas\/[^/]+$/.test(pathname);
}
