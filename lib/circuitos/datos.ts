import type { Position } from "geojson";
import { ACTIVIDADES_RUTA, NIVELES_ESFUERZO, type ActividadRuta, type NivelEsfuerzo } from "@/types/database";
import { esCoordenadaValida, largoDeLinea, ubicarEnLinea } from "@/lib/caminos/geometria";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import { dibujarCircuito, toqueLibre, toqueSobreCamino,
  type CaminoParaCircuito, type ParteDibujada, type ToqueDelCircuito } from "@/lib/circuitos/dibujo";
import { exito, falla, type Resultado } from "@/lib/datos/resultado";
import { leerAlturasPropias, type AlturasDeParte } from "@/lib/circuitos/alturas";

export const COLUMNAS_DE_CIRCUITO =
  "id, perfil_id, nombre, actividad, puntos, partes, caminos_base, tecnica, nivel_esfuerzo, que_llevar, complicaciones, comentario, alturas_propias, creado_en, actualizado_en, eliminado_en";

/** Lo que se carga a mano en un Circuito (decisión 049). Todo puede quedar sin cargar. */
export type DatosDelCircuito = {
  /** Del 1 al 10: cuánto hay que saber. */
  tecnica: number | null;
  nivelEsfuerzo: NivelEsfuerzo | null;
  queLlevar: string | null;
  complicaciones: string | null;
  comentario: string | null;
};

export const SIN_DATOS: DatosDelCircuito = {
  tecnica: null, nivelEsfuerzo: null, queLlevar: null, complicaciones: null, comentario: null,
};

export const LARGO_MAXIMO_DE_LOS_TEXTOS = 2000;

export type CircuitoGuardado = {
  id: number;
  perfilId: string;
  nombre: string;
  actividad: ActividadRuta;
  puntos: ToqueDelCircuito[];
  partes: ParteDibujada[];
  caminosBase: CaminoParaCircuito[];
  datos: DatosDelCircuito;
  /** Una entrada por parte; `null` si el Circuito se guardó antes de medirlas. */
  alturasPropias: (AlturasDeParte | null)[] | null;
  creadoEn: string;
  actualizadoEn: string;
  eliminadoEn: string | null;
};

type PedidoDeCircuito = {
  nombre: unknown;
  actividad: unknown;
  puntos: unknown;
};

function objeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function punto(valor: unknown): valor is Position {
  return Array.isArray(valor) && valor.length === 2 && esCoordenadaValida(valor);
}

function actividad(valor: unknown): valor is ActividadRuta {
  return (ACTIVIDADES_RUTA as readonly unknown[]).includes(valor);
}

