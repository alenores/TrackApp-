import Image from "next/image";
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
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/fondo-rutas.webp"
          alt="Fondo de rutas"
          fill
          className="object-cover object-center opacity-30"
          priority
        />
      </div>
      <div className="relative z-10 w-full">
        <MarcaDeAppLista />
        <PantallaDeRutas miPerfilId={usuario?.id ?? null} />
      </div>
    </>
  );
}
