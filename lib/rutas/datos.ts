import type { FeatureCollection } from "geojson";
import { createClient } from "@/lib/supabase/server";
import { traerTodasLasFilas, type ResultadoLista } from "@/lib/supabase/listas";
import {
  COLUMNAS_RECTANGULO,
  leerRectangulo,
  type ColumnasRectangulo,
} from "@/lib/datos/rectangulo";
import type {
  ActividadRuta,
  NivelEsfuerzo,
  Ruta,
  RutaResumen,
} from "@/types/database";

/**
 * Acceso a la tabla de rutas. Nadie más consulta esa tabla: las pantallas
 * reciben objetos del dominio, no filas.
 *
 * Toda lectura filtra `eliminado_en is null`, porque el borrado es lógico.
 */

type FilaResumen = ColumnasRectangulo & {
  id: number;
  perfil_id: string;
  nombre: string;
  descripcion: string | null;
  actividades: ActividadRuta[];
  dificultad_tecnica: number | null;
  nivel_esfuerzo: NivelEsfuerzo | null;
  largo_km: string | number | null;
  desnivel_positivo_m: number | null;
  desnivel_negativo_m: number | null;
  creado_en: string;
  actualizado_en: string;
};

type FilaCompleta = FilaResumen & {
  comentario: string | null;
  equipo: string | null;
  complicaciones: string | null;
  geometria: FeatureCollection;
  archivo_url: string | null;
};

const COLUMNAS_RESUMEN = `
  id, perfil_id, nombre, descripcion, actividades,
  dificultad_tecnica, nivel_esfuerzo,
  largo_km, desnivel_positivo_m, desnivel_negativo_m,
  ${COLUMNAS_RECTANGULO},
  creado_en, actualizado_en
`;

const COLUMNAS_COMPLETAS = `
  ${COLUMNAS_RESUMEN},
  comentario, equipo, complicaciones, geometria, archivo_url
`;

function leerResumen(fila: FilaResumen): RutaResumen {
  return {
    id: fila.id,
    perfilId: fila.perfil_id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    actividades: fila.actividades ?? [],
    dificultadTecnica: fila.dificultad_tecnica,
    nivelEsfuerzo: fila.nivel_esfuerzo,
    largoKm: fila.largo_km === null ? null : Number(fila.largo_km),
    desnivelPositivoM: fila.desnivel_positivo_m,
    desnivelNegativoM: fila.desnivel_negativo_m,
    rectangulo: leerRectangulo(fila),
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
  };
}

function leerCompleta(fila: FilaCompleta): Ruta {
  return {
    ...leerResumen(fila),
    comentario: fila.comentario,
    equipo: fila.equipo,
    complicaciones: fila.complicaciones,
    geometria: fila.geometria,
    archivoUrl: fila.archivo_url,
  };
}

/**
 * Todas las rutas, sin la geometría.
 *
 * Devuelve además si la lista quedó completa: la pantalla tiene que decirlo
 * cuando no lo está, en vez de mostrar una lista corta como si fuera entera.
 */
export async function traerRutas(): Promise<ResultadoLista<RutaResumen>> {
  const supabase = await createClient();

  const resultado = await traerTodasLasFilas<FilaResumen>((desde, hasta) =>
    supabase
      .from("rutas")
      .select(COLUMNAS_RESUMEN)
      .is("eliminado_en", null)
      .order("creado_en", { ascending: false })
      .order("id", { ascending: false })
      .range(desde, hasta) as never,
  );

  const rutas = resultado.filas.map(leerResumen);

  return resultado.completa
    ? { completa: true, filas: rutas }
    : { completa: false, filas: rutas, motivo: resultado.motivo };
}

/** Una ruta con su línea del recorrido. `null` si no existe o está borrada. */
export async function traerRuta(id: number): Promise<Ruta | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rutas")
    .select(COLUMNAS_COMPLETAS)
    .eq("id", id)
    .is("eliminado_en", null)
    .maybeSingle();

  if (error || !data) return null;

  return leerCompleta(data as unknown as FilaCompleta);
}

/**
 * La fecha de modificación más nueva entre todas las rutas.
 *
 * Es lo que permite detectar si hay novedades sin traer nada: se compara contra
 * la que el celular tiene guardada. Contar y ordenar es trabajo de la base.
 */
export async function ultimaModificacionDeRutas(): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rutas")
    .select("actualizado_en")
    .is("eliminado_en", null)
    .order("actualizado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return (data as { actualizado_en: string }).actualizado_en;
}
