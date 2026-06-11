"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatSupabaseError } from "@/lib/supabase/errors";

export type DeleteSectorResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteSector(
  sectorId: string,
  zonaId: string,
): Promise<DeleteSectorResult> {
  const user = await getAuthUser();
  if (!user?.id) {
    return { success: false, error: "Tenés que iniciar sesión." };
  }

  const supabase = await createClient();

  const { error, count } = await supabase
    .from("sectores")
    .delete({ count: "exact" })
    .eq("id", sectorId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: formatSupabaseError(error.message) };
  }

  if (!count) {
    return {
      success: false,
      error: "No se encontró el sector o no tenés permiso.",
    };
  }

  revalidatePath(`/zonas/${zonaId}`);

  await supabase
    .from("novedades")
    .insert({ descripcion: `Sector eliminado: ${sectorId}` });

  return { success: true };
}
