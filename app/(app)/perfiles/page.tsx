import { nombreParaMostrar, nombreGuardado } from "@/lib/cuenta/nombre";
import { traerMiPerfil, traerTodosLosPerfiles } from "@/lib/perfiles/datos";
import { traerUsuario } from "@/lib/cuenta/sesion";
import { PantallaDePerfiles } from "@/components/perfil/pantalla-de-perfiles";

export const dynamic = "force-dynamic";

export default async function PerfilesPage() {
  const user = await traerUsuario();

  if (!user?.id) {
    return null;
  }

  const [perfiles, avatarUrl] = await Promise.all([
    traerTodosLosPerfiles(),
    traerMiPerfil().then((perfil) => perfil?.avatarUrl ?? null),
  ]);

  return (
    <PantallaDePerfiles
      currentUserId={user.id}
      initialNombre={nombreGuardado(user)}
      displayNombre={nombreParaMostrar(user)}
      email={user.email ?? ""}
      avatarUrl={avatarUrl}
      perfiles={perfiles.filas}
      avisoDeListaIncompleta={perfiles.completa ? null : perfiles.motivo}
    />
  );
}
