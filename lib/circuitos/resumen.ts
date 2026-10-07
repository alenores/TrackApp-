import type { Feature, LineString, Position } from "geojson";
import type { ActividadRuta } from "@/types/database";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import { largoDeLinea } from "@/lib/caminos/geometria";
import type { ParteDibujada } from "@/lib/circuitos/dibujo";
import { partesDelCircuitoEnElMapa, type PropiedadDeParteDelCircuito } from "@/lib/circuitos/en-el-mapa";
import { exito, falla, type Resultado } from "@/lib/datos/resultado";

type Medida = { metros: number; porcentaje: number };
type Paso = "por_explorar" | "transitable" | "a_pie" | "sin_paso";
type Complejidad = "facil" | "media" | "dificil" | "sin_clasificar";
type TipoDeConsideracion = "por_explorar" | "a_pie" | "sin_paso" | "otra_actividad" | "camino_retirado";

export type ConsideracionDelCircuito = {
  tipo: TipoDeConsideracion;
  caminoId: number;
  caminoNombre: string;
  actividadDelCamino: ActividadRuta;
  metros: number;
};

export type ResumenDelCircuito = {
  actividad: ActividadRuta;
  metrosTotales: number;
  propia: Medida;
  sobreCaminos: Medida;
  pasos: Record<Paso, Medida>;
  complejidades: Record<Complejidad, Medida>;
  deOtraActividad: Medida;
  tramosPorExplorar: number;
  tramosAPie: number;
  tramosSinPaso: number;
  tramosDeOtraActividad: number;
  tramosDeCaminosRetirados: number;
  partesSinUnir: number;
  consideraciones: ConsideracionDelCircuito[];
};

const PASOS: readonly Paso[] = ["por_explorar", "transitable", "a_pie", "sin_paso"];
const COMPLEJIDADES: readonly Complejidad[] = ["facil", "media", "dificil", "sin_clasificar"];
const TIPOS: readonly TipoDeConsideracion[] = ["por_explorar", "a_pie", "sin_paso", "otra_actividad", "camino_retirado"];

function porcentaje(metros: number, total: number): number {
  return total > 0 ? Math.round((metros / total) * 1000) / 10 : 0;
}

function medir(metros: number, total: number): Medida {
  return { metros, porcentaje: porcentaje(metros, total) };
}

/** Solo tolera diferencias de cálculo del mismo punto; no une lugares cercanos. */
function mismoLugar(a: Position, b: Position): boolean {
  return Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
}

type ParteVisible = Feature<LineString, PropiedadDeParteDelCircuito>;

/** El resumen se recalcula con las clasificaciones actuales de los Caminos. */
export function resumirCircuito(
  partes: readonly ParteDibujada[],
  caminos: readonly CaminoGuardado[],
  actividad: ActividadRuta,
): Resultado<ResumenDelCircuito> {
  const dibujo = partesDelCircuitoEnElMapa(partes, caminos, actividad);
  if (!dibujo.ok) return dibujo;

  const metrosPorPaso: Record<Paso, number> = {
    por_explorar: 0, transitable: 0, a_pie: 0, sin_paso: 0,
  };
  const metrosPorComplejidad: Record<Complejidad, number> = {
    facil: 0, media: 0, dificil: 0, sin_clasificar: 0,
  };
  const consideraciones: ConsideracionDelCircuito[] = [];
  const continuidad: Partial<Record<TipoDeConsideracion, { indice: number; fin: Position; caminoId: number }>> = {};
  let metrosTotales = 0;
  let metrosPropios = 0;
  let metrosDeOtraActividad = 0;
  let partesSinUnir = 0;
  let ultimoFin: Position | null = null;

  for (const visible of dibujo.datos.features as ParteVisible[]) {
    const puntos = visible.geometry.coordinates;
    if (puntos.length < 2) return falla("Una parte del Circuito no tiene línea suficiente. Abrí el Circuito con señal para revisarla.");
    const metros = largoDeLinea(puntos);
    if (!Number.isFinite(metros) || metros <= 0) {
      return falla("Una parte del Circuito tiene un largo inválido. Abrí el Circuito con señal para revisarla.");
    }
    if (ultimoFin && !mismoLugar(ultimoFin, puntos[0])) partesSinUnir += 1;
    ultimoFin = puntos.at(-1) ?? null;
    metrosTotales += metros;

    if (visible.properties.clase === "propia") {
      metrosPropios += metros;
      for (const tipo of TIPOS) delete continuidad[tipo];
      continue;
    }

    const { paso, complejidad, camino_id, camino_nombre, actividad_del_camino, otra_actividad, camino_retirado } = visible.properties;
    if (!camino_id || !camino_nombre || !actividad_del_camino || !PASOS.includes(paso as Paso)) {
      return falla("Falta información de un Camino usado por el Circuito. Abrilo con señal para revisarlo.");
    }
    metrosPorPaso[paso as Paso] += metros;
    const nivel = COMPLEJIDADES.includes(complejidad as Complejidad) ? complejidad as Complejidad : "sin_clasificar";
    metrosPorComplejidad[nivel] += metros;
    if (otra_actividad) metrosDeOtraActividad += metros;

    for (const tipo of TIPOS) {
      const corresponde = tipo === "otra_actividad" ? otra_actividad
        : tipo === "camino_retirado" ? camino_retirado : paso === tipo;
      if (!corresponde) { delete continuidad[tipo]; continue; }
      const anterior = continuidad[tipo];
      if (anterior && anterior.caminoId === camino_id && mismoLugar(anterior.fin, puntos[0])) {
        consideraciones[anterior.indice].metros += metros;
        anterior.fin = puntos.at(-1)!;
      } else {
        const indice = consideraciones.length;
        consideraciones.push({ tipo, caminoId: camino_id, caminoNombre: camino_nombre,
          actividadDelCamino: actividad_del_camino, metros });
        continuidad[tipo] = { indice, caminoId: camino_id, fin: puntos.at(-1)! };
      }
    }
  }

  const contar = (tipo: TipoDeConsideracion) => consideraciones.filter((cada) => cada.tipo === tipo).length;
  const pasos = Object.fromEntries(PASOS.map((paso) => [paso, medir(metrosPorPaso[paso], metrosTotales)])) as Record<Paso, Medida>;
  const complejidades = Object.fromEntries(COMPLEJIDADES.map((nivel) => [nivel, medir(metrosPorComplejidad[nivel], metrosTotales)])) as Record<Complejidad, Medida>;
  return exito({
    actividad, metrosTotales,
    propia: medir(metrosPropios, metrosTotales),
    sobreCaminos: medir(metrosTotales - metrosPropios, metrosTotales),
    pasos, complejidades,
    deOtraActividad: medir(metrosDeOtraActividad, metrosTotales),
    tramosPorExplorar: contar("por_explorar"),
    tramosAPie: contar("a_pie"),
    tramosSinPaso: contar("sin_paso"),
    tramosDeOtraActividad: contar("otra_actividad"),
    tramosDeCaminosRetirados: contar("camino_retirado"),
    partesSinUnir,
    consideraciones,
  });
}
