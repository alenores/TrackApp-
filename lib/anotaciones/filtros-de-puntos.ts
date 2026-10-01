import { caeDentroDe } from "@/lib/anotaciones/lugar";
import type { Anotacion, IconoPunto, Sector, Zona } from "@/types/database";

export type FiltroDeLugar = `zona:${number}` | `sector:${number}`;

/** Reduce los puntos de la lista por ubicación y tipo de ícono. */
export function filtrarPuntos(
  puntos: Anotacion[],
  filtroDeLugar: FiltroDeLugar | null,
  filtroDeIcono: IconoPunto | null,
  zonas: Zona[],
  sectores: Sector[],
): Anotacion[] {
  return puntos.filter((punto) => {
    if (punto.tipo !== "punto" || punto.geometria.type !== "Point") return false;
    if (filtroDeIcono && punto.icono !== filtroDeIcono) return false;
    if (!filtroDeLugar) return true;

    const [tipo, idTexto] = filtroDeLugar.split(":");
    const id = Number(idTexto);
    if (tipo === "zona") {
      const zona = zonas.find((cada) => cada.id === id);
      const sectoresDeLaZona = sectores.filter((sector) => sector.zonaId === id);
      return sectoresDeLaZona.some((sector) => sector.id === punto.sectorId)
        || Boolean(zona && caeDentroDe(punto, zona.rectangulo));
    }

    const sector = sectores.find((cada) => cada.id === id);
    return punto.sectorId === id || Boolean(sector && caeDentroDe(punto, sector.rectangulo));
  });
}
