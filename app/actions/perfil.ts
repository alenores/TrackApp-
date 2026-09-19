"use server";

import { revalidatePath } from "next/cache";
import {
  DEPOSITO_DE_FOTOS,
  revisarLaFoto,
  rutaDeLaFoto,
} from "@/lib/cuenta/fotos";
import { traerUsuario } from "@/lib/cuenta/sesion";
import { traducirErrorDeBase } from "@/lib/datos/resultado";
import { crearClienteEnElServidor } from "@/lib/supabase/servidor";

/**
 * Guardar los datos de la cuenta.
 *
 * El nombre y la foto se guardan en la tabla `perfiles`. **Antes esto escribía
 * en `profiles`, que es de la app vieja y no existe**, así que guardar la foto
 * fallaba siempre.
 *
 * La foto llega ya convertida a WebP y comprimida por el módulo compartido de
 * fotos; acá se vuelve a revisar igual, porque una acción del servidor no puede
 * confiar en que la pantalla hizo su parte.
 */

export type ResultadoDeEditarPerfil =
  | { success: true; emailConfirmationRequired: boolean }
  | { success: false; error: string };

export async function editarPerfil(input: {
  nombre: string;
  email: string;
  avatarFile?: File | null;
}): Promise<ResultadoDeEditarPerfil> {
  const nombre = input.nombre.trim();
  const email = input.email.trim().toLowerCase();

  if (!nombre) {
    return { success: false, error: "Escribí tu nombre: no puede quedar vacío." };
  }

  if (nombre.length > 80) {
    return {
      success: false,
      error: "El nombre es muy largo. Máximo 80 letras.",
    };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      success: false,
      error: "Ese email no se entiende. Fijate que tenga arroba y punto.",
    };
  }

  const usuario = await traerUsuario();

  if (!usuario) {
    return { success: false, error: "Entrá con tu cuenta para poder editarla." };
  }

  if (input.avatarFile) {
    const problema = revisarLaFoto(input.avatarFile);
    if (problema) return { success: false, error: problema };
  }

  const supabase = await crearClienteEnElServidor();
  const emailDeAhora = (usuario.email ?? "").toLowerCase();
  const cambioElEmail = email !== emailDeAhora;

  const { error: errorDeCuenta } = await supabase.auth.updateUser({
    ...(cambioElEmail ? { email } : {}),
    data: { nombre },
  });

  if (errorDeCuenta) {
    return { success: false, error: errorDeCuenta.message };
  }

  let avatarUrl: string | null = null;

  if (input.avatarFile) {
    const donde = rutaDeLaFoto(usuario.id);
    const bytes = await input.avatarFile.arrayBuffer();

    const { error: errorAlSubir } = await supabase.storage
      .from(DEPOSITO_DE_FOTOS)
      .upload(donde, bytes, {
        contentType: input.avatarFile.type,
        upsert: true,
      });

    if (errorAlSubir) {
      return {
        success: false,
        error: `No se pudo subir la foto: ${errorAlSubir.message}`,
      };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(DEPOSITO_DE_FOTOS).getPublicUrl(donde);

    // El agregado del final obliga al navegador a bajar la foto nueva: la
    // dirección es siempre la misma y si no, sigue mostrando la anterior.
    avatarUrl = `${publicUrl}?v=${Date.now()}`;
  }

  const { error: errorDelPerfil } = await supabase
    .from("perfiles")
    .update({
      nombre,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq("id", usuario.id)
    .is("eliminado_en", null);

  if (errorDelPerfil) {
    return {
      success: false,
      error: avatarUrl
        ? `La foto se subió pero no se pudo guardar en tu perfil: ${traducirErrorDeBase(errorDelPerfil.message)}`
        : traducirErrorDeBase(errorDelPerfil.message),
    };
  }

  revalidatePath("/", "layout");
  revalidatePath("/perfiles");
  revalidatePath("/perfil");

  return { success: true, emailConfirmationRequired: cambioElEmail };
}
