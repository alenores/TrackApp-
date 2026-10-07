import type { Position } from "geojson";
import type { ActividadRuta } from "@/types/database";
import { esCoordenadaValida, largoDeLinea, tramoDeLinea, ubicarEnLinea } from "@/lib/caminos/geometria";
import { exito, falla, type Resultado } from "@/lib/datos/resultado";

/** Solo lo necesario de un Camino para armar la línea de un Circuito. */
export type CaminoParaCircuito = {
  id: number;
  coordenadas: Position[];
  versionForma: number;
};

export type ToqueDelCircuito = {
  coordenada: Position;
  enCamino: null | {
    caminoId: number;
    distanciaM: number;
    versionForma: number;
    actividadDelCamino: ActividadRuta;
  };
};

export type ParteDibujada = {
  tipo: "libre" | "sobre_camino";
  sentido: "ida" | "vuelta" | null;
  coordenadas: Position[];
  caminoId: number | null;
  desdeM: number | null;
  hastaM: number | null;
  versionForma: number | null;
  actividadDelCamino: ActividadRuta | null;
};

/** El mapa decide qué recibió el toque; esta función registra un punto libre. */
export function toqueLibre(coordenada: Position): Resultado<ToqueDelCircuito> {
  if (!esCoordenadaValida(coordenada)) {
    return falla("Ese lugar está fuera del mapa. Tocá un punto válido para continuar el Circuito.");
  }
  return exito({ coordenada: [...coordenada], enCamino: null });
}

/** Ajusta el toque al Camino identificado por el mapa, sin cambiar ese Camino. */
export function toqueSobreCamino(
  coordenada: Position,
  camino: CaminoParaCircuito,
  actividadDelCamino: ActividadRuta,
): Resultado<ToqueDelCircuito> {
  if (!esCoordenadaValida(coordenada)) {
    return falla("Ese lugar está fuera del mapa. Tocá un punto válido para continuar el Circuito.");
  }
  if (camino.coordenadas.length < 2 || !Number.isInteger(camino.versionForma) || camino.versionForma < 1) {
    return falla("Ese Camino no tiene una línea válida. Elegí otro punto del mapa y avisale al administrador.");
  }
  const lugar = ubicarEnLinea(camino.coordenadas, coordenada[0], coordenada[1]);
  if (!lugar) return falla("No se pudo ubicar el toque sobre ese Camino. Volvé a tocarlo.");
  return exito({
    coordenada: [...lugar.coordenada],
    enCamino: {
      caminoId: camino.id,
      distanciaM: lugar.distanciaM,
      versionForma: camino.versionForma,
      actividadDelCamino,
    },
  });
}

/**
 * Conecta cada par de toques consecutivos. Seguir un Camino es una consecuencia
 * de los toques, nunca una herramienta o un paso previo para crear el Circuito.
 * Los vínculos de otra versión se actualizan antes de llamar esta función.
 */
export function dibujarCircuito(
  toques: ToqueDelCircuito[],
  caminos: CaminoParaCircuito[],
): Resultado<ParteDibujada[]> {
  const porId = new Map(caminos.map((camino) => [camino.id, camino]));
  const partes: ParteDibujada[] = [];
  for (let i = 1; i < toques.length; i += 1) {
    const anterior = toques[i - 1];
    const actual = toques[i];
    if (!esCoordenadaValida(anterior.coordenada) || !esCoordenadaValida(actual.coordenada)) {
      return falla("Un punto del Circuito está fuera del mapa. Revisá los puntos antes de guardarlo.");
    }
    const primero = anterior.enCamino;
    const segundo = actual.enCamino;
    if (primero && segundo && primero.caminoId === segundo.caminoId) {
      const camino = porId.get(primero.caminoId);
      if (!camino) {
        return falla("Falta un Camino que usa este Circuito. Poné los datos al día antes de salir.");
      }
      if (primero.versionForma !== camino.versionForma || segundo.versionForma !== camino.versionForma) {
        return falla(`El Camino ${camino.id} cambió de forma. Actualizá el Circuito con señal antes de salir.`);
      }
      const largoM = largoDeLinea(camino.coordenadas);
      if (
        !Number.isFinite(primero.distanciaM) || !Number.isFinite(segundo.distanciaM) ||
        primero.distanciaM < 0 || segundo.distanciaM < 0 ||
        primero.distanciaM > largoM || segundo.distanciaM > largoM
      ) {
        return falla("Los puntos de un Camino ya no coinciden con su línea. Volvé a abrir el Circuito con señal para revisarlo.");
      }
      if (primero.distanciaM === segundo.distanciaM) {
        return falla("Marcaste dos puntos en el mismo lugar del Camino. Mové uno para continuar el Circuito.");
      }
      const desdeM = Math.min(primero.distanciaM, segundo.distanciaM);
      const hastaM = Math.max(primero.distanciaM, segundo.distanciaM);
      const coordenadas = tramoDeLinea(camino.coordenadas, desdeM, hastaM);
      partes.push({
        tipo: "sobre_camino",
        sentido: primero.distanciaM > segundo.distanciaM ? "vuelta" : "ida",
        coordenadas: primero.distanciaM > segundo.distanciaM ? coordenadas.reverse() : coordenadas,
        caminoId: camino.id,
        desdeM,
        hastaM,
        versionForma: camino.versionForma,
        actividadDelCamino: segundo.actividadDelCamino,
      });
      continue;
    }
    partes.push({
      tipo: "libre",
      sentido: null,
      coordenadas: [[...anterior.coordenada], [...actual.coordenada]],
      caminoId: null,
      desdeM: null,
      hastaM: null,
      versionForma: null,
      actividadDelCamino: null,
    });
  }
  return exito(partes);
}
