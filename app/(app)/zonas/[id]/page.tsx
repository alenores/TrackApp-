import { traerUsuario } from "@/lib/cuenta/sesion";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { ZonaDetalle } from "@/components/zonas/zona-detalle";

/**
 * Una zona con sus sectores.
 *
 * Dibuja desde lo guardado en el celular, así se abre igual sin señal.
 */

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PaginaDeZona({ params }: Props) {
  const { id } = await params;
  const usuario = await traerUsuario();

  return (
    <>
      <MarcaDeAppLista />
      <ZonaDetalle zonaId={Number(id)} miPerfilId={usuario?.id ?? null} />
    </>
  );
}
