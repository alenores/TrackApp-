/**
 * Los colores con los que se puede dibujar un trazo.
 *
 * **El color es lo que le da lenguaje al dibujo**: el agua de un color, las
 * huellas de otro, los límites de otro. Ver docs/decisiones/010.
 *
 * **Se guardan como color fijo, no como variable.** Un trazo es un dato del
 * usuario, no una pieza de la interfaz: el trazo «agua» es celeste en el modo
 * sol y en el modo noche, igual que un lápiz sobre un papel. Por eso son
 * colores vivos, de tono medio, que se recortan tanto sobre el fondo claro como
 * sobre el oscuro, y ninguno se parece al del sendero ni al del arroyo del
 * fondo del mapa: el trazo marca lo que el mapa no muestra.
 */

export type ColorDeTrazo = "agua" | "huella" | "limite" | "peligro";

export const COLORES_DE_TRAZO: ColorDeTrazo[] = ["agua", "huella", "limite", "peligro"];

export const TRAZO: Record<ColorDeTrazo, { nombre: string; color: string }> = {
  agua: { nombre: "Agua", color: "#0ea5e9" },
  huella: { nombre: "Huella", color: "#f97316" },
  limite: { nombre: "Límite", color: "#a855f7" },
  peligro: { nombre: "Peligro", color: "#ef4444" },
};

export const COLOR_DE_TRAZO_POR_DEFECTO: ColorDeTrazo = "huella";

/** El nombre con el que se muestra un color ya guardado; «Trazo» si no es de los nuestros. */
export function nombreDelColor(color: string | null): string {
  const cual = COLORES_DE_TRAZO.find((clave) => TRAZO[clave].color === color);
  return cual ? TRAZO[cual].nombre : "Trazo";
}

export function claveDelColor(color: string | null): ColorDeTrazo {
  return COLORES_DE_TRAZO.find((clave) => TRAZO[clave].color === color) ?? COLOR_DE_TRAZO_POR_DEFECTO;
}
