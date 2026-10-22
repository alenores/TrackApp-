"use server";

import { revalidatePath } from "next/cache";
import { traerUsuario } from "@/lib/cuenta/sesion";
import { crearClienteEnElServidor } from "@/lib/supabase/servidor";
import { exito, falla, traducirErrorDeBase, type Resultado } from "@/lib/datos/resultado";
import { traerTodasLasSalidas } from "@/lib/salidas/datos";
import type { PerfilBreve, Salida } from "@/types/database";
import { traerTodosLosPerfiles } from "@/lib/perfiles/datos";
import { NOMBRE_SI_NO_TIENE } from "@/lib/salidas/fila";

/**
 * Todas las salidas, para la lista y las fichas. La pantalla la pide una sola
 * vez por apertura (`unaVezPorApertura`): buscar, filtrar o abrir una ficha no
 * vuelven a preguntar.
 */
export async function leerSalidas(): Promise<Resultado<Salida[]>> {
  const resultado = await traerTodasLasSalidas();
  return resultado.ok ? exito(resultado.salidas) : falla(resultado.motivo);
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

/**
 * Los usuarios, para filtrar la lista por participantes y nombrar los filtros
 * puestos. Una sola vez por apertura, como la lista.
 */
export async function leerParticipantes(): Promise<Resultado<PerfilBreve[]>> {
  const perfiles = await traerTodosLosPerfiles();
  if (!perfiles.completa) {
    return falla(`No se pudo traer la lista de usuarios: ${traducirErrorDeBase(perfiles.motivo)}`);
  }
  return exito(
    perfiles.filas.map((perfil) => ({
      id: perfil.id,
      nombre: perfil.nombre?.trim() || NOMBRE_SI_NO_TIENE,
      avatarUrl: perfil.avatarUrl,
    })),
  );
}
