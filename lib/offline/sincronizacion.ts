import type { FeatureCollection } from "geojson";
import { crearClienteEnElNavegador } from "@/lib/supabase/navegador";
import { esperarConexion } from "@/lib/conexion";
import { traerTodasLasFilas } from "@/lib/supabase/listas";
import { leerRectangulo } from "@/lib/datos/rectangulo";
import { COLUMNAS_DE_CAMINO, leerFilaDeCamino, type CaminoGuardado, type CaminoSinLinea } from "@/lib/caminos/datos";
import { COLUMNAS_DE_CIRCUITO, leerFilaDeCircuito, type CircuitoGuardado } from "@/lib/circuitos/datos";
import { prepararCircuitosParaElCelular } from "@/lib/circuitos/preparacion";
import type { CorreccionDeCamino } from "@/lib/circuitos/actualizar";
import { borrarCircuitosPreparadosQueSobran, guardarCircuitosPreparados } from "@/lib/offline/circuitos";
import { borrarLineasDeCaminosQueSobran, guardarLineasDeCaminos } from "@/lib/offline/lineas-de-caminos";
import {
  elPaqueteQuedoViejo,
  guardarPaquete,
  leerPaquete,
  type Paquete,
} from "@/lib/offline/paquete";
import {
  COLUMNAS_DE_ANOTACION,
  leerFilaDeAnotacion,
  type FilaDeAnotacion,
} from "@/lib/anotaciones/fila";
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

const TABLAS_DEL_PAQUETE = ["rutas", "zonas", "sectores", "anotaciones", "caminos", "circuitos", "correcciones_de_caminos"] as const;

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
      const { data, error } = await supabase
        .from(tabla)
        .select("actualizado_en")
        .order("actualizado_en", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(`No se pudo revisar si hay novedades en ${tabla}: ${error.message}. Probá de nuevo con conexión antes de salir.`);

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
      distanciasPorSector: (fila.distancias_por_sector as Record<string, number> | null) ?? {},
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

  // Con la categoría del autor en la misma consulta: de ahí sale si es del
  // administrador o de un usuario, sin guardarlo aparte.
  const resultado = await traerTodasLasFilas<FilaDeAnotacion>(
    (desde, hasta) =>
      supabase
        .from("anotaciones")
        .select(COLUMNAS_DE_ANOTACION)
        .is("eliminado_en", null)
        .order("id", { ascending: true })
        .range(desde, hasta),
  );

  return {
    anotaciones: resultado.filas.map(leerFilaDeAnotacion),
    completa: resultado.completa,
  };
}

/** La lista y las líneas de Caminos viajan juntas; una fila rota bloquea esta actualización. */
async function bajarCaminos(): Promise<{
  caminos: CaminoGuardado[];
  completa: boolean;
  motivo?: string;
}> {
  const supabase = crearClienteEnElNavegador();
  const { count, error: errorDelTotal } = await supabase
    .from("caminos")
    .select("id", { count: "exact", head: true });
  if (errorDelTotal || count === null) {
    return { caminos: [], completa: false, motivo: `No se pudo contar los Caminos: ${errorDelTotal?.message ?? "la base no devolvió el total"}.` };
  }

  const resultado = await traerTodasLasFilas<Record<string, unknown>>((desde, hasta) =>
    supabase
      .from("caminos")
      .select(COLUMNAS_DE_CAMINO)
      .order("id", { ascending: true })
      .range(desde, hasta),
  );
  if (!resultado.completa) return { caminos: [], completa: false, motivo: `La lista de Caminos llegó cortada: ${resultado.motivo}.` };
  if (resultado.filas.length !== count) {
    return { caminos: [], completa: false, motivo: `Llegaron ${resultado.filas.length} Caminos de ${count}. Probá de nuevo antes de salir.` };
  }

  const caminos: CaminoGuardado[] = [];
  for (const fila of resultado.filas) {
    const leido = leerFilaDeCamino(fila);
    if (!leido.ok) return { caminos: [], completa: false, motivo: leido.error };
    caminos.push(leido.datos);
  }
  return { caminos, completa: true };
}

async function bajarCircuitos(): Promise<{ circuitos: CircuitoGuardado[]; completa: boolean; motivo?: string }> {
  const base = crearClienteEnElNavegador();
  const total = await base.from("circuitos").select("id", { count: "exact", head: true })
    .is("eliminado_en", null);
  if (total.error || total.count === null) {
    return { circuitos: [], completa: false, motivo: `No se pudo contar los Circuitos: ${total.error?.message ?? "la base no contestó"}.` };
  }
  const filas = await traerTodasLasFilas<Record<string, unknown>>((desde, hasta) =>
    base.from("circuitos").select(COLUMNAS_DE_CIRCUITO).is("eliminado_en", null)
      .order("id", { ascending: true }).range(desde, hasta));
  if (!filas.completa || filas.filas.length !== total.count) {
    return { circuitos: [], completa: false, motivo: "La lista de Circuitos llegó incompleta. Volvé a poner la app al día con señal." };
  }
  const circuitos: CircuitoGuardado[] = [];
  for (const fila of filas.filas) {
    const leido = leerFilaDeCircuito(fila);
    if (!leido.ok) return { circuitos: [], completa: false, motivo: leido.error };
    circuitos.push(leido.datos);
  }
  return { circuitos, completa: true };
}

