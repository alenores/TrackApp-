/**
 * Cómo se llama cada depósito de pantallas guardadas.
 *
 * **Están acá y no escritos a mano en dos lados** porque los usan dos piezas
 * que tienen que coincidir exactamente: la configuración del motor offline, que
 * decide dónde guarda cada pantalla, y el calentado, que las deja listas
 * después de bajar el paquete. Un nombre distinto entre las dos y el calentado
 * guarda en un cajón que nadie abre: la app parece lista y sin señal no está.
 *
 * **El motor guarda dos cosas por pantalla, no una**: el documento —lo que
 * llega al abrir la app desde cero— y el pedido interno que hace la app al
 * pasar de una pantalla a otra por un link. Son respuestas distintas y van en
 * depósitos distintos.
 */

/** Las que se abren caminando: la ruta y la navegación. */
export const PANTALLAS_DEL_CERRO = "pantallas-del-cerro";
export const PANTALLAS_DEL_CERRO_INTERNO = "pantallas-del-cerro-interno";

/** Las de entrada: el inicio, las listas y el detalle de una zona. */
export const PANTALLAS_DE_ENTRADA = "pantallas-de-entrada";
export const PANTALLAS_DE_ENTRADA_INTERNO = "pantallas-de-entrada-interno";
