"use client";

import { createClient } from "@/lib/supabase/client";
import type { Perfil } from "@/types/database";

/**
 * Los nombres y las fotos de quienes subieron cosas.
 *
 * Esto sí necesita señal, y por eso **ninguna pantalla depende de que llegue**:
 * si no hay conexión se devuelve vacío y la pantalla muestra lo que pueda. El
 * nombre de quien subió una ruta no es lo que hace falta en el cerro.
 */
export async function traerPerfilesPorId(
  ids: string[],
): Promise<Record<string, Perfil>> {
  const unicos = [...new Set(ids.filter(Boolean))];
  if (unicos.length === 0) return {};

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("perfiles")
      .select("id, nombre, avatar_url, categoria, creado_en, actualizado_en")
      .in("id", unicos)
      .is("eliminado_en", null);

    if (error || !data) return {};

    const porId: Record<string, Perfil> = {};

    for (const fila of data as Array<{
      id: string;
      nombre: string | null;
      avatar_url: string | null;
      categoria: Perfil["categoria"];
      creado_en: string;
      actualizado_en: string;
    }>) {
      porId[fila.id] = {
        id: fila.id,
        nombre: fila.nombre,
        avatarUrl: fila.avatar_url,
        categoria: fila.categoria,
        creadoEn: fila.creado_en,
        actualizadoEn: fila.actualizado_en,
      };
    }

    return porId;
  } catch {
    return {};
  }
}
