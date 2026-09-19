import { leerCoordenada } from "@/lib/coordenadas";
import type { Rectangulo } from "@/types/database";

/**
 * Las dos esquinas de una zona o de un sector.
 *
 * Esto es cálculo, no pantalla: vive acá para poder probarlo. Una esquina mal
 * leída no falla, no avisa y no se ve — simplemente deja el pedazo de mapa
 * corrido, y el usuario se entera en el cerro.
 */

export type CamposDelTerritorio = {
  nombre: string;
  descripcion: string;
  /** Lo que el usuario pegó, tal cual. Se guarda crudo para poder corregirlo. */
  noroeste: string;
  sudeste: string;
};

export const TERRITORIO_VACIO: CamposDelTerritorio = {
  nombre: "",
  descripcion: "",
  noroeste: "",
  sudeste: "",
};

export function territorioDesdeRectangulo(
  nombre: string,
  descripcion: string | null,
  rectangulo: Rectangulo,
): CamposDelTerritorio {
  return {
    nombre,
    descripcion: descripcion ?? "",
    noroeste: `${rectangulo.latNorte}, ${rectangulo.lonOeste}`,
    sudeste: `${rectangulo.latSur}, ${rectangulo.lonEste}`,
  };
}

export type RectanguloDeLosCampos =
  | { ok: true; rectangulo: Rectangulo }
  | { ok: false; error: string | null };

/**
 * Arma el rectángulo con lo que se pegó en las dos esquinas.
 *
 * Devuelve `error: null` cuando todavía falta completar algo: eso no es un
 * error del usuario y no corresponde retarlo.
 */
export function rectanguloDeLosCampos(
  campos: CamposDelTerritorio,
): RectanguloDeLosCampos {
  const noroeste = leerCoordenada(campos.noroeste);
  const sudeste = leerCoordenada(campos.sudeste);

  if (noroeste.clase !== "leida" || sudeste.clase !== "leida") {
    const faltaCompletar =
      noroeste.clase === "vacio" || sudeste.clase === "vacio";
    return {
      ok: false,
      error: faltaCompletar
        ? null
        : "Revisá las dos esquinas: alguna no se entiende.",
    };
  }

  if (noroeste.lat <= sudeste.lat) {
    return {
      ok: false,
      error:
        "La esquina de arriba quedó más al sur que la de abajo. Fijate si las pegaste al revés.",
    };
  }

  if (sudeste.lon <= noroeste.lon) {
    return {
      ok: false,
      error:
        "La esquina de la derecha quedó más al oeste que la de la izquierda. Fijate si las pegaste al revés.",
    };
  }

  return {
    ok: true,
    rectangulo: {
      latNorte: noroeste.lat,
      latSur: sudeste.lat,
      lonEste: sudeste.lon,
      lonOeste: noroeste.lon,
    },
  };
}
