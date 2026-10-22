import type { Metadata } from "next";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { FichaDeSalidaDeLaApertura } from "@/components/salidas/ficha-de-salida";

export const metadata: Metadata = { title: "Salida" };

type Props = { params: Promise<{ id: string }> };

/**
 * La ficha de una salida. Solo con internet, como todo el módulo. Se arma con
 * la lista que ya llegó al celular: abrirla no le pregunta a la base.
 */
export default async function SalidaPage({ params }: Props) {
  const { id } = await params;
  return (
    <>
      <MarcaDeAppLista />
      <FichaDeSalidaDeLaApertura id={Number(id)} />
    </>
  );
}
