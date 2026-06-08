import { getUserDisplayName, getUserStoredNombre } from "@/lib/auth/profile";
import { fetchAllDirectoryUsers } from "@/lib/auth/directory";
import { fetchCurrentUserAvatar } from "@/lib/auth/profiles";
import { getAuthUser } from "@/lib/auth/session";
import { PerfilesView } from "@/components/perfil/perfiles-view";

export const dynamic = "force-dynamic";

export default async function PerfilesPage() {
  const user = await getAuthUser();

  if (!user?.id) {
    return null;
  }

  const [users, avatarUrl] = await Promise.all([
    fetchAllDirectoryUsers(),
    fetchCurrentUserAvatar(user.id),
  ]);

  return (
    <PerfilesView
      currentUserId={user.id}
      initialNombre={getUserStoredNombre(user)}
      displayNombre={getUserDisplayName(user)}
      email={user.email ?? ""}
      avatarUrl={avatarUrl}
      users={users}
    />
  );
}
