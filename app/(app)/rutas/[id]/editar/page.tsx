import { getAuthUser } from "@/lib/auth/session";
import { AppReadyMarker } from "@/components/layout/app-ready-marker";
import { EditarRutaForm } from "@/components/rutas/editar-ruta-form";

/**
 * Editar una ruta.
 *
 * Como la ficha, dibuja desde lo guardado en el celular: la pantalla se abre
 * al instante y sin depender de que llegue la respuesta de la base.
 */

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PaginaDeEditarRuta({ params }: Props) {
  const { id } = await params;
  const usuario = await getAuthUser();

  return (
    <>
      <AppReadyMarker />
      <EditarRutaForm rutaId={Number(id)} miPerfilId={usuario?.id ?? null} />
    </>
  );
}
