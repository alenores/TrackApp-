import { Tarjeta } from "@/components/ui/tarjeta";
import type { Perfil } from "@/types/database";
import { FormularioDePerfil } from "@/components/perfil/formulario-de-perfil";
import { TarjetaDePerfil } from "@/components/perfil/tarjeta-de-perfil";

type PerfilesViewProps = {
  currentUserId: string;
  initialNombre: string;
  displayNombre: string;
  email: string;
  avatarUrl?: string | null;
  portadaUrl?: string | null;
  perfiles: Perfil[];
  /** Cuando la lista quedó corta, se dice. Nunca se muestra incompleta callado. */
  avisoDeListaIncompleta?: string | null;
};

export function PantallaDePerfiles({
  currentUserId,
  initialNombre,
  displayNombre,
  email,
  avatarUrl,
  portadaUrl,
  perfiles,
  avisoDeListaIncompleta = null,
}: PerfilesViewProps) {
  const losDemas = perfiles.filter((perfil) => perfil.id !== currentUserId);

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
        portadaUrl={portadaUrl}
      />

      {avisoDeListaIncompleta ? (
        <Tarjeta franja="ambar">
          <p role="alert" className="text-sm leading-6 text-ambar-texto">
            La lista de usuarios quedó incompleta: {avisoDeListaIncompleta}. Lo
            que ves acá abajo puede no ser todo.
          </p>
        </Tarjeta>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-texto-suave">
          {losDemas.length === 0
            ? "Los demás usuarios"
            : `Los demás usuarios (${losDemas.length})`}
        </h2>

        {losDemas.length === 0 ? (
          <Tarjeta>
            <p className="text-sm leading-6 text-texto-suave">
              Por ahora sos el único usuario de la app.
            </p>
          </Tarjeta>
        ) : (
          <ul className="space-y-3">
            {losDemas.map((perfil) => (
              <li key={perfil.id}>
                <TarjetaDePerfil perfil={perfil} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
