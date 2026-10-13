import type { Metadata } from "next";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { PantallaDeConsultas } from "@/components/mapas/pantalla-de-consultas";

export const metadata: Metadata = { title: "Consultas" };

/** El mapa con todo lo marcado y las zonas, para mirar. Solo con conexión. */
export default function ConsultasPage() {
  return (
    <>
      <MarcaDeAppLista />
      <PantallaDeConsultas />
    </>
  );
}
