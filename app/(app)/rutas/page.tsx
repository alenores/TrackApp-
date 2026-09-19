import { traerUsuario } from "@/lib/cuenta/sesion";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { PantallaDeRutas } from "@/components/rutas/pantalla-de-rutas";

/**
 * Todas las rutas.
 *
 * Dibuja desde lo guardado en el celular, igual que el inicio: la lista tiene
 * que aparecer sin señal.
 */
export default async function RutasPage() {
  const usuario = await traerUsuario();

  return (
    <>
      <MarcaDeAppLista />
      <PantallaDeRutas miPerfilId={usuario?.id ?? null} />
    </>
  );
}
