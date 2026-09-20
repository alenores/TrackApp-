"use server";

import { revalidatePath } from "next/cache";
import type { FeatureCollection } from "geojson";
import { traerUsuario } from "@/lib/cuenta/sesion";
import { crearClienteEnElServidor } from "@/lib/supabase/servidor";
import { escribirRectangulo } from "@/lib/datos/rectangulo";
import { exito, falla, traducirErrorDeBase, type Resultado } from "@/lib/datos/resultado";
import { calcularNumerosDelRecorrido } from "@/lib/rutas/recorrido";
import {
  claseDelArchivoDeRuta,
  CLASE_DE_RESPALDO,
  loRechazoPorLaClase,
} from "@/lib/rutas/archivo";
import type { ActividadRuta, NivelEsfuerzo } from "@/types/database";

const DEPOSITO = "archivos-ruta";

/**
 * Alta, edición y borrado de rutas.
 *
 * El largo y el desnivel se calculan acá desde el recorrido: no llegan desde la
 * pantalla ni se pueden corregir a mano.
 *
 * Borrar es marcar `eliminado_en`. Nada se borra de verdad.
 */

export type DatosDeRuta = {
  nombre: string;
  descripcion: string | null;
  comentario: string | null;
  actividades: ActividadRuta[];
  dificultadTecnica: number | null;
  nivelEsfuerzo: NivelEsfuerzo | null;
  equipo: string | null;
  complicaciones: string | null;
};

function limpiar(texto: string | null): string | null {
  const limpio = texto?.trim();
  return limpio ? limpio : null;
}

function rutaDelArchivo(perfilId: string, rutaId: number, nombre: string) {
  const extension = nombre.toLowerCase().split(".").pop() ?? "gpx";
  return `${perfilId}/${rutaId}.${extension}`;
}

export async function crearRuta(
  datos: DatosDeRuta,
  geometria: FeatureCollection,
  archivo: File | null,
): Promise<Resultado<{ rutaId: number }>> {
  const usuario = await traerUsuario();
  if (!usuario?.id) {
    return falla("Entrá con tu cuenta para poder subir una ruta.");
  }

  if (!limpiar(datos.nombre)) {
    return falla("Ponele un nombre a la ruta.");
  }

  if (datos.actividades.length === 0) {
    return falla("Elegí al menos un tipo de actividad para la ruta.");
  }

  const numeros = calcularNumerosDelRecorrido(geometria);
  if (!numeros) {
    return falla(
      "El archivo no tiene ningún recorrido dibujado. Fijate que sea el archivo del track y no otro.",
    );
  }

  const supabase = await crearClienteEnElServidor();

  const { data, error } = await supabase
    .from("rutas")
    .insert({
      perfil_id: usuario.id,
      nombre: datos.nombre.trim(),
      descripcion: limpiar(datos.descripcion),
      comentario: limpiar(datos.comentario),
      actividades: datos.actividades,
      dificultad_tecnica: datos.dificultadTecnica,
      nivel_esfuerzo: datos.nivelEsfuerzo,
      equipo: limpiar(datos.equipo),
      complicaciones: limpiar(datos.complicaciones),
      largo_km: numeros.largoKm,
      desnivel_positivo_m: numeros.desnivelPositivoM,
      desnivel_negativo_m: numeros.desnivelNegativoM,
      geometria,
      ...escribirRectangulo(numeros.rectangulo),
    })
    .select("id")
    .single();

  if (error || !data) {
    return falla(
      traducirErrorDeBase(error?.message ?? "No se pudo guardar la ruta."),
    );
  }

  const rutaId = (data as { id: number }).id;

  if (archivo) {
    const guardado = await guardarArchivo(rutaId, usuario.id, archivo);
    if (!guardado.ok) {
      // La ruta ya existe y sirve; lo único que falta es el archivo original.
      await supabase
        .from("rutas")
        .update({ eliminado_en: new Date().toISOString() })
        .eq("id", rutaId);
      return falla(guardado.error);
    }
  }

  revalidatePath("/");
  revalidatePath("/rutas");

  return exito({ rutaId });
}

async function guardarArchivo(
  rutaId: number,
  perfilId: string,
  archivo: File,
): Promise<Resultado> {
  const supabase = await crearClienteEnElServidor();
  const ruta = rutaDelArchivo(perfilId, rutaId, archivo.name);
  const bytes = new Uint8Array(await archivo.arrayBuffer());

  // Se manda una copia en cada intento: el que sube se queda con la que recibe.
  const subir = async (clase: string) => {
    const { error } = await supabase.storage
      .from(DEPOSITO)
      .upload(ruta, bytes.slice(), { contentType: clase, upsert: true });
    return error;
  };

  const clase = claseDelArchivoDeRuta(archivo.name);
  let errorDeSubida = await subir(clase);

  // Si la base no acepta la clase específica, se reintenta declarándolo como el
  // XML que en el fondo es. Son dos intentos y ninguno más.
  if (errorDeSubida && loRechazoPorLaClase(errorDeSubida.message)) {
    errorDeSubida = await subir(CLASE_DE_RESPALDO);
  }

  if (errorDeSubida) {
    return falla(
      `No se pudo subir el archivo: ${errorDeSubida.message}. Probá de nuevo; si sigue fallando, fijate que el archivo no supere los 10 MB.`,
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(DEPOSITO).getPublicUrl(ruta);

  const { error } = await supabase
    .from("rutas")
    .update({ archivo_url: publicUrl })
    .eq("id", rutaId);

  if (error) return falla(traducirErrorDeBase(error.message));

  return exito();
}

export async function editarRuta(
  rutaId: number,
  datos: DatosDeRuta,
): Promise<Resultado> {
  const usuario = await traerUsuario();
  if (!usuario?.id) {
    return falla("Entrá con tu cuenta para poder editar una ruta.");
  }

  if (!limpiar(datos.nombre)) {
    return falla("Ponele un nombre a la ruta.");
  }

  if (datos.actividades.length === 0) {
    return falla("Elegí al menos un tipo de actividad para la ruta.");
  }

  const supabase = await crearClienteEnElServidor();

  const { error } = await supabase
    .from("rutas")
    .update({
      nombre: datos.nombre.trim(),
      descripcion: limpiar(datos.descripcion),
      comentario: limpiar(datos.comentario),
      actividades: datos.actividades,
      dificultad_tecnica: datos.dificultadTecnica,
      nivel_esfuerzo: datos.nivelEsfuerzo,
      equipo: limpiar(datos.equipo),
      complicaciones: limpiar(datos.complicaciones),
    })
    .eq("id", rutaId)
    .is("eliminado_en", null);

  if (error) return falla(traducirErrorDeBase(error.message));

  revalidatePath("/rutas");
  revalidatePath(`/rutas/${rutaId}`);

  return exito();
}

/** Borrar es marcar la fecha de borrado. La fila queda. */
export async function borrarRuta(rutaId: number): Promise<Resultado> {
  const usuario = await traerUsuario();
  if (!usuario?.id) {
    return falla("Entrá con tu cuenta para poder borrar una ruta.");
  }

  const supabase = await crearClienteEnElServidor();

  const { error } = await supabase
    .from("rutas")
    .update({ eliminado_en: new Date().toISOString() })
    .eq("id", rutaId)
    .is("eliminado_en", null);

  if (error) return falla(traducirErrorDeBase(error.message));

  revalidatePath("/");
  revalidatePath("/rutas");

  return exito();
}
