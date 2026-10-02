import { redirect } from "next/navigation";
import { soyAdministrador } from "@/lib/perfiles/datos";

/** La dirección vieja de la pestaña, que ahora se llama Anotaciones. */
export default async function PuntosPage() {
  if (!(await soyAdministrador())) redirect("/zonas");
  redirect("/zonas?vista=anotaciones");
}
