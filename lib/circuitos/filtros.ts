import { mostrarActividad, mostrarEsfuerzo } from "@/lib/rutas/actividades";
import { sinTildes } from "@/lib/marcas/buscar-en-consultas";
import type { ActividadRuta, NivelEsfuerzo } from "@/types/database";

/**
 * Los filtros de la lista de Circuitos, sin nada de pantalla ni de base.
 *
 * Se resuelven en el celular sobre lo que ya llegó: buscar o filtrar no sale
 * a internet, y funciona igual sin señal. Dentro de un mismo filtro alcanza
 * con que coincida una opción; entre filtros distintos tienen que cumplirse
 * todos.
 */

export type FiltrosDeCircuitos = {
  /** Parte del nombre, sin importar mayúsculas ni tildes. */
  nombre: string;
  actividades: ActividadRuta[];
  /** Quién lo creó. */
  autores: string[];
  esfuerzos: NivelEsfuerzo[];
  /** Entre cuántos kilómetros, con los dos extremos adentro. */
  largoDesdeKm: number | null;
  largoHastaKm: number | null;
};

export const SIN_FILTROS_DE_CIRCUITOS: FiltrosDeCircuitos = {
  nombre: "",
  actividades: [],
  autores: [],
  esfuerzos: [],
  largoDesdeKm: null,
  largoHastaKm: null,
};

/** Lo que hace falta de cada Circuito para filtrarlo. */
export type CircuitoParaFiltrar = {
  nombre: string;
  actividad: ActividadRuta;
  autorId: string | null;
  esfuerzo: NivelEsfuerzo | null;
  /** `null` si todavía no se midió. */
  largoM: number | null;
};

export function filtrarCircuitos<T extends CircuitoParaFiltrar>(circuitos: T[], filtros: FiltrosDeCircuitos): T[] {
  const nombre = sinTildes(filtros.nombre);
  return circuitos.filter((circuito) => {
    if (nombre && !sinTildes(circuito.nombre).includes(nombre)) return false;
    if (filtros.actividades.length && !filtros.actividades.includes(circuito.actividad)) return false;
    if (filtros.autores.length && (!circuito.autorId || !filtros.autores.includes(circuito.autorId))) return false;
    if (filtros.esfuerzos.length && (!circuito.esfuerzo || !filtros.esfuerzos.includes(circuito.esfuerzo))) {
      return false;
    }
    if (filtros.largoDesdeKm !== null || filtros.largoHastaKm !== null) {
      // Sin largo medido no se puede decir que entra: queda afuera.
      if (circuito.largoM === null) return false;
      const km = circuito.largoM / 1000;
      if (filtros.largoDesdeKm !== null && km < filtros.largoDesdeKm) return false;
      if (filtros.largoHastaKm !== null && km > filtros.largoHastaKm) return false;
    }
    return true;
  });
}

export type FiltroDeCircuitoPuesto = {
  clave: string;
  etiqueta: string;
  sinEste: FiltrosDeCircuitos;
};

function km(valor: number): string {
  return `${String(valor).replace(".", ",")} km`;
}

/** Cada filtro puesto, salvo el nombre (se ve en su buscador), con su etiqueta y cómo sacarlo. */
export function filtrosDeCircuitosPuestos(
  filtros: FiltrosDeCircuitos,
  nombreDe: (perfilId: string) => string,
): FiltroDeCircuitoPuesto[] {
  const puestos: FiltroDeCircuitoPuesto[] = [];
  for (const actividad of filtros.actividades) {
    puestos.push({
      clave: `actividad-${actividad}`,
      etiqueta: mostrarActividad(actividad).etiqueta,
      sinEste: { ...filtros, actividades: filtros.actividades.filter((cada) => cada !== actividad) },
    });
  }
  for (const autor of filtros.autores) {
    puestos.push({
      clave: `autor-${autor}`,
      etiqueta: `Creado por ${nombreDe(autor)}`,
      sinEste: { ...filtros, autores: filtros.autores.filter((cada) => cada !== autor) },
    });
  }
  for (const esfuerzo of filtros.esfuerzos) {
    puestos.push({
      clave: `esfuerzo-${esfuerzo}`,
      etiqueta: `Esfuerzo ${mostrarEsfuerzo(esfuerzo).toLowerCase()}`,
      sinEste: { ...filtros, esfuerzos: filtros.esfuerzos.filter((cada) => cada !== esfuerzo) },
    });
  }
  const { largoDesdeKm: desde, largoHastaKm: hasta } = filtros;
  if (desde !== null || hasta !== null) {
    puestos.push({
      clave: "largo",
      etiqueta:
        desde !== null && hasta !== null
          ? `De ${km(desde)} a ${km(hasta)}`
          : desde !== null
            ? `Desde ${km(desde)}`
            : `Hasta ${km(hasta as number)}`,
      sinEste: { ...filtros, largoDesdeKm: null, largoHastaKm: null },
    });
  }
  return puestos;
}

/**
 * Lo que se escribió en un campo de kilómetros: «12,5» o «12.5». Vacío o lo
 * que no es un número mayor o igual a cero, sin límite.
 */
export function leerKilometros(texto: string): number | null {
  const limpio = texto.trim().replace(",", ".");
  if (!limpio) return null;
  const numero = Number(limpio);
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
}
