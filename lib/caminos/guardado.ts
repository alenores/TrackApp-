import type { Position } from "geojson";
import { exito, falla, type Resultado } from "@/lib/datos/resultado";
import { traerTodasLasFilas, type ConsultaDeLista } from "@/lib/supabase/listas";
import {
  actualizarDatosDeTramo,
  cambiarActividades,
  clasificarTramo,
  corregirLinea,
  crearCamino,
  problemasDelCamino,
  type CambioDeClasificacion,
} from "@/lib/caminos/partes";
import {
  cambiosEntre,
  columnasDelCamino,
  esMomento,
  leerFilaDeCamino,
  mismoMomento,
  revisarActividad,
  revisarCoordenadas,
  revisarDescripcion,
  revisarFechaDeComprobacion,
  revisarIdDeCamino,
  revisarListaDeActividades,
  revisarNombre,
  revisarObservacion,
  traducirErrorDeCaminos,
  type CambiosDeCamino,
  type CaminoGuardado,
  type ColumnasDeCamino,
} from "@/lib/caminos/datos";
import { puedeCrearCaminos, puedeEditarCamino, type QuienUsa } from "@/lib/caminos/permisos";
import { medirAlturas, type FuenteDeAlturas } from "@/lib/alturas/perfil";

/**
 * Guardar Caminos: crear, leer, cambiar y retirar.
 *
 * Cada cambio sigue los mismos pasos: leer lo que hay, ver si quien pide puede,
 * **ver si otra persona guardó desde que lo abrió**, aplicar el cambio con las
 * funciones de `partes.ts` y guardar solo si nadie lo tocó en el medio. Así
 * nadie pisa en silencio la clasificación de otro: si chocan, el segundo se
 * entera y vuelve a abrir.
 *
 * No conoce Supabase: recibe una `BaseDeCaminos` que sabe leer y escribir. La
 * de verdad la arma `app/actions/caminos.ts`; las pruebas usan una falsa.
 *
 * **Toda línea nueva se guarda con sus alturas** (decisión 049): al crear y al
 * corregir el dibujo se miden con la `FuenteDeAlturas` que llega de afuera. Si
 * no se pueden medir, no se guarda nada y se dice por qué.
 */

export type RespuestaDeBase = { fila: unknown | null; error: string | null };

export type BaseDeCaminos = {
  /** Un Camino por su número, vivo o retirado. `fila` vacía si no existe. */
  leer(id: number): Promise<RespuestaDeBase>;
  insertar(fila: ColumnasDeCamino & { perfil_id: string }): Promise<RespuestaDeBase>;
  /**
   * Cambia la fila **solo si su fecha de cambio sigue siendo la que se leyó**.
   * Si alguien guardó en el medio, no cambia nada y devuelve `fila` vacía.
   */
  actualizarSiNadieCambio(id: number, actualizadoEnLeido: string, cambios: CambiosDeCamino): Promise<RespuestaDeBase>;
  /** Una página de Caminos vivos, ordenada por número. */
  leerPaginaDeVivos(desde: number, hasta: number): ConsultaDeLista<unknown>;
  contarVivos(): Promise<{ cantidad: number | null; error: string | null }>;
};

const CAMBIO_AJENO =
  "Este Camino cambió desde que lo abriste: alguien guardó otra versión. No se guardó nada. Volvé a abrirlo para ver cómo quedó y repetí tu cambio.";

const CAMBIO_AL_GUARDAR =
  "No se guardó: el Camino cambió mientras guardabas, o tu cuenta ya no puede cambiarlo. Volvé a abrirlo y probá de nuevo.";

const SIN_VERSION =
  "No se sabe qué versión del Camino tenías abierta. Volvé a abrirlo y probá de nuevo.";

/** Un lugar sobre la línea tiene que llegar como número; si no, `partes.ts` lo rechaza con su motivo. */
function metros(valor: unknown): number {
  return typeof valor === "number" ? valor : Number.NaN;
}

