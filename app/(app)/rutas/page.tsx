import { getUserDisplayName } from "@/lib/auth/profile";
import { getAuthUser } from "@/lib/auth/session";
import { fetchRutasList } from "@/lib/rutas/queries";
import { RutaList } from "@/components/rutas/ruta-list";

export default async function RutasPage() {
  const [user, rutas] = await Promise.all([getAuthUser(), fetchRutasList()]);

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
