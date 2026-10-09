import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { CartelDeInstalar } from "@/components/armazon/cartel-de-instalar";
import { PantallaDeCircuitos } from "@/components/circuitos/pantalla-de-circuitos";
import { traerMiPerfil } from "@/lib/perfiles/datos";

/** El inicio: la lista de Circuitos, desde que se retiró Rutas (decisión 049). */
export default async function HomePage() {
  const perfil = await traerMiPerfil();

  return (
    <>
      <MarcaDeAppLista />
      <CartelDeInstalar />
      <PantallaDeCircuitos categoria={perfil?.categoria ?? "normal"} miPerfilId={perfil?.id ?? null} />
    </>
  );
}
