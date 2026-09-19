import { traerUsuario } from "@/lib/cuenta/sesion";
import { AppReadyMarker } from "@/components/layout/app-ready-marker";
import { RutasClient } from "@/components/rutas/rutas-client";

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
      <AppReadyMarker />
      <RutasClient miPerfilId={usuario?.id ?? null} />
    </>
  );
}