export function prepararCircuito(
  pedido: PedidoDeCircuito,
  caminos: readonly CaminoGuardado[],
): Resultado<{ nombre: string; actividad: ActividadRuta; puntos: ToqueDelCircuito[];
  partes: ParteDibujada[]; caminosBase: CaminoParaCircuito[] }> {
  if (typeof pedido.nombre !== "string" || !pedido.nombre.trim() || Array.from(pedido.nombre.trim()).length > 120) {
    return falla("Escribí un nombre de hasta 120 caracteres para el Circuito.");
  }
  if (!actividad(pedido.actividad)) return falla("Elegí una actividad para el Circuito.");
  if (!Array.isArray(pedido.puntos) || pedido.puntos.length < 2 || pedido.puntos.length > 5000) {
    return falla("Marcá al menos dos puntos y hasta 5000 puntos para el Circuito.");
  }
  const porId = new Map(caminos.map((camino) => [camino.id, camino]));
  const puntos: ToqueDelCircuito[] = [];
  const usados = new Map<number, CaminoParaCircuito>();
  for (const valor of pedido.puntos as unknown[]) {
    if (!objeto(valor) || !punto(valor.coordenada)) {
      return falla("Un punto del Circuito está fuera del mapa. Revisá el dibujo antes de guardarlo.");
    }
    if (valor.enCamino === null) {
      const libre = toqueLibre(valor.coordenada);
      if (!libre.ok) return libre;
      puntos.push(libre.datos);
      continue;
    }
    if (!objeto(valor.enCamino)) return falla("No se reconoce un punto sobre Camino. Volvé a marcarlo.");
    const id = valor.enCamino.caminoId;
    const version = valor.enCamino.versionForma;
    const actividadDelCamino = valor.enCamino.actividadDelCamino;
    const distancia = valor.enCamino.distanciaM;
    if (!Number.isInteger(id) || !Number.isInteger(version) || !Number.isFinite(distancia)
      || !actividad(actividadDelCamino)) return falla("Un punto sobre Camino tiene datos incompletos. Volvé a marcarlo.");
    const camino = porId.get(id as number);
    if (!camino || camino.eliminadoEn) return falla("Un Camino del Circuito ya no está en Mapas. Abrí el Circuito de nuevo antes de guardarlo.");
    if (camino.versionForma !== version) return falla(`El Camino «${camino.nombre}» cambió mientras dibujabas. Volvé a abrir el Circuito.`);
    if (!camino.actividades.includes(actividadDelCamino)) return falla(`El Camino «${camino.nombre}» ya no tiene esa actividad. Volvé a abrir el Circuito.`);
    const lugar = ubicarEnLinea(camino.coordenadas, valor.coordenada[0], valor.coordenada[1]);
    if (!lugar || lugar.alejamientoM > 0.5 || Math.abs(lugar.distanciaM - (distancia as number)) > 0.5) {
      return falla(`Un punto ya no coincide con el Camino «${camino.nombre}». Volvé a marcarlo antes de guardar.`);
    }
    const sobre = toqueSobreCamino(valor.coordenada, camino, actividadDelCamino);
    if (!sobre.ok) return sobre;
    puntos.push(sobre.datos);
    usados.set(camino.id, { id: camino.id, coordenadas: camino.coordenadas, versionForma: camino.versionForma });
  }
  const caminosBase = [...usados.values()];
  const dibujo = dibujarCircuito(puntos, caminosBase);
  if (!dibujo.ok) return dibujo;
  if (dibujo.datos.length === 0 || dibujo.datos.some((parte) => largoDeLinea(parte.coordenadas) <= 0)) {
    return falla("El Circuito necesita dos puntos distintos. Mové uno antes de guardarlo.");
  }
  return exito({ nombre: pedido.nombre.trim(), actividad: pedido.actividad,
    puntos, partes: dibujo.datos, caminosBase });
}

function texto(valor: unknown, nombre: string): Resultado<string | null> {
  if (valor === null || valor === undefined) return exito(null);
  if (typeof valor !== "string") return falla(`${nombre} no llegó bien. Volvé a escribirlo.`);
  const limpio = valor.trim();
  if (Array.from(limpio).length > LARGO_MAXIMO_DE_LOS_TEXTOS) {
    return falla(`${nombre} puede tener hasta ${LARGO_MAXIMO_DE_LOS_TEXTOS} caracteres. Acortalo antes de guardar.`);
  }
  return exito(limpio || null);
}

/** Los datos que manda la persona, revisados y sin espacios de sobra. */
export function revisarDatosDelCircuito(valor: unknown): Resultado<DatosDelCircuito> {
  if (valor === undefined || valor === null) return exito(SIN_DATOS);
  if (!objeto(valor)) return falla("Los datos del Circuito no llegaron bien. Volvé a cargarlos.");
  const { tecnica, nivelEsfuerzo } = valor;
  if (tecnica !== null && tecnica !== undefined && (!Number.isInteger(tecnica) || (tecnica as number) < 1 || (tecnica as number) > 10)) {
    return falla("La técnica va del 1 al 10. Elegí uno de esos números o dejala sin cargar.");
  }
  if (nivelEsfuerzo !== null && nivelEsfuerzo !== undefined && !(NIVELES_ESFUERZO as unknown[]).includes(nivelEsfuerzo)) {
    return falla("Elegí un nivel de esfuerzo: bajo, medio, alto o muy alto.");
  }
  const queLlevar = texto(valor.queLlevar, "«Qué llevar»");
  if (!queLlevar.ok) return queLlevar;
  const complicaciones = texto(valor.complicaciones, "«Complicaciones»");
  if (!complicaciones.ok) return complicaciones;
  const comentario = texto(valor.comentario, "El comentario");
  if (!comentario.ok) return comentario;
  return exito({
    tecnica: (tecnica as number | null | undefined) ?? null,
    nivelEsfuerzo: (nivelEsfuerzo as NivelEsfuerzo | null | undefined) ?? null,
    queLlevar: queLlevar.datos,
    complicaciones: complicaciones.datos,
    comentario: comentario.datos,
  });
}

