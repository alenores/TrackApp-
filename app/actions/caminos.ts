"use server";

import { crearClienteEnElServidor } from "@/lib/supabase/servidor";
import { exito, falla, type Resultado } from "@/lib/datos/resultado";
import { CATEGORIAS_USUARIO, type CategoriaUsuario } from "@/types/database";
import { COLUMNAS_DE_CAMINO, traducirErrorDeCaminos, type CaminoGuardado } from "@/lib/caminos/datos";
import type { QuienUsa } from "@/lib/caminos/permisos";
import {
  cambiarActividadesGuardadas,
  cambiarDatosDeParteGuardada,
  cambiarNombreGuardado,
  clasificarParteGuardada,
  corregirLineaGuardada,
  crearCaminoGuardado,
  leerCaminoGuardado,
  leerCaminosVivos,
  retirarCaminoGuardado,
  type BaseDeCaminos,
  type ListaDeCaminos,
  type PedidoDeCaminoNuevo,
  type PedidoDeClasificacion,
  type PedidoDeDatosDeParte,
  type PedidoDeNombre,
} from "@/lib/caminos/guardado";

/**
 * Las acciones de Caminos, del lado del servidor.
 *
 * Acá solo se conecta: quién está usando la app, con qué categoría, y una
 * `BaseDeCaminos` de verdad sobre Supabase. Las reglas viven en
 * `lib/caminos/` y la base las vuelve a exigir por su cuenta
 * (`scripts/supabase-caminos.sql`).
 *
 * **Todavía no las usa ninguna pantalla** y la tabla todavía no existe en la
 * base: hasta que se aplique el SQL, cada acción contesta que los Caminos no
 * están habilitados.
 *
 * Administrar Caminos es tarea de computadora y con conexión. Nada de esto se
 * llama durante la navegación.
 */

/** El mismo tope que los pedidos desde el navegador: nadie espera más de 15 s sin saber qué pasa. */
const TOPE_DE_CADA_PEDIDO_MS = 15_000;

function tope(): AbortSignal {
  return AbortSignal.timeout(TOPE_DE_CADA_PEDIDO_MS);
}

type ClienteDelServidor = Awaited<ReturnType<typeof crearClienteEnElServidor>>;

function baseDeSupabase(supabase: ClienteDelServidor): BaseDeCaminos {
  return {
    async leer(id) {
      const { data, error } = await supabase
        .from("caminos")
        .select(COLUMNAS_DE_CAMINO)
        .eq("id", id)
        .abortSignal(tope())
        .maybeSingle();
      return { fila: data, error: error?.message ?? null };
    },

    async insertar(fila) {
      const { data, error } = await supabase
        .from("caminos")
        .insert(fila)
        .select(COLUMNAS_DE_CAMINO)
        .abortSignal(tope())
        .maybeSingle();
      return { fila: data, error: error?.message ?? null };
    },

    async actualizarSiNadieCambio(id, actualizadoEnLeido, cambios) {
      // La condición sobre `actualizado_en` es la que evita pisar a otro: si
      // alguien guardó en el medio, no coincide y no se cambia ninguna fila.
      const { data, error } = await supabase
        .from("caminos")
        .update(cambios)
        .eq("id", id)
        .eq("actualizado_en", actualizadoEnLeido)
        .select(COLUMNAS_DE_CAMINO)
        .abortSignal(tope())
        .maybeSingle();
      return { fila: data, error: error?.message ?? null };
    },

    leerPaginaDeVivos(desde, hasta) {
      return supabase
        .from("caminos")
        .select(COLUMNAS_DE_CAMINO)
        .is("eliminado_en", null)
        .order("id", { ascending: true })
        .range(desde, hasta)
        .abortSignal(tope());
    },

    async contarVivos() {
      const { count, error } = await supabase
        .from("caminos")
        .select("id", { count: "exact", head: true })
        .is("eliminado_en", null)
        .abortSignal(tope());
      return { cantidad: count, error: error?.message ?? null };
    },
  };
}

/**
 * Quién está usando la app, con su sesión **verificada** (no la que dice la
 * cookie sin revisar) y su categoría leída de la base en este momento.
 */
