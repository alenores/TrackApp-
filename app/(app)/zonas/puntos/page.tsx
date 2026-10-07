import { redirect } from "next/navigation";

/** La dirección vieja de la pestaña, que ahora se llama Anotaciones. */
export default async function PuntosPage() {
  redirect("/zonas?vista=anotaciones");
}
