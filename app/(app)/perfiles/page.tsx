import { getUserDisplayName, getUserStoredNombre } from "@/lib/auth/profile";
import { fetchAllDirectoryUsers } from "@/lib/auth/directory";
import { traerMiPerfil } from "@/lib/perfiles/datos";
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
    traerMiPerfil().then((perfil) => perfil?.avatarUrl ?? null),
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
