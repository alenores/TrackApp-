"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getGpxStoragePath } from "@/lib/gpx";
import { formatSupabaseError } from "@/lib/supabase/errors";

const GPX_BUCKET = "gpx-files";

export type DeleteRutaResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteRuta(rutaId: string): Promise<DeleteRutaResult> {
  const user = await getAuthUser();

  if (!user?.id) {
    return { success: false, error: "Tenés que iniciar sesión." };
  }

  const supabase = await createClient();
  const storagePath = getGpxStoragePath(user.id, rutaId);

  await supabase.storage.from(GPX_BUCKET).remove([storagePath]);

  const { error: deleteError, count } = await supabase
    .from("rutas")
    .delete({ count: "exact" })
    .eq("id", rutaId)
    .eq("user_id", user.id);

  if (deleteError) {
    return { success: false, error: formatSupabaseError(deleteError.message) };
  }

  if (!count) {
    return { success: false, error: "No se encontró la ruta o no tenés permiso." };
  }

  revalidatePath("/");
  revalidatePath("/rutas");
  revalidatePath(`/rutas/${rutaId}`);

  return { success: true };
}
