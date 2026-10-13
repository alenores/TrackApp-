import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { FormularioDeEditarZona } from "@/components/zonas/formulario-de-editar-zona";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PaginaDeEditarZona({ params }: Props) {
  const { id } = await params;

  return (
    <>
      <MarcaDeAppLista />
      <FormularioDeEditarZona zonaId={Number(id)} />
    </>
  );
}
