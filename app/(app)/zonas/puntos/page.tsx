import { redirect } from "next/navigation";
import { soyAdministrador } from "@/lib/perfiles/datos";

export default async function PuntosPage() {
  if (!(await soyAdministrador())) redirect("/zonas");
  redirect("/zonas?vista=puntos");
}
