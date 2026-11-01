/**
 * La descripción de un punto, escrita en el mapa debajo de su ícono (Ale,
 * 2026-11-01).
 *
 * Aparece al acercarse y se esconde tocándola, hasta salir de ese mapa. Va
 * **corta**: una descripción entera taparía el mapa; la completa sigue en la
 * ficha del punto.
 */

/** Desde qué acercamiento se escribe la descripción. */
export const DESCRIPCION_DESDE = 15;

/** Cuántas letras entran antes de cortar con «…». */
export const LARGO_DE_LA_DESCRIPCION = 40;

/**
 * La descripción lista para el mapa: en una línea, y si es larga, cortada en
 * la última palabra entera que entra, con «…». Nada si no hay descripción.
 */
export function descripcionCorta(
  comentario: string | null | undefined,
  largo: number = LARGO_DE_LA_DESCRIPCION,
): string | null {
  const limpia = (comentario ?? "").replace(/\s+/g, " ").trim();
  if (!limpia) return null;
  if (limpia.length <= largo) return limpia;
  const cortada = limpia.slice(0, largo);
  const ultimoEspacio = cortada.lastIndexOf(" ");
  const enPalabraEntera = ultimoEspacio > largo / 2 ? cortada.slice(0, ultimoEspacio) : cortada;
  return `${enPalabraEntera.replace(/[\s,.;:]+$/, "")}…`;
}
