import { seSuperponen } from "@/lib/datos/rectangulo";
import { mostrarActividad, mostrarEsfuerzo } from "@/lib/rutas/actividades";
import type {
  ActividadRuta,
  NivelEsfuerzo,
  RutaResumen,
  Zona,
} from "@/types/database";

/**
 * Qué rutas quedan en la lista según los filtros elegidos.
 *
 * Las opciones salen de lo mismo que usa el formulario de carga: las
 * actividades, los niveles de esfuerzo y la dificultad del 1 al 10. Un filtro
 * que ofrece algo que la carga no tiene deja la lista vacía sin explicación.
 */

export type EstadoDelMapa = "todos" | "completo" | "falta";

export type FiltrosDeRutas = {
  zonaId: number | null;
  /** Vacío es «cualquiera». Con varias, alcanza con que la ruta tenga una. */
  actividades: ActividadRuta[];
  /** Texto tal cual lo escribió la persona. Vacío es «sin tope». */
  largoDesde: string;
  largoHasta: string;
  /** Cuántos circulitos se tocaron, de 1 a 5. Cada uno vale 2. `0` es cualquiera. */
  circulosDeTecnica: number;
  /** Vacío es «cualquiera». */
  esfuerzos: NivelEsfuerzo[];
  mapa: EstadoDelMapa;
};

export const SIN_FILTROS: FiltrosDeRutas = {
  zonaId: null,
  actividades: [],
  largoDesde: "",
  largoHasta: "",
  circulosDeTecnica: 0,
  esfuerzos: [],
  mapa: "todos",
};

/** Los circulitos de la dificultad técnica: 5, y cada uno vale 2 puntos. */
export const CIRCULOS_DE_TECNICA = 5;

/** Cuántos circulitos se pintan para una dificultad del 1 al 10. */
export function circulosDeDificultad(dificultad: number): number {
  return Math.ceil(dificultad / 2);
}

/** El tope de dificultad que marca una cantidad de circulitos. */
export function dificultadMaxima(circulos: number): number {
  return circulos * 2;
}

/** «12,5» o «12.5» → 12.5. Vacío o algo que no es número → `null`. */
export function leerKm(texto: string): number | null {
  const limpio = texto.trim().replace(",", ".");
  if (limpio === "") return null;
  const numero = Number(limpio);
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
}

/** Qué está mal en el largo escrito, o `null` si está bien. */
export function problemaDelLargo(filtros: FiltrosDeRutas): string | null {
  const { largoDesde, largoHasta } = filtros;
  if (largoDesde.trim() !== "" && leerKm(largoDesde) === null) {
    return "El «desde» tiene que ser un número de km.";
  }
  if (largoHasta.trim() !== "" && leerKm(largoHasta) === null) {
    return "El «hasta» tiene que ser un número de km.";
  }
  const desde = leerKm(largoDesde);
  const hasta = leerKm(largoHasta);
  if (desde !== null && hasta !== null && desde > hasta) {
    return "El «desde» es más grande que el «hasta». Cambiá uno de los dos.";
  }
  return null;
}

/**
 * Qué parte de la ruta tiene el mapa bajado, del 0 al 100.
 * La misma cuenta que muestra la tarjeta como «Mapas descargados».
 */
export function porcentajeDeMapa(
  ruta: RutaResumen,
  conMapa: Set<number>,
): number {
  let total = 0;
  let cubierto = 0;

  for (const [clave, metros] of Object.entries(ruta.distanciasPorSector ?? {})) {
    total += metros;
    if (clave !== "sin_sector" && conMapa.has(Number(clave))) {
      cubierto += metros;
    }
  }

  return total === 0 ? 100 : Math.round((cubierto / total) * 100);
}

type Contexto = {
  zonas: Zona[];
  conMapa: Set<number>;
};

