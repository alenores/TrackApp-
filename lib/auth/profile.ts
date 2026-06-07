import type { User } from "@supabase/supabase-js";

export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) return "Usuario";

  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const nombre =
    typeof metadata?.nombre === "string" ? metadata.nombre.trim() : "";

  if (nombre) return nombre;

  const fullName =
    typeof metadata?.full_name === "string" ? metadata.full_name.trim() : "";

  if (fullName) return fullName;

  if (user.email) return user.email.split("@")[0] ?? "Usuario";

  return "Usuario";
}

export function getUserStoredNombre(user: User | null | undefined): string {
  if (!user) return "";

  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const nombre =
    typeof metadata?.nombre === "string" ? metadata.nombre.trim() : "";

  if (nombre) return nombre;

  const fullName =
    typeof metadata?.full_name === "string" ? metadata.full_name.trim() : "";

  return fullName;
}
