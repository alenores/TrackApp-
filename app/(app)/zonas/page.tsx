import { AppReadyMarker } from "@/components/layout/app-ready-marker";
import { ZonasClient } from "@/components/zonas/zonas-client";
import { soyAdministrador } from "@/lib/perfiles/datos";

/**
 * Todas las zonas.
 *
 * Dibuja desde lo guardado en el celular, igual que la lista de rutas: la
 * pantalla tiene que aparecer sin señal.
 */
export default async function ZonasPage() {
  const esAdministrador = await soyAdministrador();

  return (
    <>
      <AppReadyMarker />
      <ZonasClient soyAdministrador={esAdministrador} />
    </>
  );
}
