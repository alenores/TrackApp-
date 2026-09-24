import { seSuperponen } from "@/lib/datos/rectangulo";
import type { MapaQueTenias } from "@/lib/supabase/mapas-bajados";
import { claveDeMapa, type TipoDeMapa } from "@/lib/offline/mapas";
import type { RutaResumen, Sector } from "@/types/database";

/**
 * Qué mapas le faltan al celular, y por qué le faltan.
 *
 * Son dos cosas distintas y no se mezclan:
 *
 * - **Perdido:** la base dice que lo bajaste y en el celular no está. Alguien se
 *   lo llevó sin avisar. Es lo urgente: el usuario creía que lo tenía.
 * - **Nunca bajado:** una ruta que pasa por sectores que nunca bajaste. No es
 *   una pérdida, es una tarea pendiente.
 *
 * Un sector perdido nunca se cuenta además como nunca bajado: sería el mismo
 * problema contado dos veces, y dos avisos para una sola cosa confunden.
 */

export type MapaPerdido = {
  sector: Sector;
  tipo: TipoDeMapa;
  acercamientoMaximo: number;
};

export type RutaSinMapa = {
  ruta: RutaResumen;
  /** Los sectores de esa ruta que no tienen el mapa en el celular. */
  sectores: Sector[];
};

/**
 * Los mapas que la base dice que tenías y en el celular no están.
 *
 * Un sector que ya no existe —porque se borró la zona, por ejemplo— no se
 * cuenta: no hay nada que recuperar.
 */
export function mapasPerdidos(
  loQueTenias: MapaQueTenias[],
  sectores: Sector[],
  /** Los mapas que hay en el celular, cada uno con `claveDeMapa`. */
  mapasEnElCelular: Set<string>,
): MapaPerdido[] {
  const porId = new Map(sectores.map((sector) => [sector.id, sector]));

  return loQueTenias.flatMap((tenia) => {
    // Tener el simple no cubre haber perdido el satelital: son dos mapas.
    if (mapasEnElCelular.has(claveDeMapa(tenia.sectorId, tenia.tipo))) return [];

    const sector = porId.get(tenia.sectorId);
    if (!sector) return [];

    return [
      {
        sector,
        tipo: tenia.tipo,
        acercamientoMaximo: tenia.acercamientoMaximo,
      },
    ];
  });
}

/** Los sectores que una ruta toca. Puede no tocar ninguno. */
export function sectoresDeLaRuta(ruta: RutaResumen, sectores: Sector[]): Sector[] {
  return sectores.filter((sector) =>
    seSuperponen(sector.rectangulo, ruta.rectangulo),
  );
}

/**
 * Las rutas a las que nunca les bajaste el mapa.
 *
 * Una ruta que no toca ningún sector queda afuera: no hay mapa para bajarle, así
 * que ofrecerlo sería ofrecer nada.
 */
export function rutasSinMapa(
  rutas: RutaResumen[],
  sectores: Sector[],
  sectoresConMapa: Set<number>,
  perdidos: MapaPerdido[],
): RutaSinMapa[] {
  const yaAvisados = new Set(perdidos.map((cada) => cada.sector.id));

  return rutas.flatMap((ruta) => {
    const suyos = sectoresDeLaRuta(ruta, sectores);
    if (suyos.length === 0) return [];

    const faltan = suyos.filter(
      (sector) => !sectoresConMapa.has(sector.id) && !yaAvisados.has(sector.id),
    );

    if (faltan.length === 0) return [];

    return [{ ruta, sectores: faltan }];
  });
}

/** Los sectores sueltos de un grupo de rutas, sin repetir. */
export function sectoresDeLasRutas(rutas: RutaSinMapa[]): Sector[] {
  const porId = new Map<number, Sector>();

  for (const cada of rutas) {
    for (const sector of cada.sectores) porId.set(sector.id, sector);
  }

  return [...porId.values()];
}

/**
 * Los nombres, listos para escribirlos en una oración.
 *
 * «Pampa, Filo y Cuesta» se lee de un vistazo; una lista separada por comas
 * hasta el final, no.
 */
export function comoLista(nombres: string[]): string {
  if (nombres.length === 0) return "";
  if (nombres.length === 1) return nombres[0];

  return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}