async function quienUsa(supabase: ClienteDelServidor): Promise<Resultado<QuienUsa>> {
  const { data, error } = await supabase.auth.getClaims();
  const perfilId = data?.claims?.sub;
  if (error || typeof perfilId !== "string" || !perfilId) {
    return falla("Tu sesión se cerró. Volvé a entrar con tu cuenta y probá de nuevo.");
  }

  const { data: perfil, error: errorDelPerfil } = await supabase
    .from("perfiles")
    .select("categoria")
    .eq("id", perfilId)
    .is("eliminado_en", null)
    .abortSignal(tope())
    .maybeSingle();
  if (errorDelPerfil) {
    return falla(`No se pudo saber qué puede hacer tu cuenta: ${traducirErrorDeCaminos(errorDelPerfil.message)}`);
  }
  const categoria = (perfil as { categoria?: unknown } | null)?.categoria;
  if (!(CATEGORIAS_USUARIO as readonly unknown[]).includes(categoria)) {
    return falla("Tu cuenta no tiene perfil en la app, así que no puede cambiar Caminos. Avisale al administrador.");
  }
  return exito({ perfilId, categoria: categoria as CategoriaUsuario });
}

/** Lo que falle sin avisar igual se dice, con el motivo de verdad adentro. */
function fallaInesperada(accion: string, causa: unknown): { ok: false; error: string } {
  const motivo = causa instanceof Error ? causa.message : String(causa);
  return falla(`No se pudo ${accion}: ${traducirErrorDeCaminos(motivo)}`);
}

async function conQuienUsa<T>(
  accion: string,
  hacer: (base: BaseDeCaminos, quien: QuienUsa) => Promise<Resultado<T>>,
): Promise<Resultado<T>> {
  try {
    const supabase = await crearClienteEnElServidor();
    const quien = await quienUsa(supabase);
    if (!quien.ok) return quien;
    return await hacer(baseDeSupabase(supabase), quien.datos);
  } catch (causa) {
    return fallaInesperada(accion, causa);
  }
}

async function soloLeyendo<T>(
  accion: string,
  hacer: (base: BaseDeCaminos) => Promise<Resultado<T>>,
): Promise<Resultado<T>> {
  try {
    const supabase = await crearClienteEnElServidor();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims?.sub) return falla("Entrá con tu cuenta para ver los Caminos.");
    return await hacer(baseDeSupabase(supabase));
  } catch (causa) {
    return fallaInesperada(accion, causa);
  }
}

// ---------------------------------------------------------------- acciones

export async function crearCaminoNuevo(pedido: PedidoDeCaminoNuevo): Promise<Resultado<CaminoGuardado>> {
  return conQuienUsa("guardar el Camino", (base, quien) => crearCaminoGuardado(base, quien, pedido));
}

export async function leerCamino(id: number): Promise<Resultado<CaminoGuardado>> {
  return soloLeyendo("abrir el Camino", (base) => leerCaminoGuardado(base, id));
}

/** Todos los Caminos vivos. Si la lista no llegó completa, lo dice en vez de mostrarla a medias. */
export async function leerCaminos(): Promise<Resultado<ListaDeCaminos>> {
  return soloLeyendo("traer los Caminos", (base) => leerCaminosVivos(base));
}

export async function corregirLineaDelCamino(
  id: number,
  actualizadoEn: string,
  coordenadas: number[][],
): Promise<Resultado<CaminoGuardado>> {
  return conQuienUsa("corregir la línea", (base, quien) => corregirLineaGuardada(base, quien, id, actualizadoEn, coordenadas));
}

export async function clasificarParteDelCamino(
  id: number,
  actualizadoEn: string,
  pedido: PedidoDeClasificacion,
): Promise<Resultado<CaminoGuardado>> {
  return conQuienUsa("guardar la clasificación", (base, quien) => clasificarParteGuardada(base, quien, id, actualizadoEn, pedido));
}

export async function cambiarDatosDeParteDelCamino(
  id: number,
  actualizadoEn: string,
  pedido: PedidoDeDatosDeParte,
): Promise<Resultado<CaminoGuardado>> {
  return conQuienUsa("guardar la observación", (base, quien) => cambiarDatosDeParteGuardada(base, quien, id, actualizadoEn, pedido));
}

export async function cambiarActividadesDelCamino(
  id: number,
  actualizadoEn: string,
  actividades: string[],
): Promise<Resultado<CaminoGuardado>> {
  return conQuienUsa("cambiar las actividades", (base, quien) => cambiarActividadesGuardadas(base, quien, id, actualizadoEn, actividades));
}

export async function cambiarNombreDelCamino(
  id: number,
  actualizadoEn: string,
  pedido: PedidoDeNombre,
): Promise<Resultado<CaminoGuardado>> {
  return conQuienUsa("cambiar el nombre", (base, quien) => cambiarNombreGuardado(base, quien, id, actualizadoEn, pedido));
}

export async function retirarCamino(
  id: number,
  actualizadoEn: string,
): Promise<Resultado<{ id: number; eliminadoEn: string }>> {
  return conQuienUsa("retirar el Camino", (base, quien) => retirarCaminoGuardado(base, quien, id, actualizadoEn));
}
