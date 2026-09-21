/**
 * Pedirle al navegador que no borre lo que la app guardó.
 *
 * **El navegador presta el espacio, no lo regala.** Cuando el teléfono se
 * queda sin lugar, sale a hacer lugar y borra lo guardado de los sitios web,
 * sin preguntar y sin avisar. Y borra **todo lo de un sitio de una vez**: los
 * datos de rutas y zonas, los mapas bajados, las fotos y hasta las pantallas
 * guardadas. Después de eso la app ni siquiera abre sin señal.
 *
 * Es poco probable y es catastrófico: pasa completo y se descubre en el cerro.
 *
 * **Pedirlo no garantiza que lo concedan**: decide el navegador solo, sin
 * preguntarle a nadie. Con la app instalada en la pantalla de inicio,
 * normalmente lo concede.
 *
 * No ocupa más espacio ni cambia nada de lo que la app hace: solo protege lo
 * que ya está guardado.
 */

export type Permanencia =
  /** Ya estaba protegido de antes. */
  | "ya_era"
  /** Se pidió y el navegador lo concedió. */
  | "concedido"
  /** Se pidió y el navegador dijo que no. */
  | "negado"
  /** Este navegador no sabe de esto, o no dejó preguntar. */
  | "no_se_puede";

export async function pedirQueNoLoBorren(): Promise<Permanencia> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) {
    return "no_se_puede";
  }

  try {
    if (await navigator.storage.persisted?.()) return "ya_era";
    return (await navigator.storage.persist()) ? "concedido" : "negado";
  } catch {
    return "no_se_puede";
  }
}
