import type { Metadata } from "next";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { PantallaDeDescargasDeMapas } from "@/components/zonas/pantalla-de-descargas";

export const metadata: Metadata = { title: "Descargas" };

/** Los mapas bajados a este celular, cuánto ocupan y cómo sacarlos. Solo con conexión. */
export default function DescargasPage() {
  return (
    <>
      <MarcaDeAppLista />
      <PantallaDeDescargasDeMapas />
    </>
  );
}
