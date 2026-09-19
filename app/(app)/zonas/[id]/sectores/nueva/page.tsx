import { AppReadyMarker } from "@/components/layout/app-ready-marker";
import { NuevaSectorForm } from "@/components/zonas/nueva-sector-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PaginaDeNuevoSector({ params }: Props) {
  const { id } = await params;

  return (
    <>
      <AppReadyMarker />
      <NuevaSectorForm zonaId={Number(id)} />
    </>
  );
}
