import type { FeatureCollection } from "geojson";
import { crearClienteEnElNavegador } from "@/lib/supabase/navegador";
import { traerTodasLasFilas } from "@/lib/supabase/listas";
import { leerRectangulo } from "@/lib/datos/rectangulo";
import {
  elPaqueteQuedoViejo,
  guardarPaquete,
  leerPaquete,
  type Paquete,
} from "@/lib/offline/paquete";
import {
  borrarRecorridosQueSobran,
  guardarRecorrido,
} from "@/lib/offline/recorridos";
import type {
  Anotacion,
  RutaSinRecorrido,
  Sector,
  Zona,
} from "@/types/database";

/**
 * Traer el paquete offline al celular.
 *
 * **Es automática y muda.** Si hay novedades en algo que el usuario ya tiene,
 * se actualiza solo: sin cartel de «hay novedades», sin botón de actualizar, sin
 * preguntar nada.
 *
 * Dos límites que la protegen:
 * 1. Solo ocurre con señal, y **nunca durante una navegación**.
 * 2. Si falla a mitad de camino, **queda lo que había**. Una actualización
 *    incompleta nunca puede romper un paquete que ya servía.
 *
 * Ver docs/decisiones/012-modelo-de-descarga.md
 */

const TABLAS_DEL_PAQUETE = ["rutas", "zonas", "sectores", "anotaciones"] as const;

export type ResultadoDeSincronizacion =
  | { clase: "al_dia"; paquete: Paquete | null }
  | { clase: "actualizado"; paquete: Paquete }
  | { clase: "sin_senal"; paquete: Paquete | null }
  | { clase: "fallo"; paquete: Paquete | null; motivo: string };

/**
 * La fecha de modificación más nueva de toda la base.
 *
 * Una consulta por tabla, trayendo una sola fila cada una. Ordenar es trabajo
 * de la base, no del celular.
 */
async function ultimaModificacionEnLaBase(): Promise<string | null> {
  const supabase = crearClienteEnElNavegador();

  const fechas = await Promise.all(
    TABLAS_DEL_PAQUETE.map(async (tabla) => {
      const { data } = await supabase
        .from(tabla)
        .select("actualizado_en")
        .order("actualizado_en", { ascending: false })
        .limit(1)
        .maybeSingle();

      return (data as { actualizado_en: string } | null)?.actualizado_en ?? null;
    }),
  );

  const validas = fechas.filter((fecha): fecha is string => Boolean(fecha));
  if (validas.length === 0) return null;

  return validas.reduce((masNueva, fecha) =>
    new Date(fecha) > new Date(masNueva) ? fecha : masNueva,
  );
}

type FilaConRectangulo = {
  lat_norte: number;
  lat_sur: number;
  lon_este: number;
  lon_oeste: number;
};

async function bajarRutas(): Promise<{
  resumenes: RutaSinRecorrido[];
  recorridos: Map<number, FeatureCollection>;
  completa: boolean;
  motivo?: string;
}> {
  const supabase = crearClienteEnElNavegador();

  const resultado = await traerTodasLasFilas<
    FilaConRectangulo & Record<string, unknown>
  >((desde, hasta) =>
    supabase
      .from("rutas")
      .select("*")
      .is("eliminado_en", null)
      .order("id", { ascending: true })
      .range(desde, hasta),
  );

  const resumenes: RutaSinRecorrido[] = [];
  const recorridos = new Map<number, FeatureCollection>();

  for (const fila of resultado.filas) {
    const id = Number(fila.id);

    resumenes.push({
      id,
      perfilId: String(fila.perfil_id),
      nombre: String(fila.nombre),
      descripcion: (fila.descripcion as string | null) ?? null,
      actividades: (fila.actividades as RutaSinRecorrido["actividades"]) ?? [],
      dificultadTecnica: (fila.dificultad_tecnica as number | null) ?? null,
      nivelEsfuerzo: (fila.nivel_esfuerzo as RutaSinRecorrido["nivelEsfuerzo"]) ?? null,
      largoKm: fila.largo_km === null ? null : Number(fila.largo_km),
      desnivelPositivoM: (fila.desnivel_positivo_m as number | null) ?? null,
      desnivelNegativoM: (fila.desnivel_negativo_m as number | null) ?? null,
      // Lo que hay que poder leer en el cerro, donde no hay señal.
      comentario: (fila.comentario as string | null) ?? null,
      equipo: (fila.equipo as string | null) ?? null,
      complicaciones: (fila.complicaciones as string | null) ?? null,
      archivoUrl: (fila.archivo_url as string | null) ?? null,
      rectangulo: leerRectangulo(fila),
      color: (fila.color as string | null) ?? "naranja",
      creadoEn: String(fila.creado_en),
      actualizadoEn: String(fila.actualizado_en),
    });

    if (fila.geometria) {
      recorridos.set(id, fila.geometria as FeatureCollection);
    }
  }

  return resultado.completa
    ? { resumenes, recorridos, completa: true }
    : { resumenes, recorridos, completa: false, motivo: resultado.motivo };
}

