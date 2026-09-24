import { borrarTodosLosPendientes } from "@/lib/anotaciones/pendientes";
import { olvidarMiPerfil } from "@/lib/cuenta/mi-perfil-en-el-celular";
import { borrarTodosLosMapasDelCelular } from "@/lib/mapas/descarga";
import { borrarPaquete } from "@/lib/offline/paquete";
import { borrarTodosLosRecorridos } from "@/lib/offline/recorridos";

/**
 * Borrar del celular todo lo de la cuenta que se va.
 *
 * **Al cerrar sesión no alcanza con cerrar sesión.** Las rutas, las zonas, los
 * sectores, las líneas de los recorridos y los mapas quedan guardados en el
 * celular para poder usarlos sin señal. Si no se borran, el que entre después con otra
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

  olvidarMiPerfil();

  try {
    // Lo marcado sin señal que no subió era de la cuenta que se va. Se avisa
    // antes, en el cartel de cerrar sesión.
    await borrarTodosLosPendientes();
  } catch {
    // Ídem.
  }

  try {
    await borrarTodosLosMapasDelCelular();
  } catch {
    // Ídem. Los mapas son lo más pesado, pero quedarse sin poder salir de la
    // cuenta sería peor que quedarse con espacio ocupado.
  }
}
