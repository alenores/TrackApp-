/**
 * Cómo se nombra un punto: título propio, o el comentario viejo si todavía
 * no tiene título (los que se marcaron antes de este campo).
 *
 * El mapa escribe solo esto debajo del ícono. La descripción completa
 * (`comentario`) queda para la ficha.
 */

export function tituloDelPunto(datos: {
  titulo?: string | null;
  comentario?: string | null;
}): string | null {
  const propio = (datos.titulo ?? "").replace(/\s+/g, " ").trim();
  if (propio) return propio;
  const legado = (datos.comentario ?? "").replace(/\s+/g, " ").trim();
  return legado || null;
}
