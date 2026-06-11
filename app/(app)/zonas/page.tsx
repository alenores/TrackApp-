import { getUserDisplayName } from "@/lib/auth/profile";
import { getAuthUser } from "@/lib/auth/session";
import { fetchAvatarUrlsByUserIds } from "@/lib/auth/profiles";
import { fetchZonasList } from "@/lib/zonas/queries";
import { AppReadyMarker } from "@/components/layout/app-ready-marker";
import { ZonaList } from "@/components/zonas/zona-list";

export default async function ZonasPage() {
  const [user, zonas] = await Promise.all([getAuthUser(), fetchZonasList()]);
  const userIds = [...new Set(zonas.map((z) => z.user_id))];
  const avatarByUserId = await fetchAvatarUrlsByUserIds(userIds);

  return (
    <>
      <AppReadyMarker />
      <ZonaList
        zonas={zonas}
        currentUserId={user?.id ?? null}
        currentUserName={getUserDisplayName(user)}
        avatarByUserId={avatarByUserId}
      />
    </>
  );
}
