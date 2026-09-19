import { getAuthUser } from "@/lib/auth/session";
import { AppReadyMarker } from "@/components/layout/app-ready-marker";
import { EditarZonaForm } from "@/components/zonas/editar-zona-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PaginaDeEditarZona({ params }: Props) {
  const { id } = await params;
  const usuario = await getAuthUser();

  return (
    <>
      <AppReadyMarker />
      <EditarZonaForm zonaId={Number(id)} miPerfilId={usuario?.id ?? null} />
    </>
  );
}
