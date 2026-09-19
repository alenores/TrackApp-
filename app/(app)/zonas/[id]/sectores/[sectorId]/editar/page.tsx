import { getAuthUser } from "@/lib/auth/session";
import { AppReadyMarker } from "@/components/layout/app-ready-marker";
import { EditarSectorForm } from "@/components/zonas/editar-sector-form";

type Props = {
  params: Promise<{ id: string; sectorId: string }>;
};

export default async function PaginaDeEditarSector({ params }: Props) {
  const { id, sectorId } = await params;
  const usuario = await getAuthUser();

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
