import { ACTIVIDADES_RUTA, type ActividadRuta } from "@/types/database";

/** Perfiles anteriores sin principal usan su primera actividad guardada. */
export function principalDelPerfil(actividades: readonly ActividadRuta[], principal: ActividadRuta | null | undefined): ActividadRuta | null {
  return principal && actividades.includes(principal) ? principal : actividades[0] ?? null;
}

export function revisarActividadesDelPerfil(actividades: unknown, principal: unknown): string | null {
  if (!Array.isArray(actividades) || actividades.length === 0) return "Elegí al menos una actividad que practiques.";
  if (actividades.some((cada) => !ACTIVIDADES_RUTA.includes(cada))) return "Hay una actividad que no existe. Volvé a elegir entre las disponibles.";
  if (actividades.length > 1 && !actividades.includes(principal)) return "Elegí tu actividad principal entre las que practicás.";
  return null;
}
