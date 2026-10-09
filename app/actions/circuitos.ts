"use server";

import { crearClienteEnElServidor } from "@/lib/supabase/servidor";
import { traerTodasLasFilas } from "@/lib/supabase/listas";
import { exito, falla, type Resultado } from "@/lib/datos/resultado";
import { ACTIVIDADES_RUTA, CATEGORIAS_USUARIO, type ActividadRuta, type CategoriaUsuario } from "@/types/database";
import { leerCaminos } from "@/app/actions/caminos";
import { COLUMNAS_DE_CAMINO, leerFilaDeCamino, type CaminoGuardado } from "@/lib/caminos/datos";
import { COLUMNAS_DE_CIRCUITO, datosParaLaBase, leerFilaDeCircuito, prepararCircuito,
  revisarDatosDelCircuito, type CircuitoGuardado } from "@/lib/circuitos/datos";
import { alturasPropiasParaLaBase, medirAlturasPropias } from "@/lib/circuitos/alturas";
import { alturasDelRelieve } from "@/lib/alturas/relieve-del-servidor";
import type { CorreccionDeCamino } from "@/lib/circuitos/actualizar";

type Cliente = Awaited<ReturnType<typeof crearClienteEnElServidor>>;
type QuienUsa = { perfilId: string; categoria: CategoriaUsuario };
const tope = () => AbortSignal.timeout(15_000);

