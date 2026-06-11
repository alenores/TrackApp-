"use server";

import { revalidatePath } from "next/cache";
import { getUserDisplayName } from "@/lib/auth/profile";
import { getAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatSupabaseError } from "@/lib/supabase/errors";

type SaveSectorInput = {
  zonaId: string;
  nombre: string;
  descripcion: string | null;
  lat_ne: number;
  lon_ne: number;
  lat_se: number;
  lon_se: number;
  lat_so: number;
  lon_so: number;
  lat_no: number;
  lon_no: number;
  zoom_minimo: number;
};

export type SaveSectorResult =
  | { success: true; sectorId: string }
  | { success: false; error: string };

export async function saveSector(
  input: SaveSectorInput,
): Promise<SaveSectorResult> {
  const user = await getAuthUser();
  if (!user?.id) {
    return { success: false, error: "Tenés que iniciar sesión." };
  }

  const supabase = await createClient();
  const sectorId = crypto.randomUUID();
  const base = {
    id: sectorId,
    zona_id: input.zonaId,
    user_id: user.id,
    nombre: input.nombre.trim(),
    descripcion: input.descripcion?.trim() || null,
    lat_ne: input.lat_ne,
    lon_ne: input.lon_ne,
    lat_se: input.lat_se,
    lon_se: input.lon_se,
    lat_so: input.lat_so,
    lon_so: input.lon_so,
    lat_no: input.lat_no,
    lon_no: input.lon_no,
    zoom_minimo: Math.max(10, input.zoom_minimo),
  };

  let insertError = (
    await supabase
      .from("sectores")
      .insert({ ...base, subido_por_nombre: getUserDisplayName(user) })
  ).error;

  if (insertError?.message.includes("subido_por_nombre")) {
    insertError = (await supabase.from("sectores").insert(base)).error;
  }

  if (insertError) {
    return { success: false, error: formatSupabaseError(insertError.message) };
  }

  revalidatePath(`/zonas/${input.zonaId}`);

  await supabase
    .from("novedades")
    .insert({ descripcion: `Sector creado: ${input.nombre.trim()}` });

  return { success: true, sectorId };
}
