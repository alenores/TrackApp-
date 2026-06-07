"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type UpdateProfileNameResult =
  | { success: true }
  | { success: false; error: string };

export async function updateProfileName(
  nombre: string,
): Promise<UpdateProfileNameResult> {
  const trimmed = nombre.trim();

  if (!trimmed) {
    return { success: false, error: "El nombre no puede estar vacío." };
  }

  if (trimmed.length > 80) {
    return { success: false, error: "El nombre es demasiado largo." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Tenés que iniciar sesión." };
  }

  const { error } = await supabase.auth.updateUser({
    data: { nombre: trimmed },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  revalidatePath("/perfil");

  return { success: true };
}
