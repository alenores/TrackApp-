import type { Position } from "geojson";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import type { CaminoParaCircuito, ParteDibujada } from "@/lib/circuitos/dibujo";
import type { CircuitoGuardado } from "@/lib/circuitos/datos";
import { trasladarCircuitoConCaminoCorregido } from "@/lib/circuitos/traslado";
import { exito, falla, type Resultado } from "@/lib/datos/resultado";

export type CorreccionDeCamino = {
  caminoId: number;
  versionAnterior: number;
  versionNueva: number;
  coordenadasAnteriores: Position[];
  coordenadasNuevas: Position[];
};

export type CircuitoActualizado = {
  partes: ParteDibujada[];
  finalSeparado: Position | null;
};

/**
 * Aplica cada corrección en orden. Las clasificaciones no están en el Circuito:
 * el mapa y el resumen las leen siempre del Camino vigente.
 */
export function actualizarCircuito(
  circuito: CircuitoGuardado,
  caminos: readonly CaminoGuardado[],
  correcciones: readonly CorreccionDeCamino[],
): Resultado<CircuitoActualizado> {
  let partes = [...circuito.partes];
  let finalSeparado: Position | null = null;
  const porId = new Map(caminos.map((camino) => [camino.id, camino]));
  for (const base of circuito.caminosBase) {
    const vigente = porId.get(base.id);
    if (!vigente) return falla(`Falta un Camino usado por «${circuito.nombre}». Poné la app al día y abrilo de nuevo.`);
    if (vigente.versionForma < base.versionForma) {
      return falla(`La copia del Camino «${vigente.nombre}» es anterior al Circuito. Poné la app al día con señal.`);
    }
    const pasos = correcciones.filter((cada) => cada.caminoId === base.id
      && cada.versionAnterior >= base.versionForma && cada.versionNueva <= vigente.versionForma)
      .sort((a, b) => a.versionAnterior - b.versionAnterior);
    let anterior: CaminoParaCircuito = base;
    for (const paso of pasos) {
      if (paso.versionAnterior !== anterior.versionForma
        || JSON.stringify(paso.coordenadasAnteriores) !== JSON.stringify(anterior.coordenadas)) {
        return falla(`Falta una corrección del Camino «${vigente.nombre}». No se puede mostrar el Circuito actualizado. Poné la app al día.`);
      }
      const actual: CaminoParaCircuito = {
        id: base.id, versionForma: paso.versionNueva, coordenadas: paso.coordenadasNuevas,
      };
      const traslado = trasladarCircuitoConCaminoCorregido(partes, anterior, actual, finalSeparado);
      if (!traslado.ok) return traslado;
      partes = traslado.datos.partes;
      finalSeparado = traslado.datos.finalSeparado;
      anterior = actual;
    }
    if (anterior.versionForma !== vigente.versionForma
      || JSON.stringify(anterior.coordenadas) !== JSON.stringify(vigente.coordenadas)) {
      return falla(`No llegaron todas las correcciones del Camino «${vigente.nombre}». Poné la app al día antes de salir.`);
    }
  }
  return exito({ partes, finalSeparado });
}
