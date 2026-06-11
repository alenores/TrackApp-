import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/session";
import { fetchZonaById, fetchSectorById } from "@/lib/zonas/queries";
import { EditarSectorForm } from "@/components/zonas/editar-sector-form";

type Props = {
  params: Promise<{ id: string; sectorId: string }>;
};

export default async function EditarSectorPage({ params }: Props) {
  const { id, sectorId } = await params;
  const [user, sector, zona] = await Promise.all([
    getAuthUser(),
    fetchSectorById(sectorId),
    fetchZonaById(id),
  ]);

  if (!sector || !zona) notFound();
  if (user?.id !== sector.user_id) redirect(`/zonas/${id}`);

  return <EditarSectorForm sector={sector} zonaNombre={zona.nombre} />;
}
