import type { Anotacion } from "@/types/database";

/**
 * Una fila de la base, pasada a anotación de la app.
 *
 * Vive aparte para que la usen igual la puesta al día y la subida de lo que se
 * marcó sin señal: una sola lectura, una sola verdad sobre qué es cada campo.
 */

export type FilaDeAnotacion = Record<string, unknown> & {
  /** La categoría del autor, traída en la misma consulta. */
  perfiles?: { categoria?: string | null } | null;
};

/** Qué se pide a la base para armar una anotación completa. */
export const COLUMNAS_DE_ANOTACION = "*, perfiles(categoria)";

export function leerFilaDeAnotacion(fila: FilaDeAnotacion): Anotacion {
  const creadoEn = String(fila.creado_en);

  return {
    id: Number(fila.id),
    sectorId: fila.sector_id === null || fila.sector_id === undefined
      ? null
      : Number(fila.sector_id),
    perfilId: String(fila.perfil_id),
    deAdministrador: fila.perfiles?.categoria === "administrador",
    tipo: fila.tipo as Anotacion["tipo"],
    origen: (fila.origen as Anotacion["origen"]) ?? "manual",
    icono: (fila.icono as Anotacion["icono"]) ?? null,
    color: (fila.color as string | null) ?? null,
    comentario: (fila.comentario as string | null) ?? null,
    fotoUrl: (fila.foto_url as string | null) ?? null,
    fotoChicaUrl: (fila.foto_chica_url as string | null) ?? null,
    geometria: fila.geometria as Anotacion["geometria"],
    marcadaEn: (fila.marcada_en as string | null) ?? creadoEn,
    precisionGpsMetros:
      fila.precision_gps_metros === null || fila.precision_gps_metros === undefined
        ? null
        : Number(fila.precision_gps_metros),
    creadoEn,
    actualizadoEn: String(fila.actualizado_en),
  };
}

/**
 * Una anotación guardada con una versión vieja de la app, completada.
 *
 * El paquete del celular puede venir de antes de que existieran algunos
 * campos. Hasta que se ponga al día, se lee con valores que no mienten: sin
 * foto chica, sin precisión, y la fecha de marcado es la de creación.
 */
export function completarAnotacionVieja(
  guardada: Partial<Anotacion> & Pick<Anotacion, "id" | "geometria" | "tipo">,
): Anotacion {
  const creadoEn = guardada.creadoEn ?? "";
  return {
    sectorId: null,
    perfilId: "",
    deAdministrador: false,
    origen: "manual",
    icono: null,
    color: null,
    comentario: null,
    fotoUrl: null,
    fotoChicaUrl: null,
    precisionGpsMetros: null,
    actualizadoEn: creadoEn,
    ...guardada,
    marcadaEn: guardada.marcadaEn ?? creadoEn,
    creadoEn,
  };
}
