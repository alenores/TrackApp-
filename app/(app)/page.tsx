import { traerUsuario } from "@/lib/cuenta/sesion";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { CartelDeInstalar } from "@/components/armazon/cartel-de-instalar";
import { PantallaDeRutas } from "@/components/rutas/pantalla-de-rutas";

export default async function HomePage() {
  const usuario = await traerUsuario();

  return (
    <>
      <MarcaDeAppLista />
      <CartelDeInstalar />
      <PantallaDeRutas miPerfilId={usuario?.id ?? null} />
    </>
  );
}
