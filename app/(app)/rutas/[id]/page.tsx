import { traerUsuario } from "@/lib/cuenta/sesion";
import { AppReadyMarker } from "@/components/layout/app-ready-marker";
import { RutaDetalle } from "@/components/rutas/ruta-detalle";

/**
 * La ficha de una ruta.
 *
 * **Acá no se consulta la base.** Todo lo dibuja la pantalla desde lo que hay
 * guardado en el celular, así la ficha se abre igual sin señal, que es justo
 * donde hace falta leerla.
 */

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PaginaDeRuta({ params }: Props) {
  const { id } = await params;
  const usuario = await traerUsuario();

  return (
    <>
      <AppReadyMarker />
      <RutaDetalle rutaId={Number(id)} miPerfilId={usuario?.id ?? null} />
    </>
  );
}
