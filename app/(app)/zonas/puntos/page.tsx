import { redirect } from "next/navigation";

/** La dirección vieja de la pestaña de puntos: ahora todo eso está en Marcas. */
export default async function PuntosPage() {
  redirect("/mapas/marcas");
}
