import type { Metadata } from "next";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { PantallaDeEntradasDeMapas } from "@/components/mapas/pantalla-de-entradas-de-mapas";

export const metadata: Metadata = { title: "Mapas" };

/** Las cuatro entradas de Mapas como tarjetas, para el celular. Solo con conexión. */
export default function MapasPage() {
  return (
    <>
      <MarcaDeAppLista />
      <PantallaDeEntradasDeMapas />
    </>
  );
}
