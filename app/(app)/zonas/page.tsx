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
export default async function ZonasPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string | string[] }>;
}) {
  const esAdministrador = await soyAdministrador();
  const parametros = await searchParams;
  const pestañaInicial = parametros.vista === "puntos" ? "puntos" : "mapa";

  return (
    <>
      <MarcaDeAppLista />
      <PantallaDeZonas soyAdministrador={esAdministrador} pestañaInicial={pestañaInicial} />
    </>
  );
}