// ---------------------------------------------------------------- crear

export type PedidoDeCaminoNuevo = {
  nombre: unknown;
  descripcion?: unknown;
  actividades: unknown;
  coordenadas: unknown;
};

/** Un Camino nuevo, siempre a nombre de quien lo crea. Empieza con una sola parte por explorar. */
export async function crearCaminoGuardado(
  base: BaseDeCaminos,
  quien: QuienUsa,
  pedido: PedidoDeCaminoNuevo,
  fuenteDeAlturas: FuenteDeAlturas,
): Promise<Resultado<CaminoGuardado>> {
  const permiso = puedeCrearCaminos(quien);
  if (!permiso.ok) return permiso;

  const nombre = revisarNombre(pedido.nombre);
  if (!nombre.ok) return nombre;
  const descripcion = revisarDescripcion(pedido.descripcion);
  if (!descripcion.ok) return descripcion;
  const actividades = revisarListaDeActividades(pedido.actividades);
  if (!actividades.ok) return actividades;
  const coordenadas = revisarCoordenadas(pedido.coordenadas);
  if (!coordenadas.ok) return coordenadas;

  const camino = crearCamino(coordenadas.datos, actividades.datos);
  if (!camino.ok) return camino;

  const alturas = await medirAlturas(camino.datos.coordenadas, fuenteDeAlturas);
  if (!alturas.ok) return falla(`No se guardó el Camino «${nombre.datos}»: ${alturas.error}`);

  const respuesta = await base.insertar({
    perfil_id: quien.perfilId,
    ...columnasDelCamino({ ...camino.datos, nombre: nombre.datos, descripcion: descripcion.datos, alturas: alturas.datos }),
  });
  if (respuesta.error) return falla(`No se guardó el Camino: ${traducirErrorDeCaminos(respuesta.error)}`);
  if (!respuesta.fila) {
    return falla("La base no devolvió el Camino nuevo. Fijate en la lista si quedó guardado antes de volver a crearlo.");
  }
  return leerFilaDeCamino(respuesta.fila);
}

// ---------------------------------------------------------------- leer

export async function leerCaminoGuardado(base: BaseDeCaminos, id: unknown): Promise<Resultado<CaminoGuardado>> {
  const numero = revisarIdDeCamino(id);
  if (!numero.ok) return numero;
  const respuesta = await base.leer(numero.datos);
  if (respuesta.error) return falla(`No se pudo abrir el Camino: ${traducirErrorDeCaminos(respuesta.error)}`);
  if (!respuesta.fila) return falla("Ese Camino no existe. Volvé a la lista de Caminos.");
  const camino = leerFilaDeCamino(respuesta.fila);
  if (!camino.ok) return camino;
  if (camino.datos.eliminadoEn !== null) return falla("Ese Camino fue retirado del mapa. Volvé a la lista de Caminos.");
  return camino;
}

export type ListaDeCaminos = {
  caminos: CaminoGuardado[];
  /** Los que están guardados con un error: se dicen, no se esconden. */
  conProblemas: Array<{ id: number | null; motivo: string }>;
};

/**
 * Todos los Caminos vivos, por páginas ordenadas por número. Se compara lo que
 * llegó contra lo que la base dice que hay: si no coincide, no se dice «listo».
 */
