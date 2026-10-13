import type { Metadata } from "next";
import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { PantallaDeMarcas } from "@/components/marcas/pantalla-de-marcas";

export const metadata: Metadata = { title: "Marcas" };

/**
 * Todas las marcas en detalle: lista con tildes, filtros y mapa. Todos la
 * consultan; Administrador y Premium además agregan y editan. Solo con
 * conexión. Quién sos lo lee la pantalla de lo averiguado al abrir.
 */
export default function MarcasPage() {
  return (
    <>
      <MarcaDeAppLista />
      <PantallaDeMarcas />
    </>
  );
}
