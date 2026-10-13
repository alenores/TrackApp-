/**
 * Lo que se prende y se apaga en Consultas. Tres opciones y nada más, a
 * propósito: Consultas es para mirar (decisión 052).
 *
 * **Detalles** junta puntos, trazos, tranqueras y alambrados.
 */
export type CapaDeConsultas = "caminos" | "zonas" | "detalles";

export const CAPAS_DE_CONSULTAS: { valor: CapaDeConsultas; etiqueta: string; queMuestra: string }[] = [
  { valor: "caminos", etiqueta: "Caminos", queMuestra: "Por dónde se puede pasar." },
  { valor: "zonas", etiqueta: "Zonas", queMuestra: "El borde y el nombre de cada zona." },
  { valor: "detalles", etiqueta: "Detalles", queMuestra: "Puntos, trazos, tranqueras y alambrados." },
];

export const TODAS_LAS_CAPAS: CapaDeConsultas[] = CAPAS_DE_CONSULTAS.map((capa) => capa.valor);

/** Lo guardado en el celular, si sirve. Lo que no se reconoce se descarta. */
export function leerCapasDeConsultas(guardado: unknown): CapaDeConsultas[] | null {
  if (!Array.isArray(guardado)) return null;
  return TODAS_LAS_CAPAS.filter((capa) => guardado.includes(capa));
}

/** Lo que dice la barrita del celular con el panel bajado. */
export function resumenDeCapas(capas: CapaDeConsultas[]): string {
  const nombres = CAPAS_DE_CONSULTAS.filter((capa) => capas.includes(capa.valor)).map((capa) => capa.etiqueta);
  if (nombres.length === 0) return "No elegiste nada para mirar";
  return nombres.join(" · ");
}
