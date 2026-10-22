import type { Metadata } from "next";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { PantallaDeSalidas } from "@/components/salidas/pantalla-de-salidas";

export const metadata: Metadata = { title: "Salidas" };
export const dynamic = "force-dynamic";

/**
 * Las salidas de todos. **Solo con internet.** La lista la trae la pantalla
 * una sola vez por apertura y la filtra en el celular: buscar o filtrar no
 * vuelve a pasar por acá (decisión 054).
 */
export default function SalidasPage() {
  return (
    <>
      <MarcaDeAppLista />
      <PantallaDeSalidas />
    </>
  );
}
