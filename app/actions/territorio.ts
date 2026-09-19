"use server";

import { revalidatePath } from "next/cache";
import type { LineString, Point } from "geojson";
import { traerUsuario } from "@/lib/cuenta/sesion";
import { crearClienteEnElServidor } from "@/lib/supabase/servidor";
import {
  escribirRectangulo,
  rectanguloEsValido,
} from "@/lib/datos/rectangulo";
import {
  exito,
  falla,
  traducirErrorDeBase,
  type Resultado,
} from "@/lib/datos/resultado";
import type { IconoPunto, Rectangulo, TipoAnotacion } from "@/types/database";

/**
 * Alta, edición y borrado de zonas, sectores y anotaciones.
 *
 * Las tres cosas son territorio, y las tres son **tarea exclusiva del
 * administrador** mientras el producto sea chico. La base lo verifica por su
 * cuenta; acá se valida antes para poder decir qué pasó en criollo.
 *
 * Borrar es marcar `eliminado_en`. Nada se borra de verdad.
 */

function limpiar(texto: string | null): string | null {
  const limpio = texto?.trim();
  return limpio ? limpio : null;
}

async function exigirSesion(): Promise<{ id: string } | null> {
  const usuario = await traerUsuario();
  return usuario?.id ? { id: usuario.id } : null;
}

const SIN_SESION = "Entrá con tu cuenta para poder hacer esto.";

const RECTANGULO_INVALIDO =
  "El rectángulo está dado vuelta: la esquina noroeste tiene que quedar arriba y a la izquierda de la sudeste. Revisá las coordenadas que pegaste.";

// ------------------------------------------------------------------- zonas

export type DatosDeZona = {
  nombre: string;
  descripcion: string | null;
  rectangulo: Rectangulo;
};

export async function crearZona(
  datos: DatosDeZona,
): Promise<Resultado<{ zonaId: number }>> {
  const usuario = await exigirSesion();
  if (!usuario) return falla(SIN_SESION);
  if (!limpiar(datos.nombre)) return falla("Ponele un nombre a la zona.");
  if (!rectanguloEsValido(datos.rectangulo)) return falla(RECTANGULO_INVALIDO);

  const supabase = await crearClienteEnElServidor();
  const { data, error } = await supabase
    .from("zonas")
    .insert({
      perfil_id: usuario.id,
      nombre: datos.nombre.trim(),
      descripcion: limpiar(datos.descripcion),
      ...escribirRectangulo(datos.rectangulo),
    })
    .select("id")
    .single();

  if (error || !data) {
    return falla(
      traducirErrorDeBase(error?.message ?? "No se pudo guardar la zona."),
    );
  }

  revalidatePath("/zonas");
  return exito({ zonaId: (data as { id: number }).id });
}

export async function editarZona(
  zonaId: number,
  datos: DatosDeZona,
): Promise<Resultado> {
  const usuario = await exigirSesion();
  if (!usuario) return falla(SIN_SESION);
  if (!limpiar(datos.nombre)) return falla("Ponele un nombre a la zona.");
  if (!rectanguloEsValido(datos.rectangulo)) return falla(RECTANGULO_INVALIDO);

  const supabase = await crearClienteEnElServidor();
  const { error } = await supabase
    .from("zonas")
    .update({
      nombre: datos.nombre.trim(),
      descripcion: limpiar(datos.descripcion),
      ...escribirRectangulo(datos.rectangulo),
    })
    .eq("id", zonaId)
    .is("eliminado_en", null);

  if (error) return falla(traducirErrorDeBase(error.message));

  revalidatePath("/zonas");
  revalidatePath(`/zonas/${zonaId}`);
  return exito();
}

export async function borrarZona(zonaId: number): Promise<Resultado> {
  const usuario = await exigirSesion();
  if (!usuario) return falla(SIN_SESION);

  const supabase = await crearClienteEnElServidor();
  const ahora = new Date().toISOString();

  // Los sectores de la zona se van con ella, y sus anotaciones con ellos.
  const { data: sectores } = await supabase
    .from("sectores")
    .select("id")
    .eq("zona_id", zonaId)
    .is("eliminado_en", null);

  const idsDeSectores = ((sectores ?? []) as { id: number }[]).map((s) => s.id);

  if (idsDeSectores.length > 0) {
    await supabase
      .from("anotaciones")
      .update({ eliminado_en: ahora })
      .in("sector_id", idsDeSectores)
      .is("eliminado_en", null);

    await supabase
      .from("sectores")
      .update({ eliminado_en: ahora })
      .eq("zona_id", zonaId)
      .is("eliminado_en", null);
  }

  const { error } = await supabase
    .from("zonas")
    .update({ eliminado_en: ahora })
    .eq("id", zonaId)
    .is("eliminado_en", null);

  if (error) return falla(traducirErrorDeBase(error.message));

  revalidatePath("/zonas");
  return exito();
}

// ---------------------------------------------------------------- sectores

export type DatosDeSector = {
  zonaId: number;
  nombre: string;
  descripcion: string | null;
  rectangulo: Rectangulo;
};

