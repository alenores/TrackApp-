import { borrarPaquete } from "@/lib/offline/paquete";
import { borrarTodosLosRecorridos } from "@/lib/offline/recorridos";

/**
 * Borrar del celular todo lo de la cuenta que se va.
 *
 * **Al cerrar sesión no alcanza con cerrar sesión.** Las rutas, las zonas, los
 * sectores y las líneas de los recorridos quedan guardados en el celular para
 * poder usarlos sin señal. Si no se borran, el que entre después con otra
 * cuenta abre la app y ve las rutas del anterior, dibujadas desde el celular y
 * sin pasar por la base.
 *
 * Nunca lanza: si algo no se puede borrar, cerrar sesión igual tiene que
 * funcionar. Quedarse sin poder salir sería peor.
 */
export async function borrarLoGuardadoEnElCelular(): Promise<void> {
  try {
    borrarPaquete();
  } catch {
    // El navegador puede negar el almacenamiento. Se sigue.
  }

  try {
    await borrarTodosLosRecorridos();
  } catch {
    // Ídem.
  }
}
