import type { Position } from "geojson";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import type { CircuitoGuardado } from "@/lib/circuitos/datos";
import type { ParteDibujada, ToqueDelCircuito } from "@/lib/circuitos/dibujo";
import { exito, falla, type Resultado } from "@/lib/datos/resultado";

/** Reubica los puntos de edición sobre la línea vigente, sin alterar el Circuito guardado. */
export function puntosVigentesParaEditar(
  circuito: CircuitoGuardado,
  partes: readonly ParteDibujada[],
  caminos: readonly CaminoGuardado[],
): Resultado<ToqueDelCircuito[]> {
  if (partes.length !== circuito.puntos.length - 1) {
    return falla("La corrección dejó una parte sin línea. Podés dibujar de nuevo el Circuito.");
  }
  const porId = new Map(caminos.map((camino) => [camino.id, camino]));
  const puntos: ToqueDelCircuito[] = [];
  for (const [indice, anterior] of circuito.puntos.entries()) {
    const enlace = anterior.enCamino;
    if (!enlace) {
      const coordenada = (indice === 0 ? partes[0]?.coordenadas[0]
        : partes[indice - 1]?.coordenadas.at(-1)) as Position | undefined;
      if (!coordenada) return falla("Falta un punto del Circuito. Podés dibujarlo de nuevo.");
      puntos.push({ coordenada: [...coordenada], enCamino: null });
      continue;
    }
    const camino = porId.get(enlace.caminoId);
    const parteSiguiente = partes[indice];
    const parteAnterior = partes[indice - 1];
    const parte = parteSiguiente?.tipo === "sobre_camino" && parteSiguiente.caminoId === enlace.caminoId
      ? parteSiguiente : parteAnterior?.tipo === "sobre_camino" && parteAnterior.caminoId === enlace.caminoId
        ? parteAnterior : null;
    if (!camino || !parte || parte.desdeM === null || parte.hastaM === null || !parte.sentido) {
      return falla("Un punto ya no coincide con su Camino. Podés dibujar de nuevo el Circuito.");
    }
    const inicio = parte === parteSiguiente;
    const distanciaM = inicio
      ? (parte.sentido === "ida" ? parte.desdeM : parte.hastaM)
      : (parte.sentido === "ida" ? parte.hastaM : parte.desdeM);
    const coordenada = (inicio ? parte.coordenadas[0] : parte.coordenadas.at(-1)) as Position;
    puntos.push({ coordenada: [...coordenada], enCamino: {
      caminoId: camino.id, distanciaM, versionForma: camino.versionForma,
      actividadDelCamino: enlace.actividadDelCamino,
    } });
  }
  return exito(puntos);
}
