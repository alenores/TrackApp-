import { PantallaDeMapaLibre } from "@/components/navegacion/pantalla-de-mapa-libre";

/**
 * El mapa libre: todo lo bajado, sin seguir una ruta.
 *
 * **Esta pantalla no consulta la base.** Es del cerro, como la navegación:
 * todo sale del celular.
 */
export default function MapaLibrePage() {
  return <PantallaDeMapaLibre />;
}
