import { createClient } from "@/lib/supabase/server";

export type DirectoryUser = {
  id: string;
  nombre: string;
  avatar_url: string | null;
};

function fallbackNombre(userId: string): string {
  return `Usuario · ${userId.slice(0, 8)}`;
}

export async function fetchAllDirectoryUsers(): Promise<DirectoryUser[]> {
  const supabase = await createClient();

  const [profilesResult, rutasResult] = await Promise.all([
    supabase.from("profiles").select("id, nombre, avatar_url"),
    supabase.from("rutas").select("user_id, subido_por_nombre"),
  ]);

  const users = new Map<string, DirectoryUser>();

  if (profilesResult.data) {
    for (const row of profilesResult.data as Array<{
      id: string;
      nombre: string | null;
      avatar_url: string | null;
    }>) {
      users.set(row.id, {
        id: row.id,
        nombre: row.nombre?.trim() || fallbackNombre(row.id),
        avatar_url: row.avatar_url?.trim() || null,
      });
    }
  }

  if (rutasResult.data) {
    for (const row of rutasResult.data as Array<{
      user_id: string;
      subido_por_nombre: string | null;
    }>) {
      const existing = users.get(row.user_id);
      const routeName = row.subido_por_nombre?.trim();

      if (!existing) {
        users.set(row.user_id, {
          id: row.user_id,
          nombre: routeName || fallbackNombre(row.user_id),
          avatar_url: null,
        });
        continue;
      }

      if (
        routeName &&
        existing.nombre === fallbackNombre(row.user_id)
      ) {
        existing.nombre = routeName;
      }
    }
  }

  return [...users.values()].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es"),
  );
}
