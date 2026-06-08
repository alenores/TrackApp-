"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatSupabaseError } from "@/lib/supabase/errors";

export type UpdateRutaResult =
  | { success: true }
  | { success: false; error: string };

export async function updateRuta(input: {
  rutaId: string;
  nombre: string;
  descripcion: string | null;
}): Promise<UpdateRutaResult> {
  const trimmedNombre = input.nombre.trim();

  if (!trimmedNombre) {
    return { success: false, error: "El nombre de la ruta es obligatorio." };
  }

  if (trimmedNombre.length > 120) {
    return { success: false, error: "El nombre es demasiado largo." };
  }

  const user = await getAuthUser();

  if (!user?.id) {
    return { success: false, error: "Tenés que iniciar sesión." };
  }

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("rutas")
    .update(
      {
        nombre: trimmedNombre,
        descripcion: input.descripcion?.trim() || null,
      },
      { count: "exact" },
    )
    .eq("id", input.rutaId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: formatSupabaseError(error.message) };
  }

  if (!count) {
    return { success: false, error: "No se encontró la ruta o no tenés permiso." };
  }

  revalidatePath("/");
  revalidatePath("/rutas");
  revalidatePath(`/rutas/${input.rutaId}`);
  revalidatePath(`/rutas/${input.rutaId}/editar`);

  return { success: true };
}
