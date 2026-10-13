import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { PantallaDeZonas } from "@/components/zonas/pantalla-de-zonas";
import { traerMiPerfil } from "@/lib/perfiles/datos";

export const metadata: Metadata = { title: "Zonas" };

/**
 * Las zonas de Córdoba con sus sectores. Es una de las cuatro entradas de
 * Mapas, solo con conexión.
 *
 * Las direcciones viejas de las pestañas siguen andando: llevan a su pantalla.
 */
export default async function ZonasPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string | string[] }>;
}) {
  const { vista } = await searchParams;
  if (vista === "anotaciones" || vista === "puntos" || vista === "caminos") redirect("/mapas/marcas");
  if (vista === "mapa") redirect("/mapas/consultas");
  if (vista === "descargas") redirect("/mapas/descargas");

  const miPerfil = await traerMiPerfil();
  return (
    <>
      <MarcaDeAppLista />
      <PantallaDeZonas categoria={miPerfil?.categoria ?? "normal"} />
    </>
  );
}
