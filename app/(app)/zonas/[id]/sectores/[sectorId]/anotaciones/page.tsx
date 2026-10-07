import { PantallaDeAnotaciones } from "@/components/anotaciones/pantalla-de-anotaciones";
import { traerMiPerfil } from "@/lib/perfiles/datos";

export default async function AnotacionesDelSector({
  params,
}: {
  params: Promise<{ id: string; sectorId: string }>;
}) {
  const { id, sectorId } = await params;
  const miPerfil = await traerMiPerfil();

  return (
    <PantallaDeAnotaciones zonaId={Number(id)} sectorId={Number(sectorId)} categoria={miPerfil?.categoria ?? "normal"} miPerfilId={miPerfil?.id ?? null} />
  );
}
