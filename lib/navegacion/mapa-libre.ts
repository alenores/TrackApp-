import { seSuperponen } from "@/lib/datos/rectangulo";
import type { Rectangulo, RutaResumen, Sector, Zona } from "@/types/database";

/**
 * Las cuentas del mapa libre: ver todo lo bajado sin seguir una ruta.
 *
 * Todo sale de lo guardado en el celular. Nada de esto consulta internet.
 */

export type Posicion = { lat: number; lon: number };

function contiene(rectangulo: Rectangulo, { lat, lon }: Posicion): boolean {
  return (
    lat <= rectangulo.latNorte &&
    lat >= rectangulo.latSur &&
    lon <= rectangulo.lonEste &&
    lon >= rectangulo.lonOeste
  );
}

/** La zona donde estás parado, o `null` si no estás adentro de ninguna. */
export function zonaDondeEstas(zonas: Zona[], posicion: Posicion | null): Zona | null {
  if (!posicion) return null;
  return zonas.find((zona) => contiene(zona.rectangulo, posicion)) ?? null;
}

export type RutasParaElegir = {
  /** La zona donde estás, si el GPS ya respondió y estás adentro de una. */
  zona: Zona | null;
  /** Las rutas de tu zona: se proponen primero. */
  deTuZona: RutaResumen[];
  /** Todas las demás, por nombre. */
  otras: RutaResumen[];
};

const porNombre = (a: RutaResumen, b: RutaResumen) =>
  a.nombre.localeCompare(b.nombre, "es");

/**
 * Las rutas para elegir, con las de tu zona primero.
 *
 * Sin GPS, o fuera de toda zona, no hay «tu zona» y van todas juntas.
 */
export function rutasParaElegir(
  rutas: RutaResumen[],
  zonas: Zona[],
  posicion: Posicion | null,
): RutasParaElegir {
  const zona = zonaDondeEstas(zonas, posicion);
  if (!zona) return { zona: null, deTuZona: [], otras: [...rutas].sort(porNombre) };

  const deTuZona = rutas.filter((ruta) => seSuperponen(ruta.rectangulo, zona.rectangulo));
  const otras = rutas.filter((ruta) => !deTuZona.includes(ruta));
  return { zona, deTuZona: deTuZona.sort(porNombre), otras: otras.sort(porNombre) };
}

function abarcar(rectangulos: Rectangulo[]): Rectangulo | null {
  if (rectangulos.length === 0) return null;

  return rectangulos.reduce<Rectangulo>(
    (area, rectangulo) => ({
      latNorte: Math.max(area.latNorte, rectangulo.latNorte),
      latSur: Math.min(area.latSur, rectangulo.latSur),
      lonEste: Math.max(area.lonEste, rectangulo.lonEste),
      lonOeste: Math.min(area.lonOeste, rectangulo.lonOeste),
    }),
    rectangulos[0],
  );
}

/**
 * El rectángulo que abarca todos los sectores con mapa bajado.
 *
 * Es a donde abre el mapa mientras el GPS no responde.
 */
export function areaDeLoBajado(
  sectores: Sector[],
  conMapa: Set<number>,
): Rectangulo | null {
  return abarcar(
    sectores.filter((sector) => conMapa.has(sector.id)).map((sector) => sector.rectangulo),
  );
}

/** Sin ningún mapa bajado, el mapa abre sobre todas las zonas. */
export function areaDeLasZonas(zonas: Zona[]): Rectangulo | null {
  return abarcar(zonas.map((zona) => zona.rectangulo));
}
