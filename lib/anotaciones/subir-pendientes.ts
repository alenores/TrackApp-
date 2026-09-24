import type { SupabaseClient } from "@supabase/supabase-js";
import {
  quitarLasFotosDeLaAnotacion,
  subirLasFotosDeLaAnotacion,
} from "@/lib/anotaciones/subir-fotos";
import {
  comoArchivo,
  type DatosDeLaMarca,
  type Pendiente,
  type PendienteDeCrear,
  type PendienteDeEditar,
} from "@/lib/anotaciones/pendientes";
import { traducirErrorDeBase } from "@/lib/datos/resultado";

/**
 * Subir lo que se marcó sin señal.
 *
 * **Primero los datos, después la foto.** Si la foto no entra, el punto, el
 * ícono y el comentario ya quedaron en la base y los ven todos; la foto queda
 * esperando con el motivo a la vista y se reintenta sola la próxima vez. Que
 * falle la foto nunca se lleva puesto lo demás.
 *
 * **Nunca se duplica.** Cada marca viaja con el código que le puso el
 * celular. Si una subida llegó a la base pero la respuesta se perdió en el
 * camino, el reintento choca con ese código y se queda con la que ya estaba.
 *
 * **Nunca durante una navegación.** Quien llama se ocupa: navegando no se
 * sale a internet, ni con señal.
 *
 * Las dependencias entran de afuera para poder probarla sin base ni depósito
 * de verdad.
 */

export type ParaSubir = {
  supabase: SupabaseClient;
  perfilId: string;
  pendientes: Pendiente[];
  /** Graba el pendiente como quedó después de este intento. */
  guardar: (pendiente: Pendiente) => Promise<void>;
  /** Deja la foto chica recién subida en el celular, para no bajarla de nuevo. */
  guardarFotoBajada: (direccion: string, chica: Blob) => Promise<void>;
};

export type ResultadoDeSubir = {
  subidos: number;
  fallidos: number;
  /** El motivo del primer fallo, con palabras. `null` si no falló nada. */
  motivo: string | null;
};

/** El error que da la base cuando el código de la marca ya existe. */
const YA_EXISTE = "23505";

function columnasDe(datos: DatosDeLaMarca) {
  return {
    tipo: datos.tipo,
    icono: datos.tipo === "punto" ? datos.icono : null,
    color: datos.tipo === "trazo" ? datos.color : null,
    comentario: datos.comentario?.trim() || null,
    geometria: datos.geometria,
    precision_gps_metros: datos.precisionGpsMetros,
  };
}

async function subirLaFoto(
  { supabase, perfilId, guardarFotoBajada }: ParaSubir,
  anotacionId: number,
  fotos: { grande: Blob; chica: Blob },
): Promise<string | null> {
  const subida = await subirLasFotosDeLaAnotacion(
    supabase,
    perfilId,
    anotacionId,
    comoArchivo(fotos.grande, "foto.webp"),
    comoArchivo(fotos.chica, "foto-chica.webp"),
  );
  if (!subida.ok) return subida.error;

  const { error, count } = await supabase
    .from("anotaciones")
    .update(
      { foto_url: subida.datos.fotoUrl, foto_chica_url: subida.datos.fotoChicaUrl },
      { count: "exact" },
    )
    .eq("id", anotacionId)
    .is("eliminado_en", null);

  if (error) return traducirErrorDeBase(error.message);
  if (count === 0) return "La anotación ya no está en la base, así que la foto no tiene dónde ir.";

  try {
    await guardarFotoBajada(subida.datos.fotoChicaUrl, fotos.chica);
  } catch {
    // Se baja sola en la próxima puesta al día.
  }
  return null;
}

