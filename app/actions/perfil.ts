"use server";

import { revalidatePath } from "next/cache";
import {
  DEPOSITO_DE_FOTOS,
  revisarLaFoto,
  rutaDeLaFoto,
} from "@/lib/cuenta/fotos";
import { traerUsuario } from "@/lib/cuenta/sesion";
import {
  traducirErrorDeBase,
  traducirErrorDeLaCuenta,
} from "@/lib/datos/resultado";
import { crearClienteEnElServidor } from "@/lib/supabase/servidor";

/**
 * Guardar los datos de la cuenta.
 *
 * El nombre y la foto se guardan en la tabla `perfiles`, y en ningún otro lado.
 * **El nombre no se copia a los datos de la cuenta**: sería el mismo dato en dos
 * lugares, y esa copia de más llegó a romper el guardado entero.
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

  /**
   * Al sistema de cuentas se le habla **solo si cambió el email**.
   *
   * Antes se le mandaba además el nombre, que ya vive en la tabla de perfiles y
   * que **nadie lee nunca** de la cuenta: el mismo dato en dos lugares, y una
   * escritura de más que, al fallar, frenaba todo el guardado. El usuario veía
   * un error en inglés y se quedaba sin nombre y sin foto.
   */
  if (cambioElEmail) {
    const { error: errorDeCuenta } = await supabase.auth.updateUser({ email });

    if (errorDeCuenta) {
      return {
        success: false,
        error: traducirErrorDeLaCuenta(errorDeCuenta.message),
      };
    }
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
