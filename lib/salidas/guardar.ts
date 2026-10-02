import type { SupabaseClient } from "@supabase/supabase-js";
import { exito, falla, traducirErrorDeBase, type Resultado } from "@/lib/datos/resultado";
import { revisarLaFoto } from "@/lib/cuenta/fotos";
import {
  CLASE_DE_RESPALDO,
  claseDelArchivoDeRuta,
  loRechazoPorLaClase,
} from "@/lib/rutas/archivo";
import { MAXIMO_DE_FOTOS, revisarLaSalida, type DatosDeSalida } from "@/lib/salidas/reglas";

/**
 * Guardar una salida nueva. **Es la única forma de cargar una.**
 *
 * Corre en el navegador, con la conexión del usuario: las fotos y el archivo
 * suben directo a su depósito, sin pasar por el servidor de la app, que corta
 * los envíos grandes.
 *
 * El orden importa:
 *   1. La salida.
 *   2. El archivo GPS. Si falla, la salida se da de baja y se avisa: guardarla
 *      sin el archivo que el usuario eligió sería mentirle.
 *   3. Los compañeros y las fotos. Si alguno falla, **la salida queda** y se
 *      dice exactamente qué no entró y por qué.
 */

export const DEPOSITO_DE_FOTOS_DE_SALIDA = "fotos-salidas";
const DEPOSITO_DE_ARCHIVOS = "archivos-ruta";

/** La carpeta arranca con el id del usuario: la base exige que cada uno escriba en la suya. */
export function rutaDeLaFotoDeSalida(perfilId: string, salidaId: number, orden: number): string {
  return `${perfilId}/${salidaId}/${orden}.webp`;
}

export function rutaDelArchivoDeSalida(perfilId: string, salidaId: number, nombre: string): string {
  const extension = nombre.toLowerCase().split(".").pop() ?? "gpx";
  return `${perfilId}/salida-${salidaId}.${extension}`;
}

export type SalidaGuardada = {
  salidaId: number;
  /** Lo que no entró, con su motivo. Vacío si entró todo. */
  avisos: string[];
};

const NOMBRES_DE_FOTO = ["La portada", "La segunda foto", "La tercera foto", "La cuarta foto"];

export async function guardarSalida(
  supabase: SupabaseClient,
  datos: DatosDeSalida,
  fotos: File[],
  archivo: File | null,
): Promise<Resultado<SalidaGuardada>> {
  const problema = revisarLaSalida(datos);
  if (problema) return falla(problema);

  if (fotos.length > MAXIMO_DE_FOTOS) {
    return falla(`Se pueden subir hasta ${MAXIMO_DE_FOTOS} fotos. Sacá alguna.`);
  }
  for (const foto of fotos) {
    const problemaDeFoto = revisarLaFoto(foto);
    if (problemaDeFoto) return falla(problemaDeFoto);
  }

  const { data: sesion } = await supabase.auth.getSession();
  const perfilId = sesion.session?.user.id;
  if (!perfilId) {
    return falla("Tu sesión se cerró. Volvé a entrar con tu cuenta y cargá la salida de nuevo.");
  }

  // 1. La salida.
  const { data: fila, error: errorDeSalida } = await supabase
    .from("salidas")
    .insert({
      perfil_id: perfilId,
      titulo: datos.titulo.trim(),
      fecha: datos.fecha,
      descripcion: datos.descripcion.trim() || null,
      actividades: datos.actividades,
      nivel_esfuerzo: datos.nivelEsfuerzo,
      largo_km: datos.largoKm,
      desnivel_positivo_m: datos.desnivelPositivoM === null ? null : Math.round(datos.desnivelPositivoM),
      desnivel_negativo_m: datos.desnivelNegativoM === null ? null : Math.round(datos.desnivelNegativoM),
    })
    .select("id")
    .single();

  if (errorDeSalida || !fila) {
    return falla(
      `No se pudo guardar la salida: ${traducirErrorDeBase(errorDeSalida?.message ?? "la base no devolvió la salida guardada")}`,
    );
  }

  const salidaId = (fila as { id: number }).id;

  // 2. El archivo GPS.
  if (archivo) {
    const subida = await subirElArchivo(supabase, perfilId, salidaId, archivo);
    if (!subida.ok) {
      await supabase
        .from("salidas")
        .update({ eliminado_en: new Date().toISOString() })
        .eq("id", salidaId);
      return falla(`La salida no se guardó porque falló el archivo GPS: ${subida.error}`);
    }
  }

  const avisos: string[] = [];

  // 3a. Los compañeros.
  const companeros = [...new Set(datos.companeros)].filter((id) => id !== perfilId);
  if (companeros.length > 0) {
    const { error } = await supabase
      .from("salidas_companeros")
      .insert(companeros.map((id) => ({ salida_id: salidaId, perfil_id: id })));
    if (error) {
      avisos.push(`No se pudieron anotar los compañeros: ${traducirErrorDeBase(error.message)}`);
    }
  }

  // 3b. Las fotos, en orden: la primera es la portada.
  for (const [orden, foto] of fotos.entries()) {
    const motivo = await subirUnaFoto(supabase, perfilId, salidaId, orden, foto);
    if (motivo) avisos.push(`${NOMBRES_DE_FOTO[orden]} no se subió: ${motivo}`);
  }

  return exito({ salidaId, avisos });
}

/** Devuelve `null` si entró, o el motivo si no. */
async function subirUnaFoto(
  supabase: SupabaseClient,
  perfilId: string,
  salidaId: number,
  orden: number,
  foto: File,
): Promise<string | null> {
  const donde = rutaDeLaFotoDeSalida(perfilId, salidaId, orden);

  const { error: errorDeSubida } = await supabase.storage
    .from(DEPOSITO_DE_FOTOS_DE_SALIDA)
    .upload(donde, foto, { contentType: foto.type, upsert: true });
  if (errorDeSubida) return traducirErrorDeBase(errorDeSubida.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(DEPOSITO_DE_FOTOS_DE_SALIDA).getPublicUrl(donde);

  const { error } = await supabase
    .from("salidas_fotos")
    .insert({ salida_id: salidaId, orden, foto_url: publicUrl });
  if (error) return traducirErrorDeBase(error.message);

  return null;
}

async function subirElArchivo(
  supabase: SupabaseClient,
  perfilId: string,
  salidaId: number,
  archivo: File,
): Promise<Resultado> {
  const donde = rutaDelArchivoDeSalida(perfilId, salidaId, archivo.name);

  // La clase sale del nombre del archivo, no del navegador: Windows no conoce
  // el .gpx y la base lo rechazaría (pasó en rutas el 2026-09-20).
  const subir = (clase: string) =>
    supabase.storage
      .from(DEPOSITO_DE_ARCHIVOS)
      .upload(donde, archivo, { contentType: clase, upsert: true });

  let { error } = await subir(claseDelArchivoDeRuta(archivo.name));
  if (error && loRechazoPorLaClase(error.message)) {
    ({ error } = await subir(CLASE_DE_RESPALDO));
  }
  if (error) {
    return falla(
      `${traducirErrorDeBase(error.message)}. Probá de nuevo; si sigue fallando, fijate que el archivo no supere los 10 MB.`,
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(DEPOSITO_DE_ARCHIVOS).getPublicUrl(donde);

  const { error: errorAlAnotar } = await supabase
    .from("salidas")
    .update({ archivo_url: publicUrl })
    .eq("id", salidaId);
  if (errorAlAnotar) return falla(traducirErrorDeBase(errorAlAnotar.message));

  return exito();
}
