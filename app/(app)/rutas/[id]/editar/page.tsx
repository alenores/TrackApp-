import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/session";
import { fetchRutaById } from "@/lib/rutas/queries";
import { EditarRutaForm } from "@/components/rutas/editar-ruta-form";

type EditarRutaPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarRutaPage({ params }: EditarRutaPageProps) {
  const { id } = await params;
  const [user, ruta] = await Promise.all([getAuthUser(), fetchRutaById(id)]);

  if (!ruta) {
    notFound();
  }

  if (!user || user.id !== ruta.user_id) {
    redirect(`/rutas/${id}`);
  }

  return (
    <EditarRutaForm
      rutaId={ruta.id}
      initialNombre={ruta.nombre}
      initialDescripcion={ruta.descripcion ?? ""}
      initialActividades={ruta.actividades}
    />
  );
}
