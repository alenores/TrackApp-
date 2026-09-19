import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { FormularioDeNuevoSector } from "@/components/zonas/formulario-de-nuevo-sector";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PaginaDeNuevoSector({ params }: Props) {
  const { id } = await params;

  return (
    <>
      <MarcaDeAppLista />
      <FormularioDeNuevoSector zonaId={Number(id)} />
    </>
  );
}
