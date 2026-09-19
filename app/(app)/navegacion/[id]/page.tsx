import { NavegacionView } from "@/components/navigation/navegacion-view";

/**
 * Navegar una ruta.
 *
 * **Esta pantalla no consulta la base.** La navegación es 100% sin conexión:
 * todo lo que necesita se descargó antes de salir y se lee del celular.
 */

type NavegacionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function NavegacionPage({ params }: NavegacionPageProps) {
  const { id } = await params;

  return <NavegacionView rutaId={Number(id)} />;
}
