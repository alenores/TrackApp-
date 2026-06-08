import { getUserDisplayName, getUserStoredNombre } from "@/lib/auth/profile";
import { fetchCurrentUserAvatar } from "@/lib/auth/profiles";
import { getAuthUser } from "@/lib/auth/session";
import { PerfilForm } from "@/components/perfil/perfil-form";

export default async function PerfilPage() {
  const user = await getAuthUser();
  const avatarUrl = user?.id ? await fetchCurrentUserAvatar(user.id) : null;

  return (
    <PerfilForm
      initialNombre={getUserStoredNombre(user)}
      displayNombre={getUserDisplayName(user)}
      email={user?.email ?? ""}
      avatarUrl={avatarUrl}
    />
  );
}