/** Las columnas de la base para los datos cargados a mano. */
export function datosParaLaBase(datos: DatosDelCircuito) {
  return {
    tecnica: datos.tecnica,
    nivel_esfuerzo: datos.nivelEsfuerzo,
    que_llevar: datos.queLlevar,
    complicaciones: datos.complicaciones,
    comentario: datos.comentario,
  };
}

/** Datos que llegaron de la base: no se dibujan si están incompletos. */
export function leerFilaDeCircuito(valor: unknown): Resultado<CircuitoGuardado> {
  if (!objeto(valor)) return falla("La base devolvió un Circuito incompleto. Volvé a abrirlo.");
  const id = Number(valor.id);
  if (!Number.isInteger(id) || id < 1 || typeof valor.perfil_id !== "string"
    || typeof valor.nombre !== "string" || !valor.nombre.trim() || !actividad(valor.actividad)
    || typeof valor.creado_en !== "string" || typeof valor.actualizado_en !== "string"
    || (valor.eliminado_en !== null && typeof valor.eliminado_en !== "string")
    || !Array.isArray(valor.puntos) || !Array.isArray(valor.partes) || !Array.isArray(valor.caminos_base)) {
    return falla("El Circuito tiene datos incompletos en la base. Avisale al administrador.");
  }
  const puntos = valor.puntos as unknown[];
  const partes = valor.partes as unknown[];
  const bases = valor.caminos_base as unknown[];
  if (puntos.length < 2 || partes.length < 1 || partes.length !== puntos.length - 1
    || puntos.some((cada) => !objeto(cada) || !punto(cada.coordenada)
      || !(cada.enCamino === null || objeto(cada.enCamino)))
    || partes.some((cada) => !objeto(cada) || (cada.tipo !== "libre" && cada.tipo !== "sobre_camino")
      || !Array.isArray(cada.coordenadas) || cada.coordenadas.length < 2
      || !cada.coordenadas.every(punto))
    || bases.some((cada) => !objeto(cada) || !Number.isInteger(cada.id)
      || !Number.isInteger(cada.versionForma) || !Array.isArray(cada.coordenadas)
      || cada.coordenadas.length < 2 || !cada.coordenadas.every(punto))) {
    return falla("El dibujo de un Circuito está incompleto en la base. Avisale al administrador.");
  }
  const datos = revisarDatosDelCircuito({
    tecnica: valor.tecnica, nivelEsfuerzo: valor.nivel_esfuerzo, queLlevar: valor.que_llevar,
    complicaciones: valor.complicaciones, comentario: valor.comentario,
  });
  if (!datos.ok) return falla(`Los datos del Circuito «${valor.nombre}» están guardados con un error: ${datos.error} Avisale al administrador.`);
  const alturasPropias = leerAlturasPropias(valor.alturas_propias, partes.length);
  if (alturasPropias === undefined) return falla(`Las alturas del Circuito «${valor.nombre}» están guardadas con un error. Avisale al administrador.`);
  return exito({ id, perfilId: valor.perfil_id, nombre: valor.nombre,
    actividad: valor.actividad, puntos: valor.puntos as ToqueDelCircuito[],
    partes: valor.partes as ParteDibujada[], caminosBase: valor.caminos_base as CaminoParaCircuito[],
    datos: datos.datos, alturasPropias,
    creadoEn: valor.creado_en, actualizadoEn: valor.actualizado_en,
    eliminadoEn: valor.eliminado_en as string | null });
}
