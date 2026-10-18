import type { FeatureCollection, Position } from "geojson";
import { distanciasAcumuladas } from "@/lib/caminos/geometria";
import type { PuntoDelPerfil } from "@/lib/alturas/perfil";
import { lineasDelRecorrido } from "@/lib/rutas/recorrido";

/** El gráfico no necesita cada punto del GPS: con esto se ve la forma. */
const PUNTOS_DEL_GRAFICO = 200;

/**
 * Las alturas del recorrido de una salida, listas para el gráfico.
 *
 * Salen del archivo GPS, del tercer número de cada punto. Si el archivo no
 * las trae, no hay gráfico: no se inventan.
 */
export function perfilDeLaSalida(geometria: FeatureCollection): PuntoDelPerfil[] | null {
  const perfil: PuntoDelPerfil[] = [];
  let origen = 0;

  for (const linea of lineasDelRecorrido(geometria)) {
    if (linea.length < 2) continue;
    const distancias = distanciasAcumuladas(linea);
    for (let i = 0; i < linea.length; i += 1) {
      const altura = alturaDe(linea[i]);
      if (altura === null) continue;
      perfil.push({ distanciaM: origen + distancias[i], alturaM: Math.round(altura) });
    }
    origen += distancias[distancias.length - 1] ?? 0;
  }

  if (perfil.length < 2) return null;
  return afinar(perfil);
}

function alturaDe(punto: Position): number | null {
  const altura = punto[2];
  return Number.isFinite(altura) ? altura : null;
}

function afinar(perfil: PuntoDelPerfil[]): PuntoDelPerfil[] {
  if (perfil.length <= PUNTOS_DEL_GRAFICO) return perfil;
  const elegidos: PuntoDelPerfil[] = [];
  for (let i = 0; i < PUNTOS_DEL_GRAFICO; i += 1) {
    const cual = Math.round((i * (perfil.length - 1)) / (PUNTOS_DEL_GRAFICO - 1));
    elegidos.push(perfil[cual]);
  }
  return elegidos;
}
