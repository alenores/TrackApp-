import { rectanguloDe } from "@/lib/marcas/lista";
import type { Rectangulo } from "@/types/database";

/**
 * Pueblos, ciudades y localidades del mapa de fondo.
 *
 * No están en la app: hay que preguntarle al mapa de dónde salen esos nombres.
 * Se pregunta una sola vez, cuando se aprieta el botón, y solo en Argentina.
 */

export type LugarDeInternet = {
  nombre: string;
  aclaracion: string;
  encuadre: Rectangulo;
};

const COMO_SE_DICE: Record<string, string> = {
  city: "Ciudad",
  town: "Pueblo",
  village: "Localidad",
  hamlet: "Paraje",
  municipality: "Municipio",
  suburb: "Barrio",
  locality: "Localidad",
  isolated_dwelling: "Paraje",
};

/** La dirección para preguntar. Argentina, y solo pueblos y ciudades. */
export function direccionDeLosLugares(texto: string): string {
  const parametros = new URLSearchParams({
    q: texto,
    format: "jsonv2",
    limit: "8",
    countrycodes: "ar",
    featureType: "settlement",
    "accept-language": "es",
  });
  return `https://nominatim.openstreetmap.org/search?${parametros}`;
}

type Fila = {
  name?: unknown;
  display_name?: unknown;
  type?: unknown;
  lat?: unknown;
  lon?: unknown;
  boundingbox?: unknown;
  address?: { state?: unknown };
};

function numero(valor: unknown): number | null {
  const n = typeof valor === "number" ? valor : typeof valor === "string" ? Number(valor) : Number.NaN;
  return Number.isFinite(n) ? n : null;
}

function encuadreDe(fila: Fila): Rectangulo | null {
  if (Array.isArray(fila.boundingbox) && fila.boundingbox.length === 4) {
    const latSur = numero(fila.boundingbox[0]);
    const latNorte = numero(fila.boundingbox[1]);
    const lonOeste = numero(fila.boundingbox[2]);
    const lonEste = numero(fila.boundingbox[3]);
    if (
      latSur !== null && latNorte !== null && lonOeste !== null && lonEste !== null
      && latNorte > latSur && lonEste > lonOeste
    ) {
      return { latNorte, latSur, lonOeste, lonEste };
    }
  }
  const lat = numero(fila.lat);
  const lon = numero(fila.lon);
  if (lat === null || lon === null) return null;
  return rectanguloDe([[lon, lat]]);
}

function nombreDe(fila: Fila): string | null {
  if (typeof fila.name === "string" && fila.name.trim()) return fila.name.trim();
  if (typeof fila.display_name === "string" && fila.display_name.trim()) {
    return fila.display_name.split(",")[0]?.trim() || null;
  }
  return null;
}

function esRectangulo(valor: unknown): valor is Rectangulo {
  if (!valor || typeof valor !== "object") return false;
  const rectangulo = valor as Rectangulo;
  return [rectangulo.latNorte, rectangulo.latSur, rectangulo.lonOeste, rectangulo.lonEste]
    .every((cada) => typeof cada === "number" && Number.isFinite(cada))
    && rectangulo.latNorte > rectangulo.latSur
    && rectangulo.lonEste > rectangulo.lonOeste;
}

/** La respuesta ya traducida, tal como la manda la app. Lo raro se saltea. */
export function sonLugaresDeInternet(datos: unknown): LugarDeInternet[] {
  if (!Array.isArray(datos)) return [];
  const lugares: LugarDeInternet[] = [];
  for (const fila of datos) {
    if (!fila || typeof fila !== "object") continue;
    const { nombre, aclaracion, encuadre } = fila as Partial<LugarDeInternet>;
    if (typeof nombre !== "string" || !nombre.trim()) continue;
    if (typeof aclaracion !== "string" || !aclaracion.trim()) continue;
    if (!esRectangulo(encuadre)) continue;
    lugares.push({ nombre: nombre.trim(), aclaracion: aclaracion.trim(), encuadre });
  }
  return lugares;
}

/** Lo que contestó el mapa, ya en palabras de la app. Lo que no se entiende se saltea. */
export function leerLugaresDeInternet(datos: unknown): LugarDeInternet[] {
  if (!Array.isArray(datos)) return [];
  const lugares: LugarDeInternet[] = [];
  for (const fila of datos) {
    if (!fila || typeof fila !== "object") continue;
    const nombre = nombreDe(fila as Fila);
    const encuadre = encuadreDe(fila as Fila);
    if (!nombre || !encuadre) continue;
    const tipo = typeof (fila as Fila).type === "string" ? COMO_SE_DICE[(fila as Fila).type as string] ?? "Lugar" : "Lugar";
    const direccion = (fila as Fila).address;
    const provincia = typeof direccion?.state === "string" && direccion.state.trim()
      ? direccion.state.trim()
      : null;
    lugares.push({
      nombre,
      aclaracion: provincia ? `${tipo} · ${provincia}` : tipo,
      encuadre,
    });
  }
  return lugares;
}
