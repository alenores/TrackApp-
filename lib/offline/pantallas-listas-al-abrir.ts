import { esLaPantallaDeNavegar } from "@/lib/actualizacion/version-nueva";
import { hayConexion } from "@/lib/conexion";

/**
 * Las pantallas que la app deja listas **en memoria** al abrir, para que
 * entrar a ellas no salga a internet. Decisión de Ale del 2026-10-13.
 *
 * Es otra cosa que el calentado (`calentar.ts`): aquel guarda en el celular
 * las pantallas del cerro para abrirlas sin señal; esto evita que, con señal,
 * cada cambio de pantalla le pida el molde al servidor.
 *
 * **Salidas y Perfiles no van a propósito.** Muestran datos de otros que
 * cambian: se piden la primera vez que el usuario entra en esa apertura, y si
 * no entra, no se piden nunca.
 */
export const PANTALLAS_LISTAS_AL_ABRIR = [
  "/circuitos",
  "/mapa-libre",
  "/mapas",
  "/mapas/consultas",
  "/mapas/marcas",
  "/zonas",
  "/mapas/descargas",
] as const;

let hechas = false;

/**
 * Pide cada pantalla una sola vez por apertura, con señal que sirva y fuera de
 * la navegación, que nunca sale a internet. Devuelve si las pidió.
 */
export function dejarListasLasPantallas(pedir: (direccion: string) => void, dondeEstoy: string): boolean {
  if (hechas || !hayConexion() || esLaPantallaDeNavegar(dondeEstoy)) return false;
  hechas = true;
  for (const direccion of PANTALLAS_LISTAS_AL_ABRIR) {
    if (direccion !== dondeEstoy) pedir(direccion);
  }
  return true;
}

/** Solo para las pruebas: vuelve a como si la app recién se abriera. */
export function olvidarLasPantallasListasParaProbar(): void {
  hechas = false;
}
