import { getAuthUser } from "@/lib/auth/session";
import { AppReadyMarker } from "@/components/layout/app-ready-marker";
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
  const usuario = await getAuthUser();

  return (
    <>
      <AppReadyMarker />
      <ZonaDetalle zonaId={Number(id)} miPerfilId={usuario?.id ?? null} />
    </>
  );
}
