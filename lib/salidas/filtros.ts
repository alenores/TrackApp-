import { mostrarActividad, mostrarEsfuerzo } from "@/lib/rutas/actividades";
import { diaEnPalabras } from "@/lib/fechas";
import {
  ACTIVIDADES_RUTA,
  NIVELES_ESFUERZO,
  type ActividadRuta,
  type NivelEsfuerzo,
} from "@/types/database";

/**
 * Los filtros de la lista de salidas, sin nada de pantalla ni de base.
 *
 * Viajan en la dirección de la pantalla (`/salidas?actividad=…`): así se
 * comparten, sobreviven a recargar y los resuelve la base, que es la que tiene
 * todas las salidas y no solo las de la página que se ve.
 *
 * Dentro de un mismo filtro alcanza con que coincida una opción; entre filtros
 * distintos tienen que cumplirse todos.
 */

export type FiltrosDeSalidas = {
  /** Parte del título, sin importar mayúsculas. */
  titulo: string;
  actividades: ActividadRuta[];
  esfuerzos: NivelEsfuerzo[];
  /** Usuarios que fueron: quien la cargó o un compañero. */
  participantes: string[];
  /** «2026-10-02». */
  desde: string | null;
  hasta: string | null;
};

export const SIN_FILTROS: FiltrosDeSalidas = {
  titulo: "",
  actividades: [],
  esfuerzos: [],
  participantes: [],
  desde: null,
  hasta: null,
};

type Parametros = Record<string, string | string[] | undefined>;

const ES_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const ES_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function valores(parametro: string | string[] | undefined): string[] {
  const lista = Array.isArray(parametro) ? parametro : parametro ? [parametro] : [];
  return lista.flatMap((valor) => valor.split(",")).map((valor) => valor.trim()).filter(Boolean);
}

function unico(parametro: string | string[] | undefined): string {
  return (Array.isArray(parametro) ? parametro[0] : parametro)?.trim() ?? "";
}

/** Lo que vino en la dirección, revisado: lo que no se entiende se descarta. */
export function leerFiltros(parametros: Parametros): FiltrosDeSalidas {
  let desde: string | null = unico(parametros.desde);
  let hasta: string | null = unico(parametros.hasta);
  desde = ES_FECHA.test(desde) ? desde : null;
  hasta = ES_FECHA.test(hasta) ? hasta : null;
  // Si están dadas vuelta, se entiende lo que se quiso decir.
  if (desde && hasta && desde > hasta) [desde, hasta] = [hasta, desde];

  return {
    titulo: unico(parametros.titulo).slice(0, 120),
    actividades: [...new Set(valores(parametros.actividad))].filter((valor): valor is ActividadRuta =>
      ACTIVIDADES_RUTA.includes(valor as ActividadRuta),
    ),
    esfuerzos: [...new Set(valores(parametros.esfuerzo))].filter((valor): valor is NivelEsfuerzo =>
      NIVELES_ESFUERZO.includes(valor as NivelEsfuerzo),
    ),
    participantes: [...new Set(valores(parametros.participante))].filter((valor) => ES_ID.test(valor)),
    desde,
    hasta,
  };
}

/** La dirección de la lista con estos filtros, y la página si no es la primera. */
export function direccionDeSalidas(filtros: FiltrosDeSalidas, pagina = 1): string {
  const parametros = new URLSearchParams();
  if (filtros.titulo.trim()) parametros.set("titulo", filtros.titulo.trim());
  if (filtros.actividades.length) parametros.set("actividad", filtros.actividades.join(","));
  if (filtros.esfuerzos.length) parametros.set("esfuerzo", filtros.esfuerzos.join(","));
  if (filtros.participantes.length) parametros.set("participante", filtros.participantes.join(","));
  if (filtros.desde) parametros.set("desde", filtros.desde);
  if (filtros.hasta) parametros.set("hasta", filtros.hasta);
  if (pagina > 1) parametros.set("pagina", String(pagina));
  const texto = parametros.toString();
  return texto ? `/salidas?${texto}` : "/salidas";
}

export type FiltroPuesto = {
  clave: string;
  etiqueta: string;
  /** Los mismos filtros, sin este. */
  sinEste: FiltrosDeSalidas;
};

/** Cada filtro puesto, con su nombre para mostrarlo y cómo sacarlo. */
export function filtrosPuestos(
  filtros: FiltrosDeSalidas,
  nombreDe: (perfilId: string) => string,
): FiltroPuesto[] {
  const puestos: FiltroPuesto[] = [];

  if (filtros.titulo.trim()) {
    puestos.push({
      clave: "titulo",
      etiqueta: `«${filtros.titulo.trim()}»`,
      sinEste: { ...filtros, titulo: "" },
    });
  }
  for (const actividad of filtros.actividades) {
    puestos.push({
      clave: `actividad-${actividad}`,
      etiqueta: mostrarActividad(actividad).etiqueta,
      sinEste: { ...filtros, actividades: filtros.actividades.filter((cada) => cada !== actividad) },
    });
  }
  for (const esfuerzo of filtros.esfuerzos) {
    puestos.push({
      clave: `esfuerzo-${esfuerzo}`,
      etiqueta: `Esfuerzo ${mostrarEsfuerzo(esfuerzo).toLowerCase()}`,
      sinEste: { ...filtros, esfuerzos: filtros.esfuerzos.filter((cada) => cada !== esfuerzo) },
    });
  }
  for (const participante of filtros.participantes) {
    puestos.push({
      clave: `participante-${participante}`,
      etiqueta: `Con ${nombreDe(participante)}`,
      sinEste: {
        ...filtros,
        participantes: filtros.participantes.filter((cada) => cada !== participante),
      },
    });
  }
  if (filtros.desde) {
    puestos.push({
      clave: "desde",
      etiqueta: `Desde el ${diaEnPalabras(filtros.desde)}`,
      sinEste: { ...filtros, desde: null },
    });
  }
  if (filtros.hasta) {
    puestos.push({
      clave: "hasta",
      etiqueta: `Hasta el ${diaEnPalabras(filtros.hasta)}`,
      sinEste: { ...filtros, hasta: null },
    });
  }

  return puestos;
}

/**
 * El título para buscarlo en la base: `%` y `_` son comodines allá, y quien
 * escribe «50%» busca eso, no «50 y cualquier cosa».
 */
export function tituloParaBuscar(titulo: string): string {
  return titulo.trim().replace(/[\\%_]/g, (letra) => `\\${letra}`);
}
