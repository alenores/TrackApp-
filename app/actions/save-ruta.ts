"use server";

import { revalidatePath } from "next/cache";
import type { FeatureCollection } from "geojson";
import { getUserDisplayName } from "@/lib/auth/profile";
import { getAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatSupabaseError } from "@/lib/supabase/errors";
import { getGpxStoragePath, type RouteBbox } from "@/lib/gpx";

const GPX_BUCKET = "gpx-files";

type SaveRutaInput = {
  nombre: string;
  descripcion: string | null;
  distanciaKm: number;
  geojson: FeatureCollection;
  bbox: RouteBbox;
  routeFile: File;
};

export type SaveRutaResult =
  | { success: true; rutaId: string }
  | { success: false; error: string };

export async function saveRuta(input: SaveRutaInput): Promise<SaveRutaResult> {
  const supabase = await createClient();

  const user = await getAuthUser();

  if (!user?.id) {
    return {
      success: false,
      error: "Tenés que iniciar sesión para guardar una ruta.",
    };
  }

  const userId = user.id;
  const rutaId = crypto.randomUUID();

  const { error: insertError } = await supabase.from("rutas").insert({
    id: rutaId,
    user_id: userId,
    nombre: input.nombre.trim(),
    descripcion: input.descripcion?.trim() || null,
    distancia_km: input.distanciaKm,
    geojson: input.geojson,
    bbox: input.bbox,
    gpx_url: null,
    subido_por_nombre: getUserDisplayName(user),
  });

  if (insertError) {
    return { success: false, error: formatSupabaseError(insertError.message) };
  }

  const storagePath = getGpxStoragePath(userId, rutaId);
  const fileBuffer = await input.routeFile.arrayBuffer();
  const contentType = input.routeFile.name.toLowerCase().endsWith(".kml")
    ? "application/vnd.google-earth.kml+xml"
    : "application/gpx+xml";

  const { error: uploadError } = await supabase.storage
    .from(GPX_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    await supabase
      .from("rutas")
      .delete()
      .eq("id", rutaId)
      .eq("user_id", userId);
    return {
      success: false,
      error: `Error al subir el archivo: ${uploadError.message}`,
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(GPX_BUCKET).getPublicUrl(storagePath);

  const { error: updateError } = await supabase
    .from("rutas")
    .update({ gpx_url: publicUrl })
    .eq("id", rutaId)
    .eq("user_id", userId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath("/");
  revalidatePath("/rutas");

  return { success: true, rutaId };
}
