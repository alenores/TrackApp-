"use server";

import { revalidatePath } from "next/cache";
import { getUserDisplayName } from "@/lib/auth/profile";
import { getAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatSupabaseError } from "@/lib/supabase/errors";

type SaveZonaInput = {
  provincia: string;
  nombre: string;
  descripcion: string | null;
};

export type SaveZonaResult =
  | { success: true; zonaId: string }
  | { success: false; error: string };

export async function saveZona(input: SaveZonaInput): Promise<SaveZonaResult> {
  const user = await getAuthUser();
  if (!user?.id) {
    return { success: false, error: "Tenés que iniciar sesión." };
  }

  const supabase = await createClient();
  const zonaId = crypto.randomUUID();
  const base = {
    id: zonaId,
    user_id: user.id,
    provincia: input.provincia.trim(),
    nombre: input.nombre.trim(),
    descripcion: input.descripcion?.trim() || null,
  };

  let insertError = (
    await supabase
      .from("zonas")
      .insert({ ...base, subido_por_nombre: getUserDisplayName(user) })
  ).error;

  if (insertError?.message.includes("subido_por_nombre")) {
    insertError = (await supabase.from("zonas").insert(base)).error;
  }

  if (insertError) {
    return { success: false, error: formatSupabaseError(insertError.message) };
  }

  revalidatePath("/zonas");

  await supabase
    .from("novedades")
    .insert({ descripcion: `Zona creada: ${input.nombre.trim()}` });

  return { success: true, zonaId };
}
