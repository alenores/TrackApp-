import type { Metadata } from "next";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { FichaDeSalida, SalidaQueNoSeVe } from "@/components/salidas/ficha-de-salida";
import { traerUsuario } from "@/lib/cuenta/sesion";
import { mensajeDeFalla, traerSalida } from "@/lib/salidas/datos";

export const metadata: Metadata = { title: "Salida" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/** La ficha de una salida. Solo con internet, como todo el módulo. */
export default async function SalidaPage({ params }: Props) {
  const { id } = await params;
  const [usuario, resultado] = await Promise.all([traerUsuario(), traerSalida(Number(id))]);

  return (
    <>
      <MarcaDeAppLista />
      {resultado.ok ? (
        <FichaDeSalida salida={resultado.salida} miPerfilId={usuario?.id ?? null} />
      ) : (
        <SalidaQueNoSeVe mensaje={resultado.noExiste ? null : mensajeDeFalla(resultado.motivo)} />
      )}
    </>
  );
}