async function bajarCorrecciones(): Promise<{ correcciones: CorreccionDeCamino[]; completa: boolean; motivo?: string }> {
  const base = crearClienteEnElNavegador();
  const total = await base.from("correcciones_de_caminos").select("id", { count: "exact", head: true });
  if (total.error || total.count === null) {
    return { correcciones: [], completa: false, motivo: `No se pudo contar las correcciones de Caminos: ${total.error?.message ?? "la base no contestó"}.` };
  }
  const filas = await traerTodasLasFilas<Record<string, unknown>>((desde, hasta) =>
    base.from("correcciones_de_caminos")
      .select("id, camino_id, version_anterior, version_nueva, geometria_anterior, geometria_nueva")
      .order("id", { ascending: true }).range(desde, hasta));
  if (!filas.completa || filas.filas.length !== total.count) {
    return { correcciones: [], completa: false, motivo: "La historia de Caminos llegó incompleta. Volvé a poner la app al día con señal." };
  }
  const correcciones: CorreccionDeCamino[] = [];
  for (const fila of filas.filas) {
    const anterior = fila.geometria_anterior as { coordinates?: unknown } | null;
    const nueva = fila.geometria_nueva as { coordinates?: unknown } | null;
    if (!Number.isInteger(Number(fila.camino_id)) || !Number.isInteger(fila.version_anterior)
      || !Number.isInteger(fila.version_nueva) || !Array.isArray(anterior?.coordinates)
      || !Array.isArray(nueva?.coordinates)) {
      return { correcciones: [], completa: false, motivo: "Una corrección de Camino llegó incompleta. Avisale al administrador." };
    }
    correcciones.push({ caminoId: Number(fila.camino_id), versionAnterior: fila.version_anterior as number,
      versionNueva: fila.version_nueva as number,
      coordenadasAnteriores: anterior.coordinates as number[][], coordenadasNuevas: nueva.coordinates as number[][] });
  }
  return { correcciones, completa: true };
}

/**
 * Pone el paquete al día si hace falta.
 *
 * **No llamar durante una navegación.** Navegar no consulta internet nunca.
 */
export async function sincronizarPaquete(): Promise<ResultadoDeSincronizacion> {
  const guardado = leerPaquete();

  // Señal que sirve, no red enganchada: con la rayita del cerro es «sin señal».
  if (!(await esperarConexion())) {
    return { clase: "sin_senal", paquete: guardado };
  }

  try {
    const ultimaEnLaBase = await ultimaModificacionEnLaBase();

    if (!elPaqueteQuedoViejo(guardado, ultimaEnLaBase)) {
      return { clase: "al_dia", paquete: guardado };
    }

    const [rutas, zonas, sectores, anotaciones, caminos, circuitos, correcciones] = await Promise.all([
      bajarRutas(),
      bajarZonas(),
      bajarSectores(),
      bajarAnotaciones(),
      bajarCaminos(),
      bajarCircuitos(),
      bajarCorrecciones(),
    ]);

    // Si algo vino cortado, lo que había sigue sirviendo. No se pisa a medias.
    if (
      !rutas.completa ||
      !zonas.completa ||
      !sectores.completa ||
      !anotaciones.completa ||
      !caminos.completa || !circuitos.completa || !correcciones.completa
    ) {
      return {
        clase: "fallo",
        paquete: guardado,
        motivo:
          rutas.motivo ?? caminos.motivo ?? circuitos.motivo ?? correcciones.motivo ??
          "La descarga vino cortada, así que se dejó lo que ya estaba guardado.",
      };
    }

    for (const [rutaId, recorrido] of rutas.recorridos) {
      if (!(await guardarRecorrido(rutaId, recorrido))) {
        return {
          clase: "fallo",
          paquete: guardado,
          motivo: "Una línea de ruta no se pudo guardar en este celular. Liberá espacio y abrí la app de nuevo con conexión antes de salir.",
        };
      }
    }

    const preparados = prepararCircuitosParaElCelular(circuitos.circuitos, caminos.caminos, correcciones.correcciones);
    if (!preparados.ok) {
      return { clase: "fallo", paquete: guardado, motivo: preparados.error };
    }
    if (!(await guardarCircuitosPreparados(preparados.datos.dibujos))) {
      return { clase: "fallo", paquete: guardado,
        motivo: "Los Circuitos no entraron en este celular. Liberá espacio y abrí la app con conexión antes de salir." };
    }
    const caminosVivos = caminos.caminos.filter((camino) => camino.eliminadoEn === null);
    if (!(await guardarLineasDeCaminos(caminosVivos))) {
      return {
        clase: "fallo",
        paquete: guardado,
        motivo: "Las líneas de Caminos no entraron en este celular. Liberá espacio y abrí la app con conexión antes de salir.",
      };
    }

    const caminosSinLinea: CaminoSinLinea[] = caminosVivos.map(({ coordenadas, ...camino }) => {
      // La línea ya quedó en el depósito grande; no la dupliques en el guardado simple.
      void coordenadas;
      return camino;
    });

    const nuevo: Omit<Paquete, "guardadoEn"> = {
      rutas: rutas.resumenes,
      caminos: caminosSinLinea,
      circuitos: preparados.datos.fichas,
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

    await borrarLineasDeCaminosQueSobran(caminosSinLinea);
    await borrarCircuitosPreparadosQueSobran(preparados.datos.fichas);
    await borrarRecorridosQueSobran(rutas.resumenes.map((ruta) => ruta.id));

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
