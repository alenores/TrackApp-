import type { Metadata } from "next";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { PantallaDeCircuitos } from "@/components/circuitos/pantalla-de-circuitos";

export const metadata: Metadata = { title: "Circuitos" };

/** Quién sos lo lee la pantalla de lo averiguado al abrir: no sale a internet. */
export default function CircuitosPage() {
  return <><MarcaDeAppLista />
    <PantallaDeCircuitos />
  </>;
}
