import type { Metadata } from "next";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { PantallaDeMarcas } from "@/components/marcas/pantalla-de-marcas";
import { traerMiPerfil } from "@/lib/perfiles/datos";

export const metadata: Metadata = { title: "Marcas" };

/**
 * Todas las marcas en detalle: lista con tildes, filtros y mapa. Todos la
 * consultan; Administrador y Premium además agregan y editan. Solo con
 * conexión.
 */
export default async function MarcasPage() {
  const miPerfil = await traerMiPerfil();
  return (
    <>
      <MarcaDeAppLista />
      <PantallaDeMarcas categoria={miPerfil?.categoria ?? "normal"} miPerfilId={miPerfil?.id ?? null} />
    </>
  );
}
