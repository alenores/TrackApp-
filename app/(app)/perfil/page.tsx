import { createClient } from "@/lib/supabase/server";
import { getUserDisplayName, getUserStoredNombre } from "@/lib/auth/profile";
import { PerfilForm } from "@/components/perfil/perfil-form";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <PerfilForm
      initialNombre={getUserStoredNombre(user)}
      displayNombre={getUserDisplayName(user)}
      email={user?.email ?? ""}
    />
  );
}
