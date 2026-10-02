import type { Metadata } from "next";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { FormularioDeSalida } from "@/components/salidas/formulario-de-salida";
import { traerUsuario } from "@/lib/cuenta/sesion";
import { traerTodosLosPerfiles } from "@/lib/perfiles/datos";

export const metadata: Metadata = { title: "Cargar una salida" };
export const dynamic = "force-dynamic";

/** Cargar una salida. Solo con internet, como todo el módulo. */
export default async function NuevaSalidaPage() {
  const [usuario, perfiles] = await Promise.all([traerUsuario(), traerTodosLosPerfiles()]);
  const losDemas = perfiles.filas.filter((perfil) => perfil.id !== usuario?.id);

  return (
    <>
      <MarcaDeAppLista />
      <FormularioDeSalida
        perfiles={losDemas}
        avisoDeListaIncompleta={perfiles.completa ? null : perfiles.motivo}
      />
    </>
  );
}