export function cumpleLosFiltros(
  ruta: RutaResumen,
  filtros: FiltrosDeRutas,
  { zonas, conMapa }: Contexto,
): boolean {
  if (filtros.zonaId !== null) {
    const zona = zonas.find((cada) => cada.id === filtros.zonaId);
    if (!zona || !seSuperponen(ruta.rectangulo, zona.rectangulo)) return false;
  }

  if (
    filtros.actividades.length > 0 &&
    !filtros.actividades.some((actividad) => ruta.actividades.includes(actividad))
  ) {
    return false;
  }

  const desde = leerKm(filtros.largoDesde);
  const hasta = leerKm(filtros.largoHasta);
  if (desde !== null || hasta !== null) {
    // Una ruta sin largo no se puede comparar: no entra en ningún rango.
    if (ruta.largoKm === null) return false;
    if (desde !== null && ruta.largoKm < desde) return false;
    if (hasta !== null && ruta.largoKm > hasta) return false;
  }

  if (filtros.circulosDeTecnica > 0) {
    if (ruta.dificultadTecnica === null) return false;
    if (ruta.dificultadTecnica > dificultadMaxima(filtros.circulosDeTecnica)) {
      return false;
    }
  }

  if (filtros.esfuerzos.length > 0) {
    if (ruta.nivelEsfuerzo === null) return false;
    if (!filtros.esfuerzos.includes(ruta.nivelEsfuerzo)) return false;
  }

  if (filtros.mapa !== "todos") {
    const completo = porcentajeDeMapa(ruta, conMapa) === 100;
    if (filtros.mapa === "completo" && !completo) return false;
    if (filtros.mapa === "falta" && completo) return false;
  }

  return true;
}

export function filtrarRutas(
  rutas: RutaResumen[],
  filtros: FiltrosDeRutas,
  contexto: Contexto,
): RutaResumen[] {
  return rutas.filter((ruta) => cumpleLosFiltros(ruta, filtros, contexto));
}

/**
 * Los filtros recordados pueden apuntar a una zona que ya no está. Esa zona se
 * ignora: dejarla puesta vaciaría la lista sin que se entienda por qué.
 */
export function sinLoQueYaNoExiste(
  filtros: FiltrosDeRutas,
  zonas: Zona[],
): FiltrosDeRutas {
  if (filtros.zonaId === null) return filtros;
  if (zonas.some((zona) => zona.id === filtros.zonaId)) return filtros;
  return { ...filtros, zonaId: null };
}

/** Un filtro puesto, como se muestra en la pastilla de arriba de la lista. */
export type FiltroPuesto = {
  clave: string;
  etiqueta: string;
  sacar: (filtros: FiltrosDeRutas) => FiltrosDeRutas;
};

export function filtrosPuestos(
  filtros: FiltrosDeRutas,
  zonas: Zona[],
): FiltroPuesto[] {
  const puestos: FiltroPuesto[] = [];

  if (filtros.zonaId !== null) {
    const zona = zonas.find((cada) => cada.id === filtros.zonaId);
    puestos.push({
      clave: "zona",
      etiqueta: zona?.nombre ?? "Zona",
      sacar: (f) => ({ ...f, zonaId: null }),
    });
  }

  for (const actividad of filtros.actividades) {
    puestos.push({
      clave: `actividad-${actividad}`,
      etiqueta: mostrarActividad(actividad).etiqueta,
      sacar: (f) => ({
        ...f,
        actividades: f.actividades.filter((cada) => cada !== actividad),
      }),
    });
  }

  const desde = leerKm(filtros.largoDesde);
  const hasta = leerKm(filtros.largoHasta);
  if (desde !== null || hasta !== null) {
    const km = (n: number) => String(n).replace(".", ",");
    puestos.push({
      clave: "largo",
      etiqueta:
        desde !== null && hasta !== null
          ? `${km(desde)} a ${km(hasta)} km`
          : desde !== null
            ? `Desde ${km(desde)} km`
            : `Hasta ${km(hasta as number)} km`,
      sacar: (f) => ({ ...f, largoDesde: "", largoHasta: "" }),
    });
  }

  if (filtros.circulosDeTecnica > 0) {
    puestos.push({
      clave: "tecnica",
      etiqueta: `Técnica hasta ${dificultadMaxima(filtros.circulosDeTecnica)}`,
      sacar: (f) => ({ ...f, circulosDeTecnica: 0 }),
    });
  }

  for (const esfuerzo of filtros.esfuerzos) {
    puestos.push({
      clave: `esfuerzo-${esfuerzo}`,
      etiqueta: `Esfuerzo ${mostrarEsfuerzo(esfuerzo).toLowerCase()}`,
      sacar: (f) => ({
        ...f,
        esfuerzos: f.esfuerzos.filter((cada) => cada !== esfuerzo),
      }),
    });
  }

  if (filtros.mapa !== "todos") {
    puestos.push({
      clave: "mapa",
      etiqueta: filtros.mapa === "completo" ? "Mapa completo" : "Falta bajar mapa",
      sacar: (f) => ({ ...f, mapa: "todos" }),
    });
  }

  return puestos;
}
