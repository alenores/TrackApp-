import { notFound } from "next/navigation";
import { fetchZonaById } from "@/lib/zonas/queries";
import { NuevaSectorForm } from "@/components/zonas/nueva-sector-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NuevoSectorPage({ params }: Props) {
  const { id } = await params;
  const zona = await fetchZonaById(id);
  if (!zona) notFound();

  return <NuevaSectorForm zonaId={id} zonaNombre={zona.nombre} />;
}
