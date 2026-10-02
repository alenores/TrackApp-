import type { Metadata } from "next";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { SalidaQueNoSeVe } from "@/components/salidas/ficha-de-salida";
import { FormularioDeSalida } from "@/components/salidas/formulario-de-salida";
import { traerUsuario } from "@/lib/cuenta/sesion";
import { traerTodosLosPerfiles } from "@/lib/perfiles/datos";
import { mensajeDeFalla, traerSalida } from "@/lib/salidas/datos";

export const metadata: Metadata = { title: "Editar la salida" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/** Editar una salida. Solo quien la cargó, y solo con internet. */
export default async function EditarSalidaPage({ params }: Props) {
  const { id } = await params;
  const [usuario, resultado, perfiles] = await Promise.all([
    traerUsuario(),
    traerSalida(Number(id)),
    traerTodosLosPerfiles(),
  ]);

  if (!resultado.ok) {
    return (
      <>
        <MarcaDeAppLista />
        <SalidaQueNoSeVe mensaje={resultado.noExiste ? null : mensajeDeFalla(resultado.motivo)} />
      </>
    );
  }

  if (resultado.salida.perfil.id !== usuario?.id) {
    return (
      <>
        <MarcaDeAppLista />
        <SalidaQueNoSeVe mensaje="Esta salida la cargó otra persona: solo ella la puede editar." />
      </>
    );
  }

  return (
    <>
      <MarcaDeAppLista />
      <FormularioDeSalida
        salida={resultado.salida}
        perfiles={perfiles.filas.filter((perfil) => perfil.id !== usuario.id)}
        avisoDeListaIncompleta={perfiles.completa ? null : perfiles.motivo}
      />
    </>
  );
}
