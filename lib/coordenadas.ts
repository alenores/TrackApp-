/**
 * Leer una coordenada de lo que sea que el usuario pegue.
 *
 * El usuario no escribe coordenadas: las copia de Google Maps. Y ahí hay una
 * trampa que no se ve. Un link de Maps trae **dos** pares de números:
 *
 *   - los que van después de la arroba, que son **el centro de la pantalla**
 *     cuando sacó el link;
 *   - los que van en `!3d…!4d…`, que son **el punto que marcó**.
 *
 * Los dos se parecen y no son lo mismo: en una captura real estaban a 230
 * metros uno del otro. Si la app agarra el de la arroba, el sector queda
 * corrido y el usuario se entera en el cerro.
 *
 * Por eso: primero se busca el punto marcado, y si lo único que hay es el
 * centro de la pantalla, **se avisa**.
 */

export type LecturaDeCoordenada =
  | { clase: "vacio" }
  | {
      clase: "leida";
      lat: number;
      lon: number;
      /** De dónde salieron los números, en criollo. */
      deDonde: string;
      /** Qué mirar antes de darlo por bueno. `null` cuando no hay nada raro. */
      aviso: string | null;
    }
  | { clase: "error"; titulo: string; detalle: string };

const PUNTO_MARCADO = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/;
const PLACE_CON_NUMEROS = /\/place\/(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
const CENTRO_DE_PANTALLA = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/;
const NUMEROS_SUELTOS = /(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)/;
const GRADOS_MINUTOS_SEGUNDOS =
  /(\d{1,3})\s*[°º]\s*(\d{1,2})\s*['′]\s*([\d.]+)\s*["″]?\s*([NSns])[\s,]+(\d{1,3})\s*[°º]\s*(\d{1,2})\s*['′]\s*([\d.]+)\s*["″]?\s*([EWOewo])/;

function pareceUnLink(texto: string): boolean {
  return /https?:|google\.|maps\.app|goo\.gl/i.test(texto);
}

function aDecimal(
  grados: string,
  minutos: string,
  segundos: string,
  hacia: string,
): number {
  const valor = Number(grados) + Number(minutos) / 60 + Number(segundos) / 3600;
  const letra = hacia.toUpperCase();
  return letra === "S" || letra === "W" || letra === "O" ? -valor : valor;
}

export function leerCoordenada(texto: string): LecturaDeCoordenada {
  const limpio = (texto ?? "").trim();

  if (limpio === "") return { clase: "vacio" };

  let lat: number | null = null;
  let lon: number | null = null;
  let deDonde = "";
  let aviso: string | null = null;

  const marcado = limpio.match(PUNTO_MARCADO);
  if (marcado) {
    lat = Number(marcado[1]);
    lon = Number(marcado[2]);
    deDonde = "Salió del punto marcado en el link.";
  }

  if (lat === null) {
    const place = limpio.match(PLACE_CON_NUMEROS);
    if (place) {
      lat = Number(place[1]);
      lon = Number(place[2]);
      deDonde = "Salió del punto del link.";
    }
  }

  if (lat === null) {
    const grados = limpio.match(GRADOS_MINUTOS_SEGUNDOS);
    if (grados) {
      lat = aDecimal(grados[1], grados[2], grados[3], grados[4]);
      lon = aDecimal(grados[5], grados[6], grados[7], grados[8]);
      deDonde = "Estaban en grados, minutos y segundos. Los pasé a números.";
    }
  }

  // Los números sueltos solo valen cuando no hay un link de por medio: adentro
  // de un link, cualquier par de números puede ser otra cosa.
  if (lat === null && !pareceUnLink(limpio)) {
    const sueltos = limpio.match(NUMEROS_SUELTOS);
    if (sueltos) {
      lat = Number(sueltos[1]);
      lon = Number(sueltos[2]);
      deDonde = "Los leí tal cual los pegaste.";
    }
  }

  if (lat === null) {
    const centro = limpio.match(CENTRO_DE_PANTALLA);
    if (centro) {
      lat = Number(centro[1]);
      lon = Number(centro[2]);
      deDonde = "Salieron del link.";
      aviso =
        "Ojo: ese link trae adónde estaba mirando la pantalla, no el punto que marcaste. Suelen estar un par de cuadras corridos. Si querés el punto exacto, tocalo en Maps, dale a Compartir y pegá ese link.";
    }
  }

  if (lat === null || lon === null) {
    return {
      clase: "error",
      titulo: "No encontré coordenadas ahí",
      detalle:
        "Sirve el link de Google Maps, dos números separados por coma, o los grados con minutos y segundos.",
    };
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return {
      clase: "error",
      titulo: "Esos números no se entienden",
      detalle: "Copiá de nuevo el punto desde Google Maps y volvé a pegarlo.",
    };
  }

  if (lat > 90 || lat < -90 || lon > 180 || lon < -180) {
    return {
      clase: "error",
      titulo: "Esos números no son una coordenada",
      detalle:
        "La latitud va de -90 a 90 y la longitud de -180 a 180. Fijate si se pegaron dos cosas juntas.",
    };
  }

  if (lat >= 0 || lon >= 0) {
    return {
      clase: "error",
      titulo: "Esas coordenadas no caen en Argentina",
      detalle:
        "Acá los dos números son negativos. Fijate si al copiar se perdió un signo menos.",
    };
  }

  return { clase: "leida", lat, lon, deDonde, aviso };
}

/** Cómo se muestra una coordenada en pantalla. Siempre con la misma cantidad
 * de decimales, así dos coordenadas se comparan de un vistazo. */
export function mostrarCoordenada(lat: number, lon: number): string {
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}
