import { SIN_FILTROS, CIRCULOS_DE_TECNICA, type FiltrosDeRutas } from "@/lib/rutas/filtros";
import {
  ACTIVIDADES_RUTA,
  NIVELES_ESFUERZO,
  type ActividadRuta,
  type NivelEsfuerzo,
} from "@/types/database";

/**
 * Los filtros de la lista de rutas quedan anotados en el celular.
 *
 * Así, al ir a una ruta y volver, o al cerrar la app y abrirla otro día, la
 * lista sigue filtrada como la dejaste. Los filtros puestos se ven siempre
 * arriba de la lista, así que nunca quedan ocultos.
 *
 * Lo guardado se revisa campo por campo al leerlo: si una versión nueva cambia
 * los filtros, lo viejo que no encaja se descarta en vez de romper la lista.
 */

const CLAVE = "trackapp-filtros-de-rutas-v1";

const avisar = new Set<() => void>();

function hayDondeGuardar(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.slice(0, 12) : "";
}

/** Convierte lo guardado en filtros válidos. Lo que no encaja, queda sin filtro. */
export function leerFiltrosGuardados(crudo: string | null): FiltrosDeRutas {
  if (!crudo) return SIN_FILTROS;

  let guardado: Record<string, unknown>;
  try {
    const leido = JSON.parse(crudo) as unknown;
    if (!leido || typeof leido !== "object" || Array.isArray(leido)) return SIN_FILTROS;
    guardado = leido as Record<string, unknown>;
  } catch {
    return SIN_FILTROS;
  }

  const lista = (valor: unknown) => (Array.isArray(valor) ? valor : []);
  const circulos = guardado.circulosDeTecnica;

  return {
    zonaId:
      typeof guardado.zonaId === "number" && Number.isFinite(guardado.zonaId)
        ? guardado.zonaId
        : null,
    actividades: lista(guardado.actividades).filter((cada): cada is ActividadRuta =>
      ACTIVIDADES_RUTA.includes(cada as ActividadRuta),
    ),
    largoDesde: texto(guardado.largoDesde),
    largoHasta: texto(guardado.largoHasta),
    circulosDeTecnica:
      typeof circulos === "number" &&
      Number.isInteger(circulos) &&
      circulos >= 0 &&
      circulos <= CIRCULOS_DE_TECNICA
        ? circulos
        : 0,
    esfuerzos: lista(guardado.esfuerzos).filter((cada): cada is NivelEsfuerzo =>
      NIVELES_ESFUERZO.includes(cada as NivelEsfuerzo),
    ),
    mapa:
      guardado.mapa === "completo" || guardado.mapa === "falta" ? guardado.mapa : "todos",
  };
}

let ultimoCrudo: string | null = null;
let ultimosFiltros: FiltrosDeRutas = SIN_FILTROS;

/** Los filtros anotados. Devuelve el mismo objeto mientras no cambien. */
export function filtrosGuardados(): FiltrosDeRutas {
  if (!hayDondeGuardar()) return SIN_FILTROS;

  let crudo: string | null = null;
  try {
    crudo = localStorage.getItem(CLAVE);
  } catch {
    return SIN_FILTROS;
  }

  if (crudo !== ultimoCrudo) {
    ultimoCrudo = crudo;
    ultimosFiltros = leerFiltrosGuardados(crudo);
  }
  return ultimosFiltros;
}

export function guardarFiltros(filtros: FiltrosDeRutas): void {
  if (!hayDondeGuardar()) return;

  try {
    localStorage.setItem(CLAVE, JSON.stringify(filtros));
  } catch {
    // Sin lugar para anotarlos, los filtros siguen andando mientras la lista
    // está abierta; solo no se recuerdan. No hay nada que avisar.
  }
  avisar.forEach((cada) => cada());
}

export function alCambiarLosFiltros(escuchar: () => void): () => void {
  avisar.add(escuchar);
  return () => {
    avisar.delete(escuchar);
  };
}
