import type { User } from "@supabase/supabase-js";
import { getUserDisplayName, getUserStoredNombre } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

function resolveNombre(user: User): string {
  const stored = getUserStoredNombre(user);
  if (stored) {
    return stored;
  }

  return getUserDisplayName(user);
}

export async function ensureCurrentUserProfile(user: User): Promise<void> {
  const nombre = resolveNombre(user);
  const supabase = await createClient();

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id, nombre")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    return;
  }

  if (!existing) {
    await supabase.from("profiles").insert({
      id: user.id,
      nombre,
    });
    return;
  }

  if (!existing.nombre?.trim() && nombre) {
    await supabase.from("profiles").update({ nombre }).eq("id", user.id);
  }
}
