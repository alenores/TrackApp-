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

/**
 * «2 de octubre de 2026», para un día suelto sin hora («2026-10-02»).
 *
 * Se lee al mediodía a propósito: leído a medianoche de Greenwich, en
 * Argentina queda el día anterior.
 */
export function diaEnPalabras(dia: string): string {
  const fecha = new Date(`${dia}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
