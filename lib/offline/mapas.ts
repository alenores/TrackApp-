/**
 * Qué mapas de sector están bajados en este celular.
 *
 * **Hoy no hay ninguno, y eso es correcto:** los archivos de mapa todavía no
 * existen. Ver docs/decisiones/007-de-donde-salen-los-mapas.md
 *
 * Está en un archivo propio para que el día que existan **se toque un solo
 * lugar** y todas las pantallas se enteren solas.
 */

export function sectoresConMapaBajado(): Set<number> {
  return new Set<number>();
}
