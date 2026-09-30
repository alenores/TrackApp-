import { redirect } from "next/navigation";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { PantallaDePuntos } from "@/components/anotaciones/pantalla-de-puntos";
import { soyAdministrador } from "@/lib/perfiles/datos";

export default async function PuntosPage() {
  if (!(await soyAdministrador())) redirect("/zonas");

  return (
    <>
      <MarcaDeAppLista />
      <PantallaDePuntos />
    </>
  );
}
