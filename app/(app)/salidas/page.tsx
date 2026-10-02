import type { Metadata } from "next";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { PantallaDeSalidas } from "@/components/salidas/pantalla-de-salidas";
import { traerUsuario } from "@/lib/cuenta/sesion";
import { traerTodosLosPerfiles } from "@/lib/perfiles/datos";
import { leerPagina, traerSalidas } from "@/lib/salidas/datos";
import { NOMBRE_SI_NO_TIENE } from "@/lib/salidas/fila";
import { leerFiltros } from "@/lib/salidas/filtros";

export const metadata: Metadata = { title: "Salidas" };
export const dynamic = "force-dynamic";

/**
 * Las salidas de todos, con los filtros que vengan en la dirección. **Solo con
 * internet**: se arma en el servidor cada vez que se abre y no se guarda en el
 * celular.
 */
export default async function SalidasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametros = await searchParams;
  const filtros = leerFiltros(parametros);
  const [usuario, resultado, perfiles] = await Promise.all([
    traerUsuario(),
    traerSalidas(leerPagina(parametros.pagina), filtros),
    traerTodosLosPerfiles(),
  ]);

  return (
    <>
      <MarcaDeAppLista />
      <PantallaDeSalidas
        miPerfilId={usuario?.id ?? null}
        resultado={resultado}
        filtros={filtros}
        perfiles={perfiles.filas.map((perfil) => ({
          id: perfil.id,
          nombre: perfil.nombre?.trim() || NOMBRE_SI_NO_TIENE,
          avatarUrl: perfil.avatarUrl,
        }))}
      />
    </>
  );
}
