import { createClient } from "@/lib/supabase/server";
import { getUserDisplayName } from "@/lib/auth/profile";
import { fetchAllRutas } from "@/lib/rutas/queries";
import { RutaList } from "@/components/rutas/ruta-list";

export default async function RutasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rutas = await fetchAllRutas();

  return (
    <RutaList
      rutas={rutas}
      currentUserId={user?.id ?? null}
      currentUserName={getUserDisplayName(user)}
      title="Todas las rutas"
      showNewRouteFab
    />
  );
}
