"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type UpdateProfileResult =
  | { success: true; emailConfirmationRequired: boolean }
  | { success: false; error: string };

export async function updateProfile(input: {
  nombre: string;
  email: string;
}): Promise<UpdateProfileResult> {
  const trimmedNombre = input.nombre.trim();
  const trimmedEmail = input.email.trim().toLowerCase();

  if (!trimmedNombre) {
    return { success: false, error: "El nombre no puede estar vacío." };
  }

  if (trimmedNombre.length > 80) {
    return { success: false, error: "El nombre es demasiado largo." };
  }

  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { success: false, error: "Ingresá un email válido." };
  }

  const user = await getAuthUser();

  if (!user) {
    return { success: false, error: "Tenés que iniciar sesión." };
  }

  const supabase = await createClient();
  const currentEmail = (user.email ?? "").toLowerCase();
  const emailChanged = trimmedEmail !== currentEmail;

  const { error } = await supabase.auth.updateUser({
    ...(emailChanged ? { email: trimmedEmail } : {}),
    data: { nombre: trimmedNombre },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  revalidatePath("/perfil");

  return { success: true, emailConfirmationRequired: emailChanged };
}
