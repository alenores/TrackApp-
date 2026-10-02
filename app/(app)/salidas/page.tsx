import type { Metadata } from "next";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { PantallaDeSalidas } from "@/components/salidas/pantalla-de-salidas";
import { traerUsuario } from "@/lib/cuenta/sesion";
import { leerPagina, traerSalidas } from "@/lib/salidas/datos";

export const metadata: Metadata = { title: "Salidas" };
export const dynamic = "force-dynamic";

/**
 * Las salidas de todos. **Solo con internet**: se arma en el servidor cada vez
 * que se abre y no se guarda en el celular.
 */
export default async function SalidasPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string | string[] }>;
}) {
  const parametros = await searchParams;
  const [usuario, resultado] = await Promise.all([
    traerUsuario(),
    traerSalidas(leerPagina(parametros.pagina)),
  ]);

  return (
    <>
      <MarcaDeAppLista />
      <PantallaDeSalidas miPerfilId={usuario?.id ?? null} resultado={resultado} />
    </>
  );
}
