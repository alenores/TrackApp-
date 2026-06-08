import { getUserDisplayName } from "@/lib/auth/profile";
import { getAuthUser } from "@/lib/auth/session";
import { fetchRutasList } from "@/lib/rutas/queries";
import { RutaList } from "@/components/rutas/ruta-list";

export default async function HomePage() {
  const [user, rutas] = await Promise.all([getAuthUser(), fetchRutasList()]);

  return (
    <RutaList
      rutas={rutas}
      currentUserId={user?.id ?? null}
      currentUserName={getUserDisplayName(user)}
      showNewRouteFab
    />
  );
}