export async function leerCaminosVivos(base: BaseDeCaminos): Promise<Resultado<ListaDeCaminos>> {
  const conteo = await base.contarVivos();
  if (conteo.error || conteo.cantidad === null) {
    return falla(`No se pudo saber cuántos Caminos hay: ${traducirErrorDeCaminos(conteo.error ?? "la base no contestó el total.")}`);
  }

  const lista = await traerTodasLasFilas((desde, hasta) => base.leerPaginaDeVivos(desde, hasta));
  if (!lista.completa) {
    return falla(`La lista de Caminos llegó cortada: ${traducirErrorDeCaminos(lista.motivo)} Probá de nuevo.`);
  }
  if (lista.filas.length !== conteo.cantidad) {
    return falla(
      `Llegaron ${lista.filas.length} Caminos de los ${conteo.cantidad} que hay. La lista cambió mientras se traía o se cortó: probá de nuevo.`,
    );
  }

  const resultado: ListaDeCaminos = { caminos: [], conProblemas: [] };
  for (const fila of lista.filas) {
    const camino = leerFilaDeCamino(fila);
    if (camino.ok) {
      resultado.caminos.push(camino.datos);
    } else {
      const id = Number((fila as { id?: unknown } | null)?.id);
      resultado.conProblemas.push({ id: Number.isInteger(id) ? id : null, motivo: camino.error });
    }
  }
  return exito(resultado);
}

// ---------------------------------------------------------------- cambiar

/**
 * El paso común de todo cambio. `transformar` es una función pura de
 * `partes.ts`: recibe el Camino como está y devuelve cómo queda. Si el cambio
 * toca la línea, hace falta `fuenteDeAlturas` para volver a medirla.
 */
export async function editarCaminoGuardado(
  base: BaseDeCaminos,
  quien: QuienUsa,
  id: unknown,
  actualizadoEnEsperado: unknown,
  transformar: (camino: CaminoGuardado) => Resultado<CaminoGuardado>,
  fuenteDeAlturas?: FuenteDeAlturas,
): Promise<Resultado<CaminoGuardado>> {
  const numero = revisarIdDeCamino(id);
  if (!numero.ok) return numero;
  if (!esMomento(actualizadoEnEsperado)) return falla(SIN_VERSION);

  const leida = await base.leer(numero.datos);
  if (leida.error) return falla(`No se pudo abrir el Camino: ${traducirErrorDeCaminos(leida.error)}`);
  if (!leida.fila) return falla("Ese Camino no existe. Volvé a la lista de Caminos.");
  const actual = leerFilaDeCamino(leida.fila);
  if (!actual.ok) return actual;

  const permiso = puedeEditarCamino(quien, actual.datos);
  if (!permiso.ok) return permiso;

  if (!mismoMomento(actual.datos.actualizadoEn, actualizadoEnEsperado)) return falla(CAMBIO_AJENO);

  const transformado = transformar(actual.datos);
  if (!transformado.ok) return transformado;
  const problemas = problemasDelCamino(transformado.datos);
  if (problemas.length > 0) {
    return falla(`El cambio dejaría el Camino con un error: ${problemas[0]} No se guardó nada.`);
  }

  // Una línea nueva con las alturas de la anterior sería un dato falso.
  let nuevo = transformado.datos;
  if (JSON.stringify(nuevo.coordenadas) !== JSON.stringify(actual.datos.coordenadas)) {
    if (!fuenteDeAlturas) return falla("No se pudieron calcular las alturas de la línea nueva. No se guardó nada. Probá de nuevo.");
    const alturas = await medirAlturas(nuevo.coordenadas, fuenteDeAlturas);
    if (!alturas.ok) return falla(`No se guardó la línea corregida: ${alturas.error}`);
    nuevo = { ...nuevo, alturas: alturas.datos };
  }

  const cambios = cambiosEntre(columnasDelCamino(actual.datos), columnasDelCamino(nuevo));
  if (Object.keys(cambios).length === 0) return actual;

  return guardarSiNadieCambio(base, actual.datos, cambios);
}

async function guardarSiNadieCambio(
  base: BaseDeCaminos,
  actual: CaminoGuardado,
  cambios: CambiosDeCamino,
): Promise<Resultado<CaminoGuardado>> {
  const guardada = await base.actualizarSiNadieCambio(actual.id, actual.actualizadoEn, cambios);
  if (guardada.error) return falla(`No se guardó el cambio: ${traducirErrorDeCaminos(guardada.error)}`);
  if (!guardada.fila) return falla(CAMBIO_AL_GUARDAR);
  return leerFilaDeCamino(guardada.fila);
}

