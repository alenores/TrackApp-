import { traerUsuario } from "@/lib/cuenta/sesion";
import { AppReadyMarker } from "@/components/layout/app-ready-marker";
import { InstallAppBanner } from "@/components/layout/install-app-banner";
import { RutasClient } from "@/components/rutas/rutas-client";

export default async function HomePage() {
  const usuario = await traerUsuario();

  return (
    <>
      <AppReadyMarker />
      <InstallAppBanner />
      <RutasClient miPerfilId={usuario?.id ?? null} />
    </>
  );
}
