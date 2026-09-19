import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { PantallaDeZonas } from "@/components/zonas/pantalla-de-zonas";
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
      <MarcaDeAppLista />
      <PantallaDeZonas soyAdministrador={esAdministrador} />
    </>
  );
}
