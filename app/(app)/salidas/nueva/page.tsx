import type { Metadata } from "next";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { FormularioDeSalidaDeLaApertura } from "@/components/salidas/formulario-de-salida";

export const metadata: Metadata = { title: "Cargar una salida" };

/**
 * Cargar una salida. Solo con internet, como todo el módulo. Los usuarios para
 * elegir compañeros son los que ya se trajeron en esta apertura.
 */
export default function NuevaSalidaPage() {
  return (
    <>
      <MarcaDeAppLista />
      <FormularioDeSalidaDeLaApertura />
    </>
  );
}
