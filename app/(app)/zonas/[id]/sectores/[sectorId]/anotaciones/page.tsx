import { PantallaDeAnotaciones } from "@/components/anotaciones/pantalla-de-anotaciones";

export default async function AnotacionesDelSector({
  params,
}: {
  params: Promise<{ id: string; sectorId: string }>;
}) {
  const { id, sectorId } = await params;

  return (
    <PantallaDeAnotaciones zonaId={Number(id)} sectorId={Number(sectorId)} />
  );
}
