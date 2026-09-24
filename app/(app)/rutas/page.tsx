import { traerUsuario } from "@/lib/cuenta/sesion";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { PantallaDeRutas } from "@/components/rutas/pantalla-de-rutas";
import { FotoDeFondo } from "@/components/ui/foto-de-fondo";

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
      <FotoDeFondo src="/fondo-rutas.webp" />
      <div className="relative z-10 w-full">
        <MarcaDeAppLista />
        <PantallaDeRutas miPerfilId={usuario?.id ?? null} />
      </div>
    </>
  );
}
