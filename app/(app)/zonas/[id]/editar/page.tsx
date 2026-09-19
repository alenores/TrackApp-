import { traerUsuario } from "@/lib/cuenta/sesion";
import { AppReadyMarker } from "@/components/layout/app-ready-marker";
import { EditarZonaForm } from "@/components/zonas/editar-zona-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PaginaDeEditarZona({ params }: Props) {
  const { id } = await params;
  const usuario = await traerUsuario();

  return (
    <>
      <AppReadyMarker />
      <EditarZonaForm zonaId={Number(id)} miPerfilId={usuario?.id ?? null} />
    </>
  );
}
