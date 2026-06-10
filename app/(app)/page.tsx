import { getUserDisplayName } from "@/lib/auth/profile";
import { getAuthUser } from "@/lib/auth/session";
import { fetchUploaderAvatarsForRutas } from "@/lib/rutas/avatars";
import { fetchRutasList } from "@/lib/rutas/queries";
import { AppReadyMarker } from "@/components/layout/app-ready-marker";
import { RutaList } from "@/components/rutas/ruta-list";

export default async function HomePage() {
  const [user, rutas] = await Promise.all([getAuthUser(), fetchRutasList()]);
  const avatarByUserId = await fetchUploaderAvatarsForRutas(rutas);

  return (
    <>
      <AppReadyMarker />
      <RutaList
        rutas={rutas}
        currentUserId={user?.id ?? null}
        currentUserName={getUserDisplayName(user)}
        avatarByUserId={avatarByUserId}
        showNewRouteFab
      />
    </>
  );
}
