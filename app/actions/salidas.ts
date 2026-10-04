"use server";

import { revalidatePath } from "next/cache";
import { traerUsuario } from "@/lib/cuenta/sesion";
import { crearClienteEnElServidor } from "@/lib/supabase/servidor";
import { exito, falla, traducirErrorDeBase, type Resultado } from "@/lib/datos/resultado";
import { traerDiasConSalidas } from "@/lib/salidas/datos";

/** Los días con salidas de un mes, para el calendario de la lista. */
export async function diasConSalidas(desde: string, hasta: string): Promise<Resultado<string[]>> {
  const esFecha = /^\d{4}-\d{2}-\d{2}$/;
  if (!esFecha.test(desde) || !esFecha.test(hasta)) {
    return falla("Las fechas del calendario no se entienden. Cerralo y volvé a abrirlo.");
  }
  const resultado = await traerDiasConSalidas(desde, hasta);
  return resultado.ok ? exito(resultado.dias) : falla(resultado.motivo);
}

/**
 * Borrar una salida: marcar `eliminado_en`. Nada se borra de verdad.
 *
 * Solo la puede borrar quien la cargó; la base lo exige por su cuenta.
 *
 * Cargar una salida no pasa por acá: va desde el navegador, con
 * `lib/salidas/guardar.ts`, porque las fotos no entran en un envío al servidor.
 */
export async function borrarSalida(salidaId: number): Promise<Resultado> {
  const usuario = await traerUsuario();
  if (!usuario?.id) {
    return falla("Tu sesión se cerró. Volvé a entrar con tu cuenta para borrar la salida.");
  }

  const supabase = await crearClienteEnElServidor();

  const { data, error } = await supabase
    .from("salidas")
    .update({ eliminado_en: new Date().toISOString() })
    .eq("id", salidaId)
    .eq("perfil_id", usuario.id)
    .is("eliminado_en", null)
    .select("id");

  if (error) return falla(`No se pudo borrar la salida: ${traducirErrorDeBase(error.message)}`);

  if (!data || data.length === 0) {
    return falla(
      "No se borró nada: la salida ya no existe o no la cargaste vos. Recargá la pantalla para ver la lista al día.",
    );
  }

  revalidatePath("/salidas");
  return exito();
}
