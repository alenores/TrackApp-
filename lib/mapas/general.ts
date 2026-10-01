import type { Anotacion, Rectangulo, Sector, Zona } from "@/types/database";
import type { RectanguloEnElMapa } from "@/lib/mapas/rectangulos";

/**
 * Aproximación que deja visible toda la provincia al abrir el mapa general.
 * Límites publicados por IDECOR para sus mapas provinciales.
 */
export const CORDOBA_COMPLETA: Rectangulo = {
  latNorte: -29.4683,
  latSur: -35.0353,
  lonOeste: -65.8309,
  lonEste: -61.7210,
};

/** Solo las zonas: los sectores se consultan al abrir la ficha de una zona. */
export function zonasEnElMapaGeneral(zonas: Zona[]): RectanguloEnElMapa[] {
  return zonas.map((zona) => ({
    id: zona.id,
    rectangulo: zona.rectangulo,
    clase: "zona_general",
    etiqueta: zona.nombre,
  }));
}

export function sectoresPorZona(sectores: Sector[]): Record<number, number> {
  const cantidades: Record<number, number> = {};
  for (const sector of sectores) {
    cantidades[sector.zonaId] = (cantidades[sector.zonaId] ?? 0) + 1;
  }
  return cantidades;
}

/** Las anotaciones de tipo punto, estén dentro o fuera de cualquier zona. */
export function puntosDelMapaGeneral(anotaciones: Anotacion[]): Anotacion[] {
  return anotaciones.filter((anotacion) => anotacion.tipo === "punto");
}

/** Si dos zonas se pisan, elegir la más pequeña evita tapar la ficha de abajo. */
export function zonaEnElLugar<T extends { rectangulo: Rectangulo }>(
  zonas: T[],
  lon: number,
  lat: number,
): T | null {
  const encontradas = zonas.filter(({ rectangulo }) =>
    lat <= rectangulo.latNorte &&
    lat >= rectangulo.latSur &&
    lon <= rectangulo.lonEste &&
    lon >= rectangulo.lonOeste,
  );
  return encontradas.sort((a, b) => {
    const areaA = (a.rectangulo.latNorte - a.rectangulo.latSur) * (a.rectangulo.lonEste - a.rectangulo.lonOeste);
    const areaB = (b.rectangulo.latNorte - b.rectangulo.latSur) * (b.rectangulo.lonEste - b.rectangulo.lonOeste);
    return areaA - areaB;
  })[0] ?? null;
}