/** Corregir el dibujo: sigue siendo el mismo Camino y conserva sus clasificaciones (decisión 037). */
export function corregirLineaGuardada(
  base: BaseDeCaminos,
  quien: QuienUsa,
  id: unknown,
  actualizadoEnEsperado: unknown,
  coordenadas: unknown,
  fuenteDeAlturas: FuenteDeAlturas,
): Promise<Resultado<CaminoGuardado>> {
  const linea = revisarCoordenadas(coordenadas);
  if (!linea.ok) return Promise.resolve(linea);
  return editarCaminoGuardado(
    base,
    quien,
    id,
    actualizadoEnEsperado,
    (camino) => corregirLinea(camino, linea.datos as Position[]),
    fuenteDeAlturas,
  );
}

export type PedidoDeClasificacion = {
  desdeM: unknown;
  hastaM: unknown;
  actividad: unknown;
  paso?: unknown;
  /** `null` vuelve a «sin clasificar»; si no viene, no cambia. */
  complejidad?: unknown;
};

/** Condición o complejidad de una actividad entre dos lugares. No toca la línea ni las otras actividades. */
export function clasificarParteGuardada(
  base: BaseDeCaminos,
  quien: QuienUsa,
  id: unknown,
  actualizadoEnEsperado: unknown,
  pedido: PedidoDeClasificacion,
): Promise<Resultado<CaminoGuardado>> {
  const actividad = revisarActividad(pedido.actividad);
  if (!actividad.ok) return Promise.resolve(actividad);
  const cambio: CambioDeClasificacion = {};
  if (pedido.paso !== undefined) cambio.paso = pedido.paso as CambioDeClasificacion["paso"];
  if (pedido.complejidad !== undefined) cambio.complejidad = pedido.complejidad as CambioDeClasificacion["complejidad"];
  if (cambio.paso === undefined && cambio.complejidad === undefined) {
    return Promise.resolve(falla("Elegí la condición de paso o la complejidad que querés cambiar."));
  }
  return editarCaminoGuardado(base, quien, id, actualizadoEnEsperado, (camino) =>
    clasificarTramo(camino, metros(pedido.desdeM), metros(pedido.hastaM), actividad.datos, cambio),
  );
}

export type PedidoDeDatosDeParte = {
  desdeM: unknown;
  hastaM: unknown;
  /** Si no viene, no cambia. Vacío la borra. */
  observacion?: unknown;
  comprobadoEl?: unknown;
};

/** La observación y la fecha de una parte, compartidas por sus actividades (decisión 038). */
export function cambiarDatosDeParteGuardada(
  base: BaseDeCaminos,
  quien: QuienUsa,
  id: unknown,
  actualizadoEnEsperado: unknown,
  pedido: PedidoDeDatosDeParte,
  hoy?: string,
): Promise<Resultado<CaminoGuardado>> {
  const cambio: { observacion?: string | null; comprobadoEl?: string | null } = {};
  if (pedido.observacion !== undefined) {
    const observacion = revisarObservacion(pedido.observacion);
    if (!observacion.ok) return Promise.resolve(observacion);
    cambio.observacion = observacion.datos;
  }
  if (pedido.comprobadoEl !== undefined) {
    const fecha = revisarFechaDeComprobacion(pedido.comprobadoEl, hoy);
    if (!fecha.ok) return Promise.resolve(fecha);
    cambio.comprobadoEl = fecha.datos;
  }
  if (cambio.observacion === undefined && cambio.comprobadoEl === undefined) {
    return Promise.resolve(falla("Escribí la observación o elegí la fecha que querés cambiar."));
  }
  return editarCaminoGuardado(base, quien, id, actualizadoEnEsperado, (camino) =>
    actualizarDatosDeTramo(camino, metros(pedido.desdeM), metros(pedido.hastaM), cambio),
  );
}

