import { ACTIVIDADES_RUTA, type ActividadRuta } from "@/types/database";

export type SeleccionDelMapa = { visibles: ActividadRuta[]; principal: ActividadRuta | null };
export const SELECCION_INICIAL: SeleccionDelMapa = { visibles: [], principal: null };

export function leerSeleccionDelMapa(valor: unknown): SeleccionDelMapa | null {
  if (!valor || typeof valor !== "object") return null;
  const { visibles, principal } = valor as Record<string, unknown>;
  if (!Array.isArray(visibles)) return null;
  const validas = ACTIVIDADES_RUTA.filter((cada) => visibles.includes(cada));
  if (!validas.length) return { visibles: [], principal: null };
  return { visibles: validas, principal: validas.find((cada) => cada === principal) ?? validas[0] };
}

export function alternarActividadDelMapa(seleccion: SeleccionDelMapa, actividad: ActividadRuta): SeleccionDelMapa {
  const visibles = seleccion.visibles.includes(actividad)
    ? seleccion.visibles.filter((cada) => cada !== actividad)
    : [...seleccion.visibles, actividad];
  if (!visibles.length) return { visibles: [], principal: null };
  return { visibles, principal: seleccion.principal !== null && visibles.includes(seleccion.principal) ? seleccion.principal : visibles[0] };
}

export function comparteActividad(actividades: readonly ActividadRuta[], visibles: readonly ActividadRuta[]): boolean {
  return actividades.some((cada) => visibles.includes(cada));
}
