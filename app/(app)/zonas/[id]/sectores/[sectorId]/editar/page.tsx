import { traerUsuario } from "@/lib/cuenta/sesion";
import { AppReadyMarker } from "@/components/layout/app-ready-marker";
import { EditarSectorForm } from "@/components/zonas/editar-sector-form";

type Props = {
  params: Promise<{ id: string; sectorId: string }>;
};

export default async function PaginaDeEditarSector({ params }: Props) {
  const { id, sectorId } = await params;
  const usuario = await traerUsuario();

  return (
    <>
      <AppReadyMarker />
      <EditarSectorForm
        zonaId={Number(id)}
        sectorId={Number(sectorId)}
        miPerfilId={usuario?.id ?? null}
      />
    </>
  );
}
