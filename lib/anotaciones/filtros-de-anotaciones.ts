import { caeDentroDe } from "@/lib/anotaciones/lugar";
import type { Anotacion, IconoPunto, Sector, Zona } from "@/types/database";

/**
 * Los filtros de la lista de anotaciones. Sin nada de pantalla.
 *
 * Manda dónde está la anotación, no a qué sector se la anotó: una marcada
 * navegando o desde Mapas, sin sector, aparece en la zona o el sector donde cae.
 */

export type FiltroDeLugar = `zona:${number}` | `sector:${number}`;
export type FiltroDeTipo = "todas" | "punto" | "trazo";

export type FiltrosDeAnotaciones = {
  tipo: FiltroDeTipo;
  lugar: FiltroDeLugar | null;
  /** Solo filtra puntos: un trazo no tiene ícono. */
  icono: IconoPunto | null;
};

export const SIN_FILTROS_DE_ANOTACIONES: FiltrosDeAnotaciones = {
  tipo: "todas",
  lugar: null,
  icono: null,
};

export function filtrarAnotaciones(
  anotaciones: Anotacion[],
  filtros: FiltrosDeAnotaciones,
  zonas: Zona[],
  sectores: Sector[],
): Anotacion[] {
  return anotaciones.filter((anotacion) => {
    if (filtros.tipo !== "todas" && anotacion.tipo !== filtros.tipo) return false;
    if (filtros.icono && (anotacion.tipo !== "punto" || anotacion.icono !== filtros.icono)) return false;
    if (!filtros.lugar) return true;

    const [clase, idTexto] = filtros.lugar.split(":");
    const id = Number(idTexto);
    if (clase === "zona") {
      const zona = zonas.find((cada) => cada.id === id);
      const sectoresDeLaZona = sectores.filter((sector) => sector.zonaId === id);
      return (
        sectoresDeLaZona.some((sector) => sector.id === anotacion.sectorId) ||
        Boolean(zona && caeDentroDe(anotacion, zona.rectangulo))
      );
    }

    const sector = sectores.find((cada) => cada.id === id);
    return anotacion.sectorId === id || Boolean(sector && caeDentroDe(anotacion, sector.rectangulo));
  });
}

/** «Champaquí · A1», o lo que se sepa de dónde queda. */
export function dondeQueda(anotacion: Anotacion, zonas: Zona[], sectores: Sector[]): string {
  const sector =
    sectores.find((cada) => cada.id === anotacion.sectorId) ??
    sectores.find((cada) => caeDentroDe(anotacion, cada.rectangulo));
  const zona =
    (sector && zonas.find((cada) => cada.id === sector.zonaId)) ??
    zonas.find((cada) => caeDentroDe(anotacion, cada.rectangulo));
  if (zona && sector) return `${zona.nombre} · ${sector.nombre}`;
  if (zona) return `${zona.nombre} · fuera de los sectores`;
  return "Fuera de las zonas";
}