export async function crearSector(
  datos: DatosDeSector,
): Promise<Resultado<{ sectorId: number }>> {
  const usuario = await exigirSesion();
  if (!usuario) return falla(SIN_SESION);
  if (!limpiar(datos.nombre)) return falla("Ponele un nombre al sector.");
  if (!rectanguloEsValido(datos.rectangulo)) return falla(RECTANGULO_INVALIDO);

  const supabase = await crearClienteEnElServidor();
  const { data, error } = await supabase
    .from("sectores")
    .insert({
      zona_id: datos.zonaId,
      perfil_id: usuario.id,
      nombre: datos.nombre.trim(),
      descripcion: limpiar(datos.descripcion),
      ...escribirRectangulo(datos.rectangulo),
    })
    .select("id")
    .single();

  if (error || !data) {
    return falla(
      traducirErrorDeBase(error?.message ?? "No se pudo guardar el sector."),
    );
  }

  revalidatePath(`/zonas/${datos.zonaId}`);
  return exito({ sectorId: (data as { id: number }).id });
}

export async function editarSector(
  sectorId: number,
  datos: DatosDeSector,
): Promise<Resultado> {
  const usuario = await exigirSesion();
  if (!usuario) return falla(SIN_SESION);
  if (!limpiar(datos.nombre)) return falla("Ponele un nombre al sector.");
  if (!rectanguloEsValido(datos.rectangulo)) return falla(RECTANGULO_INVALIDO);

  const supabase = await crearClienteEnElServidor();
  const { error } = await supabase
    .from("sectores")
    .update({
      nombre: datos.nombre.trim(),
      descripcion: limpiar(datos.descripcion),
      ...escribirRectangulo(datos.rectangulo),
    })
    .eq("id", sectorId)
    .is("eliminado_en", null);

  if (error) return falla(traducirErrorDeBase(error.message));

  revalidatePath(`/zonas/${datos.zonaId}`);
  return exito();
}

export async function borrarSector(sectorId: number): Promise<Resultado> {
  const usuario = await exigirSesion();
  if (!usuario) return falla(SIN_SESION);

  const supabase = await crearClienteEnElServidor();
  const ahora = new Date().toISOString();

  await supabase
    .from("anotaciones")
    .update({ eliminado_en: ahora })
    .eq("sector_id", sectorId)
    .is("eliminado_en", null);

  const { error } = await supabase
    .from("sectores")
    .update({ eliminado_en: ahora })
    .eq("id", sectorId)
    .is("eliminado_en", null);

  if (error) return falla(traducirErrorDeBase(error.message));

  revalidatePath("/zonas");
  return exito();
}

// ------------------------------------------------------------- anotaciones

export type DatosDeAnotacion = {
  sectorId: number;
  tipo: TipoAnotacion;
  /** Obligatorio cuando el tipo es `punto`. */
  icono: IconoPunto | null;
  /** Obligatorio cuando el tipo es `trazo`. */
  color: string | null;
  comentario: string | null;
  geometria: Point | LineString;
};

function revisarAnotacion(datos: DatosDeAnotacion): string | null {
  if (datos.tipo === "punto") {
    if (!datos.icono) return "Elegí qué es el punto que estás marcando.";
    if (datos.geometria.type !== "Point") {
      return "Un punto tiene que marcarse en un solo lugar del mapa.";
    }
  }

  if (datos.tipo === "trazo") {
    if (!datos.color) return "Elegí un color para el trazo.";
    if (datos.geometria.type !== "LineString") {
      return "Un trazo necesita al menos dos puntos para formar una línea.";
    }
    if (datos.geometria.coordinates.length < 2) {
      return "Un trazo necesita al menos dos puntos para formar una línea.";
    }
  }

  return null;
}

export async function crearAnotacion(
  datos: DatosDeAnotacion,
): Promise<Resultado<{ anotacionId: number }>> {
  const usuario = await exigirSesion();
  if (!usuario) return falla(SIN_SESION);

  const problema = revisarAnotacion(datos);
  if (problema) return falla(problema);

  const supabase = await crearClienteEnElServidor();
  const { data, error } = await supabase
    .from("anotaciones")
    .insert({
      sector_id: datos.sectorId,
      perfil_id: usuario.id,
      tipo: datos.tipo,
      icono: datos.tipo === "punto" ? datos.icono : null,
      color: datos.tipo === "trazo" ? datos.color : null,
      comentario: limpiar(datos.comentario),
      geometria: datos.geometria,
    })
    .select("id")
    .single();

  if (error || !data) {
    return falla(
      traducirErrorDeBase(error?.message ?? "No se pudo guardar la anotación."),
    );
  }

  revalidatePath("/zonas");
  return exito({ anotacionId: (data as { id: number }).id });
}

export async function editarAnotacion(
  anotacionId: number,
  datos: DatosDeAnotacion,
): Promise<Resultado> {
  const usuario = await exigirSesion();
  if (!usuario) return falla(SIN_SESION);

  const problema = revisarAnotacion(datos);
  if (problema) return falla(problema);

  const supabase = await crearClienteEnElServidor();
  const { error } = await supabase
    .from("anotaciones")
    .update({
      tipo: datos.tipo,
      icono: datos.tipo === "punto" ? datos.icono : null,
      color: datos.tipo === "trazo" ? datos.color : null,
      comentario: limpiar(datos.comentario),
      geometria: datos.geometria,
    })
    .eq("id", anotacionId)
    .is("eliminado_en", null);

  if (error) return falla(traducirErrorDeBase(error.message));

  revalidatePath("/zonas");
  return exito();
}

export async function borrarAnotacion(anotacionId: number): Promise<Resultado> {
  const usuario = await exigirSesion();
  if (!usuario) return falla(SIN_SESION);

  const supabase = await crearClienteEnElServidor();
  const { error } = await supabase
    .from("anotaciones")
    .update({ eliminado_en: new Date().toISOString() })
    .eq("id", anotacionId)
    .is("eliminado_en", null);

  if (error) return falla(traducirErrorDeBase(error.message));

  revalidatePath("/zonas");
  return exito();
}
