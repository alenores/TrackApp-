import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { FormularioDeEditarSector } from "@/components/zonas/formulario-de-editar-sector";

type Props = {
  params: Promise<{ id: string; sectorId: string }>;
};

export default async function PaginaDeEditarSector({ params }: Props) {
  const { id, sectorId } = await params;

  return (
    <>
      <MarcaDeAppLista />
      <FormularioDeEditarSector
        zonaId={Number(id)}
        sectorId={Number(sectorId)}
      />
    </>
  );
}
