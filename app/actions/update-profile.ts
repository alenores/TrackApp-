"use server";

import { revalidatePath } from "next/cache";
import {
  DEPOSITO_DE_FOTOS,
  rutaDeLaFoto,
  revisarLaFoto,
} from "@/lib/cuenta/fotos";
import { traerUsuario } from "@/lib/cuenta/sesion";
import { crearClienteEnElServidor } from "@/lib/supabase/servidor";

export type UpdateProfileResult =
  | { success: true; emailConfirmationRequired: boolean }
  | { success: false; error: string };

export async function updateProfile(input: {
  nombre: string;
  email: string;
  avatarFile?: File | null;
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

  const user = await traerUsuario();

  if (!user) {
    return { success: false, error: "Tenés que iniciar sesión." };
  }

  if (input.avatarFile) {
    const avatarError = revisarLaFoto(input.avatarFile);
    if (avatarError) {
      return { success: false, error: avatarError };
    }
  }

  const supabase = await crearClienteEnElServidor();
  const currentEmail = (user.email ?? "").toLowerCase();
  const emailChanged = trimmedEmail !== currentEmail;

  const { error } = await supabase.auth.updateUser({
    ...(emailChanged ? { email: trimmedEmail } : {}),
    data: { nombre: trimmedNombre },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (input.avatarFile) {
    const storagePath = rutaDeLaFoto(user.id);
    const fileBuffer = await input.avatarFile.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(DEPOSITO_DE_FOTOS)
      .upload(storagePath, fileBuffer, {
        contentType: input.avatarFile.type,
        upsert: true,
      });

    if (uploadError) {
      return {
        success: false,
        error: `No se pudo subir la foto: ${uploadError.message}`,
      };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(DEPOSITO_DE_FOTOS).getPublicUrl(storagePath);

    const avatarUrl = `${publicUrl}?v=${Date.now()}`;

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        nombre: trimmedNombre,
        avatar_url: avatarUrl,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      return {
        success: false,
        error: "La foto se subió pero no se pudo guardar en el perfil.",
      };
    }
  }

  revalidatePath("/", "layout");
  revalidatePath("/perfiles");
  revalidatePath("/perfil");

  return { success: true, emailConfirmationRequired: emailChanged };
}
