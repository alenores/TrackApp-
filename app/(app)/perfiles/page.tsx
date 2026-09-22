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

  const [perfiles, miPerfil] = await Promise.all([
    traerTodosLosPerfiles(),
    traerMiPerfil(),
  ]);

  return (
    <PantallaDePerfiles
      currentUserId={user.id}
      initialNombre={nombreGuardado(user)}
      displayNombre={nombreParaMostrar(user)}
      email={user.email ?? ""}
      avatarUrl={miPerfil?.avatarUrl ?? null}
      portadaUrl={miPerfil?.portadaUrl ?? null}
      perfiles={perfiles.filas}
      avisoDeListaIncompleta={perfiles.completa ? null : perfiles.motivo}
    />
  );
}
