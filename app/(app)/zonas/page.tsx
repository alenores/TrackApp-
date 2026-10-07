import type { Metadata } from "next";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { PantallaDeZonas } from "@/components/zonas/pantalla-de-zonas";
import { traerMiPerfil } from "@/lib/perfiles/datos";

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
  const miPerfil = await traerMiPerfil();
  const parametros = await searchParams;
  // «puntos» es el nombre viejo de la pestaña: los enlaces guardados siguen andando.
  const pestañaInicial =
    parametros.vista === "anotaciones" || parametros.vista === "puntos" ? "anotaciones" : "mapa";

  return (
    <>
      <MarcaDeAppLista />
      <PantallaDeZonas categoria={miPerfil?.categoria ?? "normal"} miPerfilId={miPerfil?.id ?? null} pestañaInicial={pestañaInicial} />
    </>
  );
}
