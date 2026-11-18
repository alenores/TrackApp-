/** Cabeceras privadas: el proxy HTTP sigue siendo no-store. */
export const CABECERA_DE_GUARDADO_DE_GOOGLE = "x-guardado-de-google";
export const CABECERA_DE_EDAD_DE_GOOGLE = "x-edad-de-google";
export const CABECERA_DE_FECHA_DE_GOOGLE = "x-fecha-de-google";
export const CABECERA_DE_VENCIMIENTO_DE_GOOGLE = "x-vencimiento-de-google";

type DatosDeVigencia = {
  edad?: string | null;
  fecha?: string | null;
  vencimiento?: string | null;
  solicitadoEn?: number;
};

/** Vencimiento absoluto; ni Age ni el tiempo del pedido renuevan la imagen. */
export function venceSegunGoogle(cabecera: string | null, ahora: number, datos: DatosDeVigencia = {}): number | null {
  const directivas = (cabecera ?? "").toLowerCase().split(",").map((parte) => parte.trim()).filter(Boolean);
  if (directivas.some((parte) => /^(no-store|no-cache)(?:\s*=|$)/.test(parte))) return null;
  const edades = directivas.filter((parte) => /^max-age\s*=/.test(parte));
  if (edades.length > 1) return null;
  const edad = datos.edad?.trim();
  if (edad && !/^\d+$/.test(edad)) return null;
  const edadMs = edad ? Number(edad) * 1000 : 0;
  if (!Number.isSafeInteger(edadMs)) return null;
  const fecha = datos.fecha ? Date.parse(datos.fecha) : null;
  if (fecha !== null && !Number.isFinite(fecha)) return null;
  const demora = Math.max(0, ahora - (datos.solicitadoEn ?? ahora));
  const edadActual = Math.max(fecha === null ? 0 : Math.max(0, ahora - fecha), edadMs + demora);
  let duracion: number;
  if (edades.length === 1) {
    const valor = edades[0].slice(edades[0].indexOf("=") + 1).trim().replace(/^"(\d+)"$/, "$1");
    if (!/^\d+$/.test(valor)) return null;
    duracion = Number(valor) * 1000;
    if (!Number.isSafeInteger(duracion) || duracion <= 0) return null;
  } else {
    if (!datos.vencimiento) return null;
    const vencimiento = Date.parse(datos.vencimiento);
    if (!Number.isFinite(vencimiento)) return null;
    duracion = vencimiento - (fecha ?? ahora);
  }
  const venceEn = ahora + duracion - edadActual;
  return Number.isFinite(venceEn) && venceEn > ahora && venceEn <= 8_640_000_000_000_000 ? venceEn : null;
}
