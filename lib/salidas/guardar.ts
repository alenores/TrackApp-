import type { SupabaseClient } from "@supabase/supabase-js";
import { exito, falla, traducirErrorDeBase, type Resultado } from "@/lib/datos/resultado";
import { revisarLaFoto } from "@/lib/cuenta/fotos";
import {
  CLASE_DE_RESPALDO,
  claseDelArchivoDeRuta,
  loRechazoPorLaClase,
} from "@/lib/rutas/archivo";
import type { PuntoDeLinea } from "@/lib/salidas/linea";
import { MAXIMO_DE_FOTOS, revisarLaSalida, type DatosDeSalida } from "@/lib/salidas/reglas";

/**
 * Cargar y editar salidas. **Es el único camino para escribirlas.**
 *
 * Corre en el navegador, con la conexión del usuario: las fotos y el archivo
 * suben directo a su depósito, sin pasar por el servidor de la app, que corta
 * los envíos grandes.
 *
 * Al cargar, el orden importa:
 *   1. La salida.
 *   2. El archivo GPS. Si falla, la salida se da de baja y se avisa: guardarla
 *      sin el archivo que el usuario eligió sería mentirle.
 *   3. Los compañeros y las fotos. Si alguno falla, **la salida queda** y se
 *      dice exactamente qué no entró y por qué.
 *
 * Al editar, los datos van primero; lo que falle después se avisa igual.
 */

export const DEPOSITO_DE_FOTOS_DE_SALIDA = "fotos-salidas";
const DEPOSITO_DE_ARCHIVOS = "archivos-ruta";

/**
 * La carpeta arranca con el id del usuario: la base exige que cada uno escriba
 * en la suya. Cada foto nueva lleva un nombre nuevo, así nunca pisa a una que
 * se mantiene al editar.
 */
export function rutaDeLaFotoDeSalida(
  perfilId: string,
  salidaId: number,
  marca: string,
): string {
  return `${perfilId}/${salidaId}/${marca}.webp`;
}

export function rutaDelArchivoDeSalida(perfilId: string, salidaId: number, nombre: string): string {
  const extension = nombre.toLowerCase().split(".").pop() ?? "gpx";
  return `${perfilId}/salida-${salidaId}.${extension}`;
}

/** Una foto del formulario: la dirección de una que ya estaba, o un archivo nuevo. */
export type FotoDeSalida = string | File;

/** El archivo GPS elegido y su línea achicada, leída del mismo archivo. */
export type ArchivoDeSalida = { archivo: File; linea: PuntoDeLinea[] };

/** Qué hacer con el archivo GPS al editar. */
export type CambioDeArchivo =
  | { tipo: "mantener" }
  | { tipo: "quitar" }
  | ({ tipo: "nuevo" } & ArchivoDeSalida);

export type SalidaGuardada = {
  salidaId: number;
  /** Lo que no entró, con su motivo. Vacío si entró todo. */
  avisos: string[];
};

const NOMBRES_DE_FOTO = ["La portada", "La segunda foto", "La tercera foto", "La cuarta foto"];

function filaDeDatos(datos: DatosDeSalida) {
  return {
    titulo: datos.titulo.trim(),
    fecha: datos.fecha,
    descripcion: datos.descripcion.trim() || null,
    actividades: datos.actividades,
    nivel_esfuerzo: datos.nivelEsfuerzo,
    largo_km: datos.largoKm,
    desnivel_positivo_m: datos.desnivelPositivoM === null ? null : Math.round(datos.desnivelPositivoM),
    desnivel_negativo_m: datos.desnivelNegativoM === null ? null : Math.round(datos.desnivelNegativoM),
  };
}

function revisarTodo(datos: DatosDeSalida, fotos: FotoDeSalida[]): string | null {
  const problema = revisarLaSalida(datos);
  if (problema) return problema;

  if (fotos.length > MAXIMO_DE_FOTOS) {
    return `Se pueden subir hasta ${MAXIMO_DE_FOTOS} fotos. Sacá alguna.`;
  }
  for (const foto of fotos) {
    if (typeof foto === "string") continue;
    const problemaDeFoto = revisarLaFoto(foto);
    if (problemaDeFoto) return problemaDeFoto;
  }
  return null;
}

