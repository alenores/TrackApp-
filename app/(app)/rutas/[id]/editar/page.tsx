import { traerUsuario } from "@/lib/cuenta/sesion";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { FormularioDeEditarRuta } from "@/components/rutas/formulario-de-editar-ruta";

/**
 * Editar una ruta.
 *
 * Como la ficha, dibuja desde lo guardado en el celular: la pantalla se abre
 * al instante y sin depender de que llegue la respuesta de la base.
 */

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PaginaDeEditarRuta({ params }: Props) {
  const { id } = await params;
  const usuario = await traerUsuario();

  return (
    <>
      <MarcaDeAppLista />
      <FormularioDeEditarRuta rutaId={Number(id)} miPerfilId={usuario?.id ?? null} />
    </>
  );
}
