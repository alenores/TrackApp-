import type { CategoriaUsuario } from "@/types/database";
import { exito, falla, type Resultado } from "@/lib/datos/resultado";

/**
 * Quién puede hacer qué con los Caminos (decisión de Ale del 2026-10-05,
 * docs/USUARIOS.md):
 *
 * - Todos los que tienen sesión los ven.
 * - Administrador y Premium los crean, siempre a su nombre.
 * - Premium edita y retira solo los suyos; el Administrador, cualquiera.
 * - Normal solo los mira.
 *
 * **La defensa de verdad es la base**, que exige lo mismo por su cuenta
 * (scripts/supabase-caminos.sql). Esto existe para que el servidor ni siquiera
 * intente lo que va a fallar, y para decir por qué con palabras que se
 * entiendan.
 */

export type QuienUsa = {
  perfilId: string;
  categoria: CategoriaUsuario;
};

/** Lo que hace falta saber de un Camino para decidir si se puede tocar. */
export type CaminoParaPermisos = {
  perfilId: string;
  eliminadoEn: string | null;
};

export function puedeCrearCaminos(quien: QuienUsa): Resultado {
  if (quien.categoria === "administrador" || quien.categoria === "premium") return exito();
  return falla(
    "Tu cuenta puede ver los Caminos, pero no sumarlos. Los suman los usuarios Premium y el administrador: si conocés uno que falta, pasáselo a Ale.",
  );
}

/**
 * Editar o retirar. Un Camino retirado no se edita desde la app: ya no está en
 * el mapa.
 */
export function puedeEditarCamino(quien: QuienUsa, camino: CaminoParaPermisos): Resultado {
  if (quien.categoria !== "administrador" && quien.categoria !== "premium") {
    return falla("Tu cuenta puede ver los Caminos, pero no cambiarlos.");
  }
  if (camino.eliminadoEn !== null) {
    return falla("Este Camino ya fue retirado del mapa, así que no se puede cambiar. Volvé a la lista de Caminos.");
  }
  if (quien.categoria === "premium" && camino.perfilId !== quien.perfilId) {
    return falla(
      "Este Camino lo subió otra persona: solo podés cambiar los tuyos. Si hay algo para corregir, avisale al administrador.",
    );
  }
  return exito();
}