async function quienSoy(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

const SESION_CERRADA = "Tu sesión se cerró. Volvé a entrar con tu cuenta y probá de nuevo.";

export async function guardarSalida(
  supabase: SupabaseClient,
  datos: DatosDeSalida,
  fotos: FotoDeSalida[],
  archivo: ArchivoDeSalida | null,
): Promise<Resultado<SalidaGuardada>> {
  const problema = revisarTodo(datos, fotos);
  if (problema) return falla(problema);

  const perfilId = await quienSoy(supabase);
  if (!perfilId) return falla(SESION_CERRADA);

  // 1. La salida.
  const { data: fila, error: errorDeSalida } = await supabase
    .from("salidas")
    .insert({ perfil_id: perfilId, ...filaDeDatos(datos) })
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

  // 3. Compañeros y fotos.
  const avisos = [
    ...(await escribirCompaneros(supabase, salidaId, perfilId, datos.companeros)),
    ...(await escribirFotos(supabase, perfilId, salidaId, fotos)),
  ];

  return exito({ salidaId, avisos });
}

export async function editarSalida(
  supabase: SupabaseClient,
  salidaId: number,
  datos: DatosDeSalida,
  fotos: FotoDeSalida[],
  archivo: CambioDeArchivo,
): Promise<Resultado<SalidaGuardada>> {
  const problema = revisarTodo(datos, fotos);
  if (problema) return falla(problema);

  const perfilId = await quienSoy(supabase);
  if (!perfilId) return falla(SESION_CERRADA);

  const { data: filas, error } = await supabase
    .from("salidas")
    .update(filaDeDatos(datos))
    .eq("id", salidaId)
    .eq("perfil_id", perfilId)
    .is("eliminado_en", null)
    .select("id");

  if (error) return falla(`No se guardaron los cambios: ${traducirErrorDeBase(error.message)}`);
  if (!filas || filas.length === 0) {
    return falla(
      "No se guardaron los cambios: la salida ya no existe o no la cargaste vos. Volvé a la lista para verla al día.",
    );
  }

  const avisos: string[] = [];

  if (archivo.tipo === "nuevo") {
    const subida = await subirElArchivo(supabase, perfilId, salidaId, archivo);
    if (!subida.ok) avisos.push(`El archivo GPS nuevo no se subió: ${subida.error}`);
  } else if (archivo.tipo === "quitar") {
    const { error: errorAlQuitar } = await supabase
      .from("salidas")
      .update({ archivo_url: null, linea_simplificada: null })
      .eq("id", salidaId);
    if (errorAlQuitar) {
      avisos.push(`No se pudo quitar el archivo GPS: ${traducirErrorDeBase(errorAlQuitar.message)}`);
    }
  }

  avisos.push(
    ...(await escribirCompaneros(supabase, salidaId, perfilId, datos.companeros)),
    ...(await escribirFotos(supabase, perfilId, salidaId, fotos)),
  );

  return exito({ salidaId, avisos });
}

/**
 * Deja los compañeros como dice la lista: da de baja a los que salieron y
 * suma a los nuevos. Nada se borra de verdad.
 */
async function escribirCompaneros(
  supabase: SupabaseClient,
  salidaId: number,
  perfilId: string,
  elegidos: string[],
): Promise<string[]> {
  const queridos = new Set(elegidos.filter((id) => id !== perfilId));

  const { data, error } = await supabase
    .from("salidas_companeros")
    .select("id, perfil_id")
    .eq("salida_id", salidaId)
    .is("eliminado_en", null);
  if (error) return [`No se pudieron anotar los compañeros: ${traducirErrorDeBase(error.message)}`];

  const actuales = (data ?? []) as { id: number; perfil_id: string }[];
  const queSalen = actuales.filter((fila) => !queridos.has(fila.perfil_id)).map((fila) => fila.id);
  const yaEstan = new Set(actuales.map((fila) => fila.perfil_id));
  const queEntran = [...queridos].filter((id) => !yaEstan.has(id));

  if (queSalen.length > 0) {
    const { error: errorAlSacar } = await supabase
      .from("salidas_companeros")
      .update({ eliminado_en: new Date().toISOString() })
      .in("id", queSalen);
    if (errorAlSacar) {
      return [`No se pudieron sacar compañeros: ${traducirErrorDeBase(errorAlSacar.message)}`];
    }
  }

  if (queEntran.length > 0) {
    const { error: errorAlSumar } = await supabase
      .from("salidas_companeros")
      .insert(queEntran.map((id) => ({ salida_id: salidaId, perfil_id: id })));
    if (errorAlSumar) {
      return [`No se pudieron sumar compañeros: ${traducirErrorDeBase(errorAlSumar.message)}`];
    }
  }

  return [];
}

/**
 * Deja las fotos como dice la lista, en ese orden: la primera es la portada.
 *
 * Primero sube las nuevas. Recién cuando están arriba da de baja las filas
 * viejas y anota las nuevas: si una subida falla, las fotos que ya había no
 * se pierden por el camino.
 */
async function escribirFotos(
  supabase: SupabaseClient,
  perfilId: string,
  salidaId: number,
  fotos: FotoDeSalida[],
): Promise<string[]> {
  const avisos: string[] = [];
  const direcciones: string[] = [];
  const marca = Date.now();

  for (const [indice, foto] of fotos.entries()) {
    if (typeof foto === "string") {
      direcciones.push(foto);
      continue;
    }
    const donde = rutaDeLaFotoDeSalida(perfilId, salidaId, `${marca}-${indice}`);
    const { error } = await supabase.storage
      .from(DEPOSITO_DE_FOTOS_DE_SALIDA)
      .upload(donde, foto, { contentType: foto.type, upsert: true });
    if (error) {
      avisos.push(`${NOMBRES_DE_FOTO[indice]} no se subió: ${traducirErrorDeBase(error.message)}`);
      continue;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from(DEPOSITO_DE_FOTOS_DE_SALIDA).getPublicUrl(donde);
    direcciones.push(publicUrl);
  }

  const { data: actuales, error: errorAlLeer } = await supabase
    .from("salidas_fotos")
    .select("id, orden, foto_url")
    .eq("salida_id", salidaId)
    .is("eliminado_en", null);
  if (errorAlLeer) {
    return [...avisos, `No se pudieron acomodar las fotos: ${traducirErrorDeBase(errorAlLeer.message)}`];
  }

  const filas = (actuales ?? []) as { id: number; orden: number; foto_url: string }[];
  const igualQueAntes =
    filas.length === direcciones.length &&
    [...filas]
      .sort((a, b) => a.orden - b.orden)
      .every((fila, indice) => fila.foto_url === direcciones[indice]);
  if (igualQueAntes) return avisos;

  if (filas.length > 0) {
    const { error } = await supabase
      .from("salidas_fotos")
      .update({ eliminado_en: new Date().toISOString() })
      .in(
        "id",
        filas.map((fila) => fila.id),
      );
    if (error) {
      return [...avisos, `No se pudieron cambiar las fotos: ${traducirErrorDeBase(error.message)}`];
    }
  }

  if (direcciones.length > 0) {
    const { error } = await supabase
      .from("salidas_fotos")
      .insert(direcciones.map((foto_url, orden) => ({ salida_id: salidaId, orden, foto_url })));
    if (error) {
      return [...avisos, `No se pudieron anotar las fotos: ${traducirErrorDeBase(error.message)}`];
    }
  }

  return avisos;
}

async function subirElArchivo(
  supabase: SupabaseClient,
  perfilId: string,
  salidaId: number,
  { archivo, linea }: ArchivoDeSalida,
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

  // El agregado obliga a bajar el archivo nuevo si se reemplazó uno con el mismo nombre.
  const { error: errorAlAnotar } = await supabase
    .from("salidas")
    .update({
      archivo_url: `${publicUrl}?v=${Date.now()}`,
      linea_simplificada: linea.length >= 2 ? linea : null,
    })
    .eq("id", salidaId);
  if (errorAlAnotar) return falla(traducirErrorDeBase(errorAlAnotar.message));

  return exito();
}
