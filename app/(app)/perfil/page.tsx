import { getUserDisplayName, getUserStoredNombre } from "@/lib/auth/profile";
import { getAuthUser } from "@/lib/auth/session";
import { PerfilForm } from "@/components/perfil/perfil-form";

export default async function PerfilPage() {
  const user = await getAuthUser();

  return (
    <PerfilForm
      initialNombre={getUserStoredNombre(user)}
      displayNombre={getUserDisplayName(user)}
      email={user?.email ?? ""}
    />
  );
}