async function bajarZonas(): Promise<{ zonas: Zona[]; completa: boolean }> {
  const supabase = crearClienteEnElNavegador();

  const resultado = await traerTodasLasFilas<
    FilaConRectangulo & Record<string, unknown>
  >((desde, hasta) =>
    supabase
      .from("zonas")
      .select("*")
      .is("eliminado_en", null)
      .order("id", { ascending: true })
      .range(desde, hasta),
  );

  const zonas: Zona[] = resultado.filas.map((fila) => ({
    id: Number(fila.id),
    perfilId: String(fila.perfil_id),
    nombre: String(fila.nombre),
    descripcion: (fila.descripcion as string | null) ?? null,
    fotoUrl: (fila.foto_url as string | null) ?? null,
    rectangulo: leerRectangulo(fila),
    creadoEn: String(fila.creado_en),
    actualizadoEn: String(fila.actualizado_en),
  }));

  return { zonas, completa: resultado.completa };
}

async function bajarSectores(): Promise<{
  sectores: Sector[];
  completa: boolean;
}> {
  const supabase = crearClienteEnElNavegador();

  const resultado = await traerTodasLasFilas<
    FilaConRectangulo & Record<string, unknown>
  >((desde, hasta) =>
    supabase
      .from("sectores")
      .select("*")
      .is("eliminado_en", null)
      .order("id", { ascending: true })
      .range(desde, hasta),
  );

  const sectores: Sector[] = resultado.filas.map((fila) => ({
    id: Number(fila.id),
    zonaId: Number(fila.zona_id),
    perfilId: String(fila.perfil_id),
    nombre: String(fila.nombre),
    descripcion: (fila.descripcion as string | null) ?? null,
    rectangulo: leerRectangulo(fila),
    creadoEn: String(fila.creado_en),
    actualizadoEn: String(fila.actualizado_en),
  }));

  return { sectores, completa: resultado.completa };
}

async function bajarAnotaciones(): Promise<{
  anotaciones: Anotacion[];
  completa: boolean;
}> {
  const supabase = crearClienteEnElNavegador();

  const resultado = await traerTodasLasFilas<Record<string, unknown>>(
    (desde, hasta) =>
      supabase
        .from("anotaciones")
        .select("*")
        .is("eliminado_en", null)
        .order("id", { ascending: true })
        .range(desde, hasta),
  );

  const anotaciones: Anotacion[] = resultado.filas.map((fila) => ({
    id: Number(fila.id),
    sectorId: Number(fila.sector_id),
    perfilId: String(fila.perfil_id),
    tipo: fila.tipo as Anotacion["tipo"],
    origen: (fila.origen as Anotacion["origen"]) ?? "manual",
    icono: (fila.icono as Anotacion["icono"]) ?? null,
    color: (fila.color as string | null) ?? null,
    comentario: (fila.comentario as string | null) ?? null,
    fotoUrl: (fila.foto_url as string | null) ?? null,
    geometria: fila.geometria as Anotacion["geometria"],
    creadoEn: String(fila.creado_en),
    actualizadoEn: String(fila.actualizado_en),
  }));

  return { anotaciones, completa: resultado.completa };
}

/**
 * Pone el paquete al día si hace falta.
 *
 * **No llamar durante una navegación.** Navegar no consulta internet nunca.
 */
export async function sincronizarPaquete(): Promise<ResultadoDeSincronizacion> {
  const guardado = leerPaquete();

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { clase: "sin_senal", paquete: guardado };
  }

  try {
    const ultimaEnLaBase = await ultimaModificacionEnLaBase();

    if (!elPaqueteQuedoViejo(guardado, ultimaEnLaBase)) {
      return { clase: "al_dia", paquete: guardado };
    }

    const [rutas, zonas, sectores, anotaciones] = await Promise.all([
      bajarRutas(),
      bajarZonas(),
      bajarSectores(),
      bajarAnotaciones(),
    ]);

    // Si algo vino cortado, lo que había sigue sirviendo. No se pisa a medias.
    if (
      !rutas.completa ||
      !zonas.completa ||
      !sectores.completa ||
      !anotaciones.completa
    ) {
      return {
        clase: "fallo",
        paquete: guardado,
        motivo:
          rutas.motivo ??
          "La descarga vino cortada, así que se dejó lo que ya estaba guardado.",
      };
    }

    for (const [rutaId, recorrido] of rutas.recorridos) {
      await guardarRecorrido(rutaId, recorrido);
    }

    await borrarRecorridosQueSobran(rutas.resumenes.map((ruta) => ruta.id));

    const nuevo: Omit<Paquete, "guardadoEn"> = {
      rutas: rutas.resumenes,
      zonas: zonas.zonas,
      sectores: sectores.sectores,
      anotaciones: anotaciones.anotaciones,
      ultimaModificacion: ultimaEnLaBase,
    };

    const escritura = guardarPaquete(nuevo);

    if (!escritura.ok) {
      return {
        clase: "fallo",
        paquete: guardado,
        motivo: escritura.sinEspacio
          ? "No entra en el celular: liberá espacio y volvé a abrir la app."
          : "El navegador no dejó guardar los datos en este celular.",
      };
    }

    return {
      clase: "actualizado",
      paquete: { ...nuevo, guardadoEn: new Date().toISOString() },
    };
  } catch (error) {
    return {
      clase: "fallo",
      paquete: guardado,
      motivo:
        error instanceof Error
          ? error.message
          : "No se pudieron traer los datos.",
    };
  }
}
