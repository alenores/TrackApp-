import type { DirectoryUser } from "@/lib/cuenta/directorio";
import { FormularioDePerfil } from "@/components/perfil/formulario-de-perfil";
import { TarjetaDePerfil } from "@/components/perfil/tarjeta-de-perfil";

type PerfilesViewProps = {
  currentUserId: string;
  initialNombre: string;
  displayNombre: string;
  email: string;
  avatarUrl?: string | null;
  users: DirectoryUser[];
};

export function PantallaDePerfiles({
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
        <h1 className="text-xl font-bold text-texto">Perfiles</h1>
        <p className="mt-1 text-sm text-texto-suave">
          Usuarios de TrackApp y tu cuenta.
        </p>
      </div>

      <FormularioDePerfil
        initialNombre={initialNombre}
        displayNombre={displayNombre}
        email={email}
        avatarUrl={avatarUrl}
      />

      {otherUsers.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-texto-suave">
            Todos los usuarios
          </h2>
          <ul className="space-y-3">
            {otherUsers.map((user) => (
              <li key={user.id}>
                <TarjetaDePerfil user={user} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
