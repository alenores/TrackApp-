import type { DirectoryUser } from "@/lib/auth/directory";
import { PerfilForm } from "@/components/perfil/perfil-form";
import { PerfilUsuarioCard } from "@/components/perfil/perfil-usuario-card";

type PerfilesViewProps = {
  currentUserId: string;
  initialNombre: string;
  displayNombre: string;
  email: string;
  avatarUrl?: string | null;
  users: DirectoryUser[];
};

export function PerfilesView({
  currentUserId,
  initialNombre,
  displayNombre,
  email,
  avatarUrl,
  users,
}: PerfilesViewProps) {
  const otherUsers = users.filter((user) => user.id !== currentUserId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Perfiles</h1>
        <p className="mt-1 text-sm text-muted">
          Usuarios de TrackApp y tu cuenta.
        </p>
      </div>

      <PerfilForm
        initialNombre={initialNombre}
        displayNombre={displayNombre}
        email={email}
        avatarUrl={avatarUrl}
      />

      {otherUsers.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Todos los usuarios
          </h2>
          <ul className="space-y-3">
            {otherUsers.map((user) => (
              <li key={user.id}>
                <PerfilUsuarioCard user={user} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
