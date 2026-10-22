import type { Metadata } from "next";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { FormularioDeSalidaDeLaApertura } from "@/components/salidas/formulario-de-salida";

export const metadata: Metadata = { title: "Editar la salida" };

type Props = { params: Promise<{ id: string }> };

/**
 * Editar una salida. Solo quien la cargó, y solo con internet. La salida y los
 * usuarios son los que ya se trajeron en esta apertura: abrir el editor no le
 * pregunta a la base.
 */
export default async function EditarSalidaPage({ params }: Props) {
  const { id } = await params;
  return (
    <>
      <MarcaDeAppLista />
      <FormularioDeSalidaDeLaApertura id={Number(id)} />
    </>
  );
}