function motivo(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function sesion(base: Cliente): Promise<Resultado<QuienUsa>> {
  const { data, error } = await base.auth.getClaims();
  const perfilId = data?.claims?.sub;
  if (error || typeof perfilId !== "string" || !perfilId) {
    return falla("Tu sesión se cerró. Volvé a entrar para ver los Circuitos.");
  }
  const { data: perfil, error: errorPerfil } = await base.from("perfiles")
    .select("categoria").eq("id", perfilId).is("eliminado_en", null)
    .abortSignal(tope()).maybeSingle();
  if (errorPerfil) return falla(`No se pudo consultar tu perfil: ${errorPerfil.message}. Volvé a intentar.`);
  const categoria = (perfil as { categoria?: unknown } | null)?.categoria;
  if (!(CATEGORIAS_USUARIO as readonly unknown[]).includes(categoria)) {
    return falla("Tu cuenta no tiene perfil en la app. Avisale al administrador.");
  }
  return exito({ perfilId, categoria: categoria as CategoriaUsuario });
}

async function conSesion<T>(
  accion: string,
  hacer: (base: Cliente, quien: QuienUsa) => Promise<Resultado<T>>,
): Promise<Resultado<T>> {
  try {
    const base = await crearClienteEnElServidor();
    const quien = await sesion(base);
    if (!quien.ok) return quien;
    return await hacer(base, quien.datos);
  } catch (error) {
    return falla(`No se pudo ${accion}: ${motivo(error)}. Probá de nuevo con señal.`);
  }
}

async function listaCompleta<T>(
  contar: () => PromiseLike<{ count: number | null; error: { message: string } | null }>,
  pagina: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  concepto: string,
): Promise<Resultado<T[]>> {
  const total = await contar();
  if (total.error || total.count === null) {
    return falla(`No se pudo contar ${concepto}: ${total.error?.message ?? "la base no devolvió el total"}. Probá de nuevo.`);
  }
  const filas = await traerTodasLasFilas(pagina);
  if (!filas.completa || filas.filas.length !== total.count) {
    return falla(`La lista de ${concepto} llegó incompleta. Poné la app al día y probá de nuevo.`);
  }
  return exito(filas.filas);
}

export async function leerCircuitos(): Promise<Resultado<CircuitoGuardado[]>> {
  return conSesion("traer los Circuitos", async (base) => {
    const filas = await listaCompleta(
      () => base.from("circuitos").select("id", { count: "exact", head: true })
        .is("eliminado_en", null).abortSignal(tope()),
      (desde, hasta) => base.from("circuitos").select(COLUMNAS_DE_CIRCUITO)
        .is("eliminado_en", null).order("id", { ascending: true })
        .range(desde, hasta).abortSignal(tope()), "Circuitos",
    );
    if (!filas.ok) return filas;
    const circuitos: CircuitoGuardado[] = [];
    for (const fila of filas.datos) {
      const circuito = leerFilaDeCircuito(fila);
      if (!circuito.ok) return circuito;
      circuitos.push(circuito.datos);
    }
    return exito(circuitos);
  });
}

type PedidoDeCircuito = { nombre: unknown; actividad: unknown; puntos: unknown; datos?: unknown };

export async function crearCircuitoNuevo(pedido: PedidoDeCircuito): Promise<Resultado<CircuitoGuardado>> {
  return conSesion("guardar el Circuito", async (base, quien) => {
    if (quien.categoria === "normal") return falla("Tu cuenta puede consultar Circuitos, pero solo Administrador y Premium pueden crearlos.");
    const caminos = await leerCaminos();
    if (!caminos.ok) return falla(`No se pudo comprobar el mapa antes de guardar: ${caminos.error}`);
    if (caminos.datos.conProblemas.length > 0) {
      return falla("Hay Caminos guardados con errores. Pedile al administrador que los revise antes de guardar el Circuito.");
    }
    const preparado = prepararCircuito(pedido, caminos.datos.caminos);
    if (!preparado.ok) return preparado;
    const datos = revisarDatosDelCircuito(pedido.datos);
    if (!datos.ok) return datos;
    // Las partes dibujadas solo para el Circuito no tienen Camino del que sacar alturas.
    const alturas = await medirAlturasPropias(preparado.datos.partes, alturasDelRelieve);
    if (!alturas.ok) return falla(`No se guardó el Circuito: ${alturas.error}`);
    const { data, error } = await base.from("circuitos").insert({
      perfil_id: quien.perfilId, nombre: preparado.datos.nombre,
      actividad: preparado.datos.actividad, puntos: preparado.datos.puntos,
      partes: preparado.datos.partes, caminos_base: preparado.datos.caminosBase,
      ...datosParaLaBase(datos.datos), alturas_propias: alturasPropiasParaLaBase(alturas.datos),
    }).select(COLUMNAS_DE_CIRCUITO).abortSignal(tope()).maybeSingle();
    if (error) return falla(`No se guardó el Circuito: ${error.message}. Probá de nuevo.`);
    if (!data) return falla("La base no devolvió el Circuito. Mirá la lista antes de volver a guardarlo.");
    return leerFilaDeCircuito(data);
  });
}

export async function cambiarCircuito(
  id: number, actualizadoEn: string,
  pedido: PedidoDeCircuito,
): Promise<Resultado<CircuitoGuardado>> {
  return conSesion("cambiar el Circuito", async (base, quien) => {
    if (!Number.isInteger(id) || id < 1 || !actualizadoEn) return falla("No se reconoce el Circuito abierto. Volvé a la lista.");
    const leido = await base.from("circuitos").select(COLUMNAS_DE_CIRCUITO)
      .eq("id", id).abortSignal(tope()).maybeSingle();
    if (leido.error) return falla(`No se pudo abrir el Circuito: ${leido.error.message}. Volvé a intentar.`);
    if (!leido.data) return falla("El Circuito ya no existe. Volvé a la lista.");
    const actual = leerFilaDeCircuito(leido.data);
    if (!actual.ok) return actual;
    if (actual.datos.eliminadoEn) return falla("El Circuito fue retirado. Volvé a la lista.");
    if (quien.categoria === "normal" || (quien.categoria === "premium" && actual.datos.perfilId !== quien.perfilId)) {
      return falla("Solo podés editar los Circuitos que creaste. El administrador puede editar todos.");
    }
    if (actual.datos.actualizadoEn !== actualizadoEn) {
      return falla("El Circuito cambió desde que lo abriste. No se guardó nada: volvé a abrirlo y revisá la versión nueva.");
    }
    const caminos = await leerCaminos();
    if (!caminos.ok) return falla(`No se pudo comprobar el mapa: ${caminos.error}`);
    const preparado = prepararCircuito(pedido, caminos.datos.caminos);
    if (!preparado.ok) return preparado;
    const datos = revisarDatosDelCircuito(pedido.datos);
    if (!datos.ok) return datos;
    const alturas = await medirAlturasPropias(preparado.datos.partes, alturasDelRelieve);
    if (!alturas.ok) return falla(`No se guardó el Circuito: ${alturas.error}`);
    const guardado = await base.from("circuitos").update({
      nombre: preparado.datos.nombre, actividad: preparado.datos.actividad,
      puntos: preparado.datos.puntos, partes: preparado.datos.partes,
      caminos_base: preparado.datos.caminosBase,
      // Si el pedido no trae los datos cargados a mano, quedan como estaban.
      ...(pedido.datos === undefined ? {} : datosParaLaBase(datos.datos)),
      alturas_propias: alturasPropiasParaLaBase(alturas.datos),
    }).eq("id", id).eq("actualizado_en", actualizadoEn)
      .select(COLUMNAS_DE_CIRCUITO).abortSignal(tope()).maybeSingle();
    if (guardado.error) return falla(`No se guardó el Circuito: ${guardado.error.message}. Volvé a intentar.`);
    if (!guardado.data) return falla("El Circuito cambió mientras guardabas. Volvé a abrirlo y revisá la versión nueva.");
    return leerFilaDeCircuito(guardado.data);
  });
}

/** Cambia la ficha sin tocar el dibujo, útil cuando una corrección dejó un final separado. */
export async function cambiarDatosDelCircuito(
  id: number, actualizadoEn: string, nombre: string, actividad: ActividadRuta, datosCargados?: unknown,
): Promise<Resultado<CircuitoGuardado>> {
  return conSesion("cambiar el Circuito", async (base, quien) => {
    if (!Number.isInteger(id) || id < 1 || !actualizadoEn) return falla("No se reconoce el Circuito abierto. Volvé a la lista.");
    if (typeof nombre !== "string" || !nombre.trim() || Array.from(nombre.trim()).length > 120) {
      return falla("Escribí un nombre de hasta 120 caracteres para el Circuito.");
    }
    if (!(ACTIVIDADES_RUTA as readonly unknown[]).includes(actividad)) return falla("Elegí una actividad para el Circuito.");
    const datos = revisarDatosDelCircuito(datosCargados);
    if (!datos.ok) return datos;
    const leido = await base.from("circuitos").select(COLUMNAS_DE_CIRCUITO)
      .eq("id", id).abortSignal(tope()).maybeSingle();
    if (leido.error) return falla(`No se pudo abrir el Circuito: ${leido.error.message}. Probá de nuevo.`);
    const actual = leerFilaDeCircuito(leido.data);
    if (!actual.ok) return actual;
    if (actual.datos.eliminadoEn) return falla("El Circuito fue retirado. Volvé a la lista.");
    if (quien.categoria === "normal" || (quien.categoria === "premium" && actual.datos.perfilId !== quien.perfilId)) {
      return falla("Solo podés editar los Circuitos que creaste. El administrador puede editar todos.");
    }
    if (actual.datos.actualizadoEn !== actualizadoEn) {
      return falla("El Circuito cambió desde que lo abriste. No se guardó nada: volvé a abrirlo y revisá la versión nueva.");
    }
    const guardado = await base.from("circuitos").update({ nombre: nombre.trim(), actividad,
      ...(datosCargados === undefined ? {} : datosParaLaBase(datos.datos)) })
      .eq("id", id).eq("actualizado_en", actualizadoEn)
      .select(COLUMNAS_DE_CIRCUITO).abortSignal(tope()).maybeSingle();
    if (guardado.error) return falla(`No se guardó el Circuito: ${guardado.error.message}. Probá de nuevo.`);
    if (!guardado.data) return falla("El Circuito cambió mientras guardabas. Volvé a abrirlo y revisá la versión nueva.");
    return leerFilaDeCircuito(guardado.data);
  });
}

export async function retirarCircuito(id: number, actualizadoEn: string): Promise<Resultado<{ id: number }>> {
  return conSesion("retirar el Circuito", async (base, quien) => {
    const leido = await base.from("circuitos").select(COLUMNAS_DE_CIRCUITO)
      .eq("id", id).abortSignal(tope()).maybeSingle();
    if (leido.error) return falla(`No se pudo abrir el Circuito: ${leido.error.message}. Probá de nuevo.`);
    const actual = leerFilaDeCircuito(leido.data);
    if (!actual.ok) return actual;
    if (quien.categoria === "normal" || (quien.categoria === "premium" && actual.datos.perfilId !== quien.perfilId)) {
      return falla("Solo podés retirar los Circuitos que creaste. El administrador puede retirar todos.");
    }
    if (actual.datos.actualizadoEn !== actualizadoEn) return falla("El Circuito cambió. Volvé a abrirlo antes de retirarlo.");
    const { data, error } = await base.from("circuitos")
      .update({ eliminado_en: new Date().toISOString() })
      .eq("id", id).eq("actualizado_en", actualizadoEn)
      .select("id").abortSignal(tope()).maybeSingle();
    if (error) return falla(`No se retiró el Circuito: ${error.message}. Probá de nuevo.`);
    if (!data) return falla("El Circuito cambió mientras lo retirabas. Volvé a abrirlo.");
    return exito({ id });
  });
}

/** Incluye los Caminos retirados y la historia de sus correcciones. */
export async function leerCircuitoCompleto(id: number): Promise<Resultado<{
  circuito: CircuitoGuardado; caminos: CaminoGuardado[]; correcciones: CorreccionDeCamino[];
}>> {
  return conSesion("abrir el Circuito", async (base) => {
    if (!Number.isInteger(id) || id < 1) return falla("No se reconoce ese Circuito. Volvé a la lista.");
    const leido = await base.from("circuitos").select(COLUMNAS_DE_CIRCUITO)
      .eq("id", id).abortSignal(tope()).maybeSingle();
    if (leido.error) return falla(`No se pudo abrir el Circuito: ${leido.error.message}. Probá de nuevo.`);
    const circuito = leerFilaDeCircuito(leido.data);
    if (!circuito.ok) return circuito;
    if (circuito.datos.eliminadoEn) return falla("Ese Circuito fue retirado. Volvé a la lista.");
    const ids = circuito.datos.caminosBase.map((cada) => cada.id);
    if (ids.length === 0) return exito({ circuito: circuito.datos, caminos: [], correcciones: [] });

    const filasDeCaminos = await listaCompleta(
      () => base.from("caminos").select("id", { count: "exact", head: true })
        .in("id", ids).abortSignal(tope()),
      (desde, hasta) => base.from("caminos").select(COLUMNAS_DE_CAMINO)
        .in("id", ids).order("id", { ascending: true }).range(desde, hasta).abortSignal(tope()),
      "Caminos del Circuito",
    );
    if (!filasDeCaminos.ok) return filasDeCaminos;
    if (filasDeCaminos.datos.length !== ids.length) return falla("Falta un Camino de este Circuito. Avisale al administrador.");
    const caminos: CaminoGuardado[] = [];
    for (const fila of filasDeCaminos.datos) {
      const camino = leerFilaDeCamino(fila);
      if (!camino.ok) return camino;
      caminos.push(camino.datos);
    }
    const filasDeCorrecciones = await listaCompleta(
      () => base.from("correcciones_de_caminos").select("id", { count: "exact", head: true })
        .in("camino_id", ids).abortSignal(tope()),
      (desde, hasta) => base.from("correcciones_de_caminos")
        .select("id, camino_id, version_anterior, version_nueva, geometria_anterior, geometria_nueva")
        .in("camino_id", ids).order("id", { ascending: true })
        .range(desde, hasta).abortSignal(tope()), "correcciones de Caminos",
    );
    if (!filasDeCorrecciones.ok) return filasDeCorrecciones;
    const correcciones: CorreccionDeCamino[] = [];
    for (const fila of filasDeCorrecciones.datos as Record<string, unknown>[]) {
      const anterior = fila.geometria_anterior as { coordinates?: unknown } | null;
      const nueva = fila.geometria_nueva as { coordinates?: unknown } | null;
      const caminoId = Number(fila.camino_id);
      const versionAnterior = Number(fila.version_anterior);
      const versionNueva = Number(fila.version_nueva);
      if (!Number.isInteger(caminoId) || !Number.isInteger(versionAnterior)
        || !Number.isInteger(versionNueva) || !Array.isArray(anterior?.coordinates)
        || !Array.isArray(nueva?.coordinates)) {
        return falla("La historia de un Camino llegó incompleta. Avisale al administrador.");
      }
      correcciones.push({ caminoId, versionAnterior, versionNueva,
        coordenadasAnteriores: anterior.coordinates as number[][],
        coordenadasNuevas: nueva.coordinates as number[][] });
    }
    return exito({ circuito: circuito.datos, caminos, correcciones });
  });
}
