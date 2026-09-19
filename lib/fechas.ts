/**
 * Las fechas, escritas como las lee una persona.
 *
 * Están acá y no en cada pantalla para que digan lo mismo en toda la app: una
 * fecha con otro formato en otra pantalla se lee como si fuera otro dato.
 */

/** 19/09/2026. Para listas, donde manda el espacio. */
export function fechaCorta(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

/** 19 de septiembre. Para cuando hay lugar y se lee mejor. */
export function fechaEnPalabras(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
    });
  } catch {
    return "—";
  }
}