async function crear(
  para: ParaSubir,
  pendiente: PendienteDeCrear,
): Promise<string | null> {
  const { supabase, perfilId, guardar } = para;
  let actual = pendiente;

  // El motivo queda guardado en la marca: el inicio lo muestra. Un fallo que
  // no se anota es un fallo que nadie ve.
  const anotarElFallo = async (problema: string): Promise<string> => {
    await guardar({ ...actual, ultimoError: `No se subió: ${problema}` });
    return problema;
  };

  if (actual.anotacionId === null) {
    const { data, error } = await supabase
      .from("anotaciones")
      .insert({
        ...columnasDe(actual.datos),
        perfil_id: perfilId,
        sector_id: null,
        origen: "navegacion",
        codigo_local: actual.codigo,
        marcada_en: actual.hechoEn,
      })
      .select("id")
      .single();

    let anotacionId: number | null = data ? Number((data as { id: number }).id) : null;

    if (error?.code === YA_EXISTE) {
      // Ya había subido y la respuesta no llegó: se usa la que está.
      const { data: existente, error: errorAlBuscar } = await supabase
        .from("anotaciones")
        .select("id")
        .eq("codigo_local", actual.codigo)
        .maybeSingle();
      if (errorAlBuscar || !existente) {
        return anotarElFallo(
          traducirErrorDeBase(errorAlBuscar?.message ?? error.message),
        );
      }
      anotacionId = Number((existente as { id: number }).id);
    } else if (error || anotacionId === null) {
      return anotarElFallo(
        traducirErrorDeBase(error?.message ?? "La base no devolvió la anotación."),
      );
    }

    actual = { ...actual, anotacionId, ultimoError: null };
    await guardar(actual);
  }

  if (actual.fotos && actual.anotacionId !== null) {
    const problema = await subirLaFoto(para, actual.anotacionId, actual.fotos);
    if (problema) {
      await guardar({ ...actual, ultimoError: `La foto no se subió: ${problema}` });
      return problema;
    }
  }

  await guardar({ ...actual, ultimoError: null, terminada: true });
  return null;
}

async function editar(
  para: ParaSubir,
  pendiente: PendienteDeEditar,
): Promise<string | null> {
  const { supabase, perfilId, guardar } = para;

  const { error, count } = await supabase
    .from("anotaciones")
    .update(
      {
        ...columnasDe(pendiente.datos),
        ...(pendiente.quitarLaFoto && !pendiente.fotos
          ? { foto_url: null, foto_chica_url: null }
          : {}),
      },
      { count: "exact" },
    )
    .eq("id", pendiente.anotacionId)
    .is("eliminado_en", null);

  if (error) return traducirErrorDeBase(error.message);
  if (count === 0) {
    return "Esa anotación ya no está o la hizo otra persona: el cambio no se puede guardar.";
  }

  if (pendiente.quitarLaFoto && !pendiente.fotos) {
    await quitarLasFotosDeLaAnotacion(supabase, perfilId, pendiente.anotacionId);
  }

  if (pendiente.fotos) {
    const problema = await subirLaFoto(para, pendiente.anotacionId, pendiente.fotos);
    if (problema) return `El cambio se guardó, pero la foto no se subió: ${problema}`;
  }

  await guardar({ ...pendiente, ultimoError: null, terminada: true });
  return null;
}

export async function subirLosPendientes(para: ParaSubir): Promise<ResultadoDeSubir> {
  let subidos = 0;
  let fallidos = 0;
  let motivo: string | null = null;

  for (const pendiente of para.pendientes) {
    if (pendiente.terminada) continue;

    let problema: string | null;

    try {
      if (pendiente.clase === "crear") {
        problema = await crear(para, pendiente);
      } else if (pendiente.clase === "editar") {
        problema = await editar(para, pendiente);
        if (problema) await para.guardar({ ...pendiente, ultimoError: problema });
      } else {
        const { error } = await para.supabase
          .from("anotaciones")
          .update({ eliminado_en: new Date().toISOString() }, { count: "exact" })
          .eq("id", pendiente.anotacionId)
          .is("eliminado_en", null);
        // Si no cambió nada, ya estaba borrada: no queda nada por hacer.
        problema = error ? traducirErrorDeBase(error.message) : null;
        await para.guardar(
          problema
            ? { ...pendiente, ultimoError: problema }
            : { ...pendiente, ultimoError: null, terminada: true },
        );
      }
    } catch (error) {
      problema =
        error instanceof Error && error.message
          ? `Se cortó la subida: ${error.message}`
          : "Se cortó la subida.";
      await para.guardar({ ...pendiente, ultimoError: problema }).catch(() => {});
    }

    if (problema) {
      fallidos += 1;
      motivo ??= problema;
    } else {
      subidos += 1;
    }
  }

  return { subidos, fallidos, motivo };
}
