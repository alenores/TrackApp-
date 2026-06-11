"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatSupabaseError } from "@/lib/supabase/errors";

export type DeleteZonaResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteZona(zonaId: string): Promise<DeleteZonaResult> {
  const user = await getAuthUser();
  if (!user?.id) {
    return { success: false, error: "Tenés que iniciar sesión." };
  }

  const supabase = await createClient();

  const { error, count } = await supabase
    .from("zonas")
    .delete({ count: "exact" })
    .eq("id", zonaId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: formatSupabaseError(error.message) };
  }

  if (!count) {
    return {
      success: false,
      error: "No se encontró la zona o no tenés permiso.",
    };
  }

  revalidatePath("/zonas");

  await supabase
    .from("novedades")
    .insert({ descripcion: `Zona eliminada: ${zonaId}` });

  return { success: true };
}
