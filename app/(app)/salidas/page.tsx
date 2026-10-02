import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { PantallaDeSalidas } from "@/components/salidas/pantalla-de-salidas";
import { traerMiPerfil, traerTodosLosPerfiles } from "@/lib/perfiles/datos";

export default async function SalidasPage() {
  const miPerfil = await traerMiPerfil();
  const perfiles = await traerTodosLosPerfiles();
  
  return (
    <>
      <MarcaDeAppLista />
      <PantallaDeSalidas miPerfilId={miPerfil?.id} perfiles={perfiles.ok ? perfiles.filas : []} />
    </>
  );
}
