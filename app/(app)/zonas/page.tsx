import type { Metadata } from "next";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { PantallaDeZonas } from "@/components/zonas/pantalla-de-zonas";
import { soyAdministrador } from "@/lib/perfiles/datos";

export const metadata: Metadata = { title: "Mapas" };

/**
 * Todas las zonas y el mapa general de Córdoba.
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
