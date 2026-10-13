import { redirect } from "next/navigation";

/** Mapas abre en Consultas, que es lo que usa todo el mundo. */
export default function MapasPage() {
  redirect("/mapas/consultas");
}
