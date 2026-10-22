import type { Position } from "geojson";
import type { ActividadRuta } from "@/types/database";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import type { CondicionDePaso } from "@/lib/caminos/partes";
import { textoDeDistancia, type EstiloDeTramo } from "@/lib/alturas/grafico";
import type { ParteDibujada } from "@/lib/circuitos/dibujo";
import { partesDelCircuitoEnElMapa } from "@/lib/circuitos/en-el-mapa";
import { exito, type Resultado } from "@/lib/datos/resultado";
import type { Caja } from "@/lib/salidas/linea";

/**
 * La miniatura del Circuito vista desde arriba: la misma línea del mapa,
 * partida por colores y por tipo de línea, encajada en una caja.
 *
 * Cuenta pura, sin pantalla. El norte queda arriba y la forma no se estira.
 */

export type SegmentoDeMiniatura = {
  coordenadas: Position[];
  estilo: EstiloDeTramo;
  paso: CondicionDePaso | null;
};

export type TrazoDeMiniatura = {
  puntos: [number, number][];
  estilo: EstiloDeTramo;
  paso: CondicionDePaso | null;
  /** El medio del tramo, si es sin paso: ahí va la cruz. */
  cruz: [number, number] | null;
  /** El medio del tramo, si es a pie con equipo: ahí va el triangulito. */
  triangulo: [number, number] | null;
};

const PASOS: readonly CondicionDePaso[] = ["por_explorar", "transitable", "a_pie", "sin_paso"];

function esPaso(valor: string | null): valor is CondicionDePaso {
  return PASOS.some((paso) => paso === valor);
}

function estiloDe(complejidad: string | null): EstiloDeTramo {
  if (complejidad === "facil" || complejidad === "media" || complejidad === "dificil") return complejidad;
  return "sin_clasificar";
}

/** Los pedazos pintados como en el mapa, listos para la miniatura. */
export function segmentosParaLaMiniatura(
  partes: readonly ParteDibujada[],
  caminos: readonly CaminoGuardado[],
  actividad: ActividadRuta,
): Resultado<SegmentoDeMiniatura[]> {
  const dibujo = partesDelCircuitoEnElMapa(partes, caminos, actividad);
  if (!dibujo.ok) return dibujo;
  return exito(dibujo.datos.features.flatMap((feature) => {
    if (feature.geometry.coordinates.length < 2) return [];
    const { clase, complejidad, paso } = feature.properties;
    return [{
      coordenadas: feature.geometry.coordinates,
      estilo: clase === "propia" ? "propio" : estiloDe(complejidad),
      paso: esPaso(paso) ? paso : null,
    }];
  }));
}

function encuadre(puntos: Position[], caja: Caja): ((lon: number, lat: number) => [number, number]) | null {
  if (puntos.length < 2) return null;
  const latitudMedia = puntos.reduce((suma, punto) => suma + punto[1], 0) / puntos.length;
  const correccion = Math.cos((latitudMedia * Math.PI) / 180);
  const planos = puntos.map(([lon, lat]) => [lon * correccion, lat] as const);
  const xs = planos.map(([x]) => x);
  const ys = planos.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const anchoReal = maxX - minX;
  const altoReal = maxY - minY;
  if (anchoReal === 0 && altoReal === 0) return null;
  const escala = Math.min(
    anchoReal > 0 ? caja.ancho / anchoReal : Number.POSITIVE_INFINITY,
    altoReal > 0 ? caja.alto / altoReal : Number.POSITIVE_INFINITY,
  );
  const sobraX = (caja.ancho - anchoReal * escala) / 2;
  const sobraY = (caja.alto - altoReal * escala) / 2;
  return (lon, lat) => [
    Math.round((caja.x + sobraX + (lon * correccion - minX) * escala) * 10) / 10,
    Math.round((caja.y + sobraY + (maxY - lat) * escala) * 10) / 10,
  ];
}

/**
 * Encaja todos los pedazos en la misma caja. `aqui` es el lugar del GPS sobre
 * la línea; si no hay, la miniatura no marca dónde estás.
 */
export function dibujarMiniatura(
  segmentos: readonly SegmentoDeMiniatura[],
  caja: Caja,
  aqui: Position | null,
): { trazos: TrazoDeMiniatura[]; aqui: [number, number] | null } | null {
  const todos = segmentos.flatMap((segmento) => segmento.coordenadas);
  const proyectar = encuadre(todos, caja);
  if (!proyectar) return null;
  const trazos = segmentos.flatMap((segmento) => {
    if (segmento.coordenadas.length < 2) return [];
    const puntos = segmento.coordenadas.map(([lon, lat]) => proyectar(lon, lat));
    const desde = puntos[Math.floor((puntos.length - 1) / 2)];
    const hasta = puntos[Math.ceil((puntos.length - 1) / 2)];
    const cruz: [number, number] | null = desde && hasta
      ? [Math.round(((desde[0] + hasta[0]) / 2) * 10) / 10, Math.round(((desde[1] + hasta[1]) / 2) * 10) / 10]
      : null;
    return [{
      puntos,
      estilo: segmento.estilo,
      paso: segmento.paso,
      cruz: segmento.paso === "sin_paso" ? cruz : null,
      triangulo: segmento.paso === "a_pie" ? cruz : null,
    }];
  });
  if (trazos.length === 0) return null;
  return {
    trazos,
    aqui: aqui ? proyectar(aqui[0], aqui[1]) : null,
  };
}

/** El renglón de la miniatura: el largo y, si se puede, dónde estás. */
export function textoDeDondeEstas(datos: {
  largoM: number | null;
  llevasM: number | null;
  alejamientoM: number | null;
  hayPosicion: boolean;
}): string {
  const largo = datos.largoM !== null && datos.largoM >= 0 ? `Largo ${textoDeDistancia(datos.largoM)}` : null;
  if (datos.llevasM !== null && largo) return `${largo} · llevás ${textoDeDistancia(datos.llevasM)}`;
  if (datos.llevasM !== null) return `Llevás ${textoDeDistancia(datos.llevasM)}`;
  const aviso = !datos.hayPosicion
    ? "Todavía no hay posición del GPS: no se marca dónde estás."
    : datos.alejamientoM !== null
      ? `Estás a ${textoDeDistancia(datos.alejamientoM)} del Circuito: no se marca dónde estás.`
      : "No se pudo marcar dónde estás en este Circuito.";
  return largo ? `${largo}. ${aviso}` : aviso;
}
