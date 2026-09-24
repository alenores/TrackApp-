import { crearClienteEnElNavegador } from "@/lib/supabase/navegador";
import { traerTodasLasFilas } from "@/lib/supabase/listas";
import type { TipoDeMapa } from "@/lib/offline/mapas";

/**
 * Qué mapas bajó el usuario, anotado en la base y no solo en el celular.
 *
 * **Porque el navegador puede borrar lo guardado sin avisar.** Cuando el
 * teléfono se queda sin lugar, se lleva todo de una: los datos, los mapas y las
 * pantallas. Si la única anotación de qué mapas tenías viviera en el celular, se
 * iría con el resto y la app no tendría forma de saber que perdiste algo: al
 * abrir con señal los datos vuelven solos, la pantalla se ve perfecta y los
 * mapas no están. Eso se descubriría en el cerro.
 *
 * Con esta anotación del lado de la base, la app compara lo que la base dice que
 * tenías contra lo que quedó en el celular y avisa en casa.
 *
 * **Nada de acá se consulta durante una navegación.** Es trabajo de antes de
 * salir, con señal.
 */

export type MapaQueTenias = {
  sectorId: number;
  tipo: TipoDeMapa;
  acercamientoMaximo: number;
};

type FilaDeMapaBajado = {
  id: number;
  sector_id: number;
  tipo: TipoDeMapa;
  acercamiento_maximo: number;
};

/**
 * Lo que la base dice que tenías bajado.
 *
 * **Nunca miente sobre una lista cortada.** Si la consulta no pudo traer todo,
 * lo dice: avisar «no perdiste nada» con media lista sería peor que no avisar.
 */
export type LoQueTenias =
  | { clase: "lista"; mapas: MapaQueTenias[] }
  | { clase: "no_se_pudo"; motivo: string };

function comoMapa(fila: FilaDeMapaBajado): MapaQueTenias {
  return {
    sectorId: fila.sector_id,
    tipo: fila.tipo,
    acercamientoMaximo: fila.acercamiento_maximo,
  };
}

export async function traerLosMapasQueTenias(): Promise<LoQueTenias> {
  try {
    const supabase = crearClienteEnElNavegador();

    // La seguridad por fila ya deja ver solo lo propio: no hace falta filtrar
    // por usuario acá, y filtrar de más escondería un error de permisos.
    const resultado = await traerTodasLasFilas<FilaDeMapaBajado>((desde, hasta) =>
      supabase
        .from("mapas_bajados")
        .select("id, sector_id, tipo, acercamiento_maximo")
        .is("eliminado_en", null)
        .order("id", { ascending: true })
        .range(desde, hasta),
    );

    if (!resultado.completa) {
      return { clase: "no_se_pudo", motivo: resultado.motivo };
    }

    return { clase: "lista", mapas: resultado.filas.map(comoMapa) };
  } catch (error) {
    return {
      clase: "no_se_pudo",
      motivo:
        error instanceof Error && error.message
          ? error.message
          : "No se pudo consultar qué mapas tenías bajados.",
    };
  }
}

export type ResultadoDeAnotar = { ok: true } | { ok: false; motivo: string };

async function quienSoy(
  supabase: ReturnType<typeof crearClienteEnElNavegador>,
): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * Anotar en la base que este celular bajó el mapa de un sector.
 *
 * Primero se intenta revivir la fila que ya había de ese sector **y ese
 * tipo** —el usuario pudo haber borrado ese mapa a propósito alguna vez— y
 * recién si no había ninguna se crea una nueva. Un sector puede tener una fila
 * por tipo: el simple y el satelital se anotan y se sacan por separado.
 */
export async function anotarQueBajasteElMapa(
  mapa: MapaQueTenias,
): Promise<ResultadoDeAnotar> {
  try {
    const supabase = crearClienteEnElNavegador();
    const perfilId = await quienSoy(supabase);

    if (!perfilId) {
      return { ok: false, motivo: "No hay sesión abierta." };
    }

    const fila = {
      tipo: mapa.tipo,
      acercamiento_maximo: mapa.acercamientoMaximo,
      eliminado_en: null,
    };

    const revividas = await supabase
      .from("mapas_bajados")
      .update(fila)
      .eq("perfil_id", perfilId)
      .eq("sector_id", mapa.sectorId)
      .eq("tipo", mapa.tipo)
      .select("id");

    if (revividas.error) {
      return { ok: false, motivo: revividas.error.message };
    }

    if ((revividas.data?.length ?? 0) > 0) return { ok: true };

    const creada = await supabase.from("mapas_bajados").insert({
      perfil_id: perfilId,
      sector_id: mapa.sectorId,
      ...fila,
    });

    if (creada.error) {
      return { ok: false, motivo: creada.error.message };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      motivo:
        error instanceof Error && error.message
          ? error.message
          : "No se pudo anotar la descarga en la base.",
    };
  }
}

/**
 * Sacar la anotación cuando el usuario borra un mapa a propósito.
 *
 * **Sin esto la app le ofrecería recuperar lo que tiró.** Es la diferencia entre
 * «el navegador se lo llevó» y «no lo quiero más», y solo la sabe este momento.
 */
export async function olvidarQueTeniasElMapa(
  sectorId: number,
  /** Cuál de los dos. Sin tipo se olvidan los dos. */
  tipo: TipoDeMapa | null,
): Promise<ResultadoDeAnotar> {
  try {
    const supabase = crearClienteEnElNavegador();
    const perfilId = await quienSoy(supabase);

    if (!perfilId) {
      return { ok: false, motivo: "No hay sesión abierta." };
    }

    const pedido = supabase
      .from("mapas_bajados")
      .update({ eliminado_en: new Date().toISOString() })
      .eq("perfil_id", perfilId)
      .eq("sector_id", sectorId)
      .is("eliminado_en", null);

    const { error } = await (tipo ? pedido.eq("tipo", tipo) : pedido);

    if (error) return { ok: false, motivo: error.message };

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      motivo:
        error instanceof Error && error.message
          ? error.message
          : "No se pudo sacar la anotación de la base.",
    };
  }
}
