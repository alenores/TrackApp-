import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Card accent>
      <h1 className="text-xl font-bold text-foreground">Mi perfil</h1>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-muted">Email</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {user?.email ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">ID de usuario</dt>
          <dd className="mt-0.5 break-all font-mono text-xs text-slate-300">
            {user?.id ?? "—"}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
