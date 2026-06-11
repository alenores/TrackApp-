import { notFound } from "next/navigation";
import { getAuthUser } from "@/lib/auth/session";
import { fetchZonaById } from "@/lib/zonas/queries";
import { EditarZonaForm } from "@/components/zonas/editar-zona-form";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditarZonaPage({ params }: Props) {
  const { id } = await params;
  const [user, zona] = await Promise.all([getAuthUser(), fetchZonaById(id)]);
  if (!zona) notFound();
  if (user?.id !== zona.user_id) redirect(`/zonas/${id}`);

  return <EditarZonaForm zona={zona} />;
}
