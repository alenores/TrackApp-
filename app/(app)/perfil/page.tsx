import { createClient } from "@/lib/supabase/server";
import { getUserDisplayName } from "@/lib/auth/profile";
import { Card } from "@/components/ui/card";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nombre = getUserDisplayName(user);

  return (
    <Card accent>
      <h1 className="text-xl font-bold text-foreground">Mi perfil</h1>
      <div className="mt-4 space-y-1">
        <p className="text-lg font-semibold text-foreground">{nombre}</p>
        <p className="text-sm text-muted">{user?.email ?? "—"}</p>
      </div>
    </Card>
  );
}