/** Sumar o sacar actividades. Las nuevas empiezan por explorar en todas las partes. */
export function cambiarActividadesGuardadas(
  base: BaseDeCaminos,
  quien: QuienUsa,
  id: unknown,
  actualizadoEnEsperado: unknown,
  actividades: unknown,
): Promise<Resultado<CaminoGuardado>> {
  const lista = revisarListaDeActividades(actividades);
  if (!lista.ok) return Promise.resolve(lista);
  return editarCaminoGuardado(base, quien, id, actualizadoEnEsperado, (camino) => cambiarActividades(camino, lista.datos));
}

export type PedidoDeNombre = { nombre: unknown; descripcion?: unknown };

export function cambiarNombreGuardado(
  base: BaseDeCaminos,
  quien: QuienUsa,
  id: unknown,
  actualizadoEnEsperado: unknown,
  pedido: PedidoDeNombre,
): Promise<Resultado<CaminoGuardado>> {
  const nombre = revisarNombre(pedido.nombre);
  if (!nombre.ok) return Promise.resolve(nombre);
  const descripcion = revisarDescripcion(pedido.descripcion);
  if (!descripcion.ok) return Promise.resolve(descripcion);
  return editarCaminoGuardado(base, quien, id, actualizadoEnEsperado, (camino) =>
    exito<CaminoGuardado>({ ...camino, nombre: nombre.datos, descripcion: descripcion.datos }),
  );
}

/**
 * Retirar es marcar `eliminado_en`: nada se borra de verdad, y los demás
 * celulares se enteran. Solo mira autor, estado y versión, así **también se
 * puede retirar un Camino guardado con un error**: si no, quedaría trabado.
 */
export async function retirarCaminoGuardado(
  base: BaseDeCaminos,
  quien: QuienUsa,
  id: unknown,
  actualizadoEnEsperado: unknown,
  ahora: Date = new Date(),
): Promise<Resultado<{ id: number; eliminadoEn: string }>> {
  const numero = revisarIdDeCamino(id);
  if (!numero.ok) return numero;
  if (!esMomento(actualizadoEnEsperado)) return falla(SIN_VERSION);

  const leida = await base.leer(numero.datos);
  if (leida.error) return falla(`No se pudo abrir el Camino: ${traducirErrorDeCaminos(leida.error)}`);
  if (!leida.fila) return falla("Ese Camino no existe. Volvé a la lista de Caminos.");
  const fila = leida.fila as { perfil_id?: unknown; eliminado_en?: unknown; actualizado_en?: unknown };
  if (typeof fila.perfil_id !== "string" || typeof fila.actualizado_en !== "string") {
    return falla("La base devolvió el Camino sin autor o sin fecha de cambio. Avisale al administrador.");
  }
  const eliminadoEn = typeof fila.eliminado_en === "string" ? fila.eliminado_en : null;

  const permiso = puedeEditarCamino(quien, { perfilId: fila.perfil_id, eliminadoEn });
  if (!permiso.ok) return permiso;
  if (!mismoMomento(fila.actualizado_en, actualizadoEnEsperado)) return falla(CAMBIO_AJENO);

  const retiro = ahora.toISOString();
  const guardada = await base.actualizarSiNadieCambio(numero.datos, fila.actualizado_en, { eliminado_en: retiro });
  if (guardada.error) return falla(`No se retiró el Camino: ${traducirErrorDeCaminos(guardada.error)}`);
  if (!guardada.fila) return falla(CAMBIO_AL_GUARDAR);
  const quedo = (guardada.fila as { eliminado_en?: unknown }).eliminado_en;
  return exito({ id: numero.datos, eliminadoEn: typeof quedo === "string" ? quedo : retiro });
}
