import type { ExpressionSpecification } from "maplibre-gl";

/**
 * Grosor de los Caminos según el zoom.
 *
 * De lejos la línea se afina para no armar una mancha; de cerca queda como
 * antes, legible. Los números del final (zoom 16) son los fijos que había.
 */

export const ANCHO_DE_CAMINO: ExpressionSpecification = [
  "interpolate", ["linear"], ["zoom"],
  10, 1.4,
  12, 2.4,
  14, 4,
  16, 5,
];

export const BORDE_DE_CAMINO: ExpressionSpecification = [
  "interpolate", ["linear"], ["zoom"],
  10, 2.2,
  12, 3.8,
  14, 6.5,
  16, 8,
];

/** Tentativo: más fino que el resto, en la misma proporción. */
export const ANCHO_DE_CAMINO_TENTATIVO: ExpressionSpecification = [
  "interpolate", ["linear"], ["zoom"],
  10, 0.7,
  12, 1.2,
  14, 2,
  16, 2.5,
];

export const BORDE_DE_CAMINO_TENTATIVO: ExpressionSpecification = [
  "interpolate", ["linear"], ["zoom"],
  10, 1.3,
  12, 2.2,
  14, 3.5,
  16, 4.5,
];

/** Caminos de otra actividad: referencia, un poco más finos. */
export const ANCHO_DE_CAMINO_SECUNDARIO: ExpressionSpecification = [
  "interpolate", ["linear"], ["zoom"],
  10, 0.9,
  12, 1.5,
  14, 2.4,
  16, 3,
];

export const BORDE_DE_CAMINO_SECUNDARIO: ExpressionSpecification = [
  "interpolate", ["linear"], ["zoom"],
  10, 1.6,
  12, 2.6,
  14, 4,
  16, 5,
];

/** En un Circuito el Camino se marca un poco más; de lejos igual se afina. */
export const ANCHO_DE_CAMINO_EN_CIRCUITO: ExpressionSpecification = [
  "interpolate", ["linear"], ["zoom"],
  10, 2,
  12, 3.2,
  14, 5.5,
  16, 7,
];

export const BORDE_DE_CAMINO_EN_CIRCUITO: ExpressionSpecification = [
  "interpolate", ["linear"], ["zoom"],
  10, 3.2,
  12, 5,
  14, 8,
  16, 10,
];

export const ANCHO_DE_CAMINO_TENTATIVO_EN_CIRCUITO: ExpressionSpecification = [
  "interpolate", ["linear"], ["zoom"],
  10, 1,
  12, 1.6,
  14, 2.6,
  16, 3.5,
];

export const BORDE_DE_CAMINO_TENTATIVO_EN_CIRCUITO: ExpressionSpecification = [
  "interpolate", ["linear"], ["zoom"],
  10, 1.8,
  12, 2.8,
  14, 4.2,
  16, 5.5,
];

/**
 * Halo de la parte elegida: más ancho que el Camino, para que se note al
 * instante cuál pedazo está seleccionado.
 */
export const ANCHO_DE_PARTE_ELEGIDA: ExpressionSpecification = [
  "interpolate", ["linear"], ["zoom"],
  10, 6,
  12, 9,
  14, 13,
  16, 16,
];

/** Lee el grosor que quedaría a un zoom, para las pruebas. */
export function grosorSegunZoom(ancho: ExpressionSpecification, zoom: number): number {
  if (!Array.isArray(ancho) || ancho[0] !== "interpolate") {
    throw new Error("Se esperaba un ancho que cambie con el zoom.");
  }
  const pares: { zoom: number; valor: number }[] = [];
  for (let i = 3; i + 1 < ancho.length; i += 2) {
    pares.push({ zoom: Number(ancho[i]), valor: Number(ancho[i + 1]) });
  }
  if (pares.length === 0) throw new Error("El ancho no tiene valores.");
  if (zoom <= pares[0].zoom) return pares[0].valor;
  const ultimo = pares[pares.length - 1];
  if (zoom >= ultimo.zoom) return ultimo.valor;
  for (let i = 0; i < pares.length - 1; i += 1) {
    const a = pares[i];
    const b = pares[i + 1];
    if (zoom > b.zoom) continue;
    const t = (zoom - a.zoom) / (b.zoom - a.zoom);
    return a.valor + (b.valor - a.valor) * t;
  }
  return ultimo.valor;
}
