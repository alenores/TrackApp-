import { notFound } from "next/navigation";
import { fetchRutaById } from "@/lib/rutas/queries";
import { NavegacionView } from "@/components/navigation/navegacion-view";

type NavegacionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function NavegacionPage({ params }: NavegacionPageProps) {
  const { id } = await params;
  const ruta = await fetchRutaById(id);

  const onlineRuta =
    ruta?.geojson && ruta.bbox
      ? {
          nombre: ruta.nombre,
          geojson: ruta.geojson,
          bbox: ruta.bbox,
        }
      : null;

  if (!onlineRuta) {
    notFound();
  }

  return <NavegacionView rutaId={id} onlineRuta={onlineRuta} />;
}
