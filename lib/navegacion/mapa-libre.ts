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

const porNombre = (a: RutaResumen, b: RutaResumen) =>
  a.nombre.localeCompare(b.nombre, "es");

/**
 * El sector donde estás parado, o `null` si no estás adentro de ninguno.
 *
 * Es el que queda elegido en el mapa libre cuando el GPS responde.
 */
export function sectorDondeEstas(sectores: Sector[], posicion: Posicion | null): Sector | null {
  if (!posicion) return null;
  return sectores.find((sector) => contiene(sector.rectangulo, posicion)) ?? null;
}

/**
 * El sector de una ruta: por donde pasa la mayor parte de su línea.
 *
 * Una ruta puede cruzar varios sectores. Al navegarla, la lista de rutas abre
 * en el que tiene más metros de ella.
 */
export function sectorPrincipalDeLaRuta(ruta: RutaResumen, sectores: Sector[]): Sector | null {
  let elegido: Sector | null = null;
  let masMetros = 0;

  for (const sector of sectores) {
    const metros = ruta.distanciasPorSector?.[String(sector.id)] ?? 0;
    if (metros > masMetros) {
      masMetros = metros;
      elegido = sector;
    }
  }

  // Sin metros anotados, el primer sector que toca su rectángulo.
  return elegido ?? sectores.find((sector) => seSuperponen(sector.rectangulo, ruta.rectangulo)) ?? null;
}

/**
 * Las rutas de un sector, por nombre: las que tienen metros adentro.
 *
 * Una ruta sin metros anotados cae en los sectores que toca su rectángulo:
 * si no, no aparecería en ninguna lista y no habría forma de prenderla.
 */
export function rutasDelSector(rutas: RutaResumen[], sector: Sector): RutaResumen[] {
  return rutas
    .filter((ruta) => {
      const distancias = ruta.distanciasPorSector ?? {};
      if (Object.keys(distancias).length === 0) {
        return seSuperponen(ruta.rectangulo, sector.rectangulo);
      }
      return (distancias[String(sector.id)] ?? 0) > 0;
    })
    .sort(porNombre);
}

/** El sector que contiene el lugar tocado en el mapa chico, si hay uno. */
export function sectorEnElLugar(sectores: Sector[], lugar: Posicion): Sector | null {
  return sectores.find((sector) => contiene(sector.rectangulo, lugar)) ?? null;
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
 * El rectángulo que abarca todas las zonas.
 *
 * Es a donde abre el mapa libre mientras el GPS no responde: se ven todas las
 * zonas desde arriba, y cuando llega la posición el mapa va a donde estás.
 */
export function areaDeLasZonas(zonas: Zona[]): Rectangulo | null {
  return abarcar(zonas.map((zona) => zona.rectangulo));
}
