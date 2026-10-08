import type { Metadata } from "next";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { PantallaDeCircuitos } from "@/components/circuitos/pantalla-de-circuitos";
import { traerMiPerfil } from "@/lib/perfiles/datos";

export const metadata: Metadata = { title: "Circuitos" };

export default async function CircuitosPage() {
  const perfil = await traerMiPerfil();
  return <><MarcaDeAppLista />
    <PantallaDeCircuitos categoria={perfil?.categoria ?? "normal"} miPerfilId={perfil?.id ?? null} />
  </>;
}
