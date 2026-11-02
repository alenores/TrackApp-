"use client";

import { useMemo, useState, type ReactNode } from "react";
import { deDondeSalio, IconoDeAnotacion, queEs } from "@/components/anotaciones/icono-de-anotacion";
import { Casilla } from "@/components/ui/casilla";
import { MenuDeAcciones, type AccionDelMenu } from "@/components/ui/menu-de-acciones";
import { Opciones } from "@/components/ui/opciones";
import { SelectorDeActividadesDelMapa } from "@/components/caminos/selector-de-actividades-del-mapa";
import { comparteActividad } from "@/lib/caminos/seleccion-del-mapa";
import type { SeleccionDelMapa } from "@/lib/caminos/seleccion-del-mapa";
import { Tarjeta } from "@/components/ui/tarjeta";
import { mostrarActividad } from "@/lib/rutas/actividades";
import { NOMBRE_DE_LA_CLASE, type ClaseDeMarca } from "@/lib/marcas/clases";
import {
  agrupar,
  FILTRO_DE_AUTOR_A_LA_VISTA,
  filtrosQueSeAplican,
  pasaLosFiltros,
  type Autoria,
  type FiltrosDeMarcas,
  type GrupoArmado,
  type GrupoDeLaLista,
  type MarcaDeLaLista,
  type Origen,
} from "@/lib/marcas/lista";
import { IconoDeClase } from "@/components/marcas/icono-de-clase";
import type { CaminoSinLinea } from "@/lib/caminos/datos";
import type { Anotacion, Zona } from "@/types/database";

/**
 * La lista de Marcas: filtros arriba y los grupos con sus tildes.
 *
 * Tildar decide qué se ve en el mapa. Tocar el renglón muestra esa marca en
 * el mapa. Editar y eliminar están en los tres puntos, y solo para quien
 * puede; lo que trajo OpenStreetMap no tiene, porque queda como vino.
 */

type Propiedades = {
  marcas: MarcaDeLaLista[];
  caminos: Map<number, CaminoSinLinea>;
  detalles: Map<number, Anotacion>;
  zonas: Map<number, Zona>;
  sectoresPorZona: Record<number, number>;
  filtros: FiltrosDeMarcas;
  seleccion: SeleccionDelMapa;
  alCambiarSeleccion: (seleccion: SeleccionDelMapa) => void;
  alCambiarFiltros: (filtros: FiltrosDeMarcas) => void;
  miPerfilId: string | null;
  destildadas: ReadonlySet<string>;
  alTildarUna: (clave: string) => void;
  alTildarGrupo: (grupo: GrupoArmado) => void;
  alMostrar: (marca: MarcaDeLaLista) => void;
  /** Lo que se puede hacer con cada marca: vacío si nada. */
  accionesDe: (marca: MarcaDeLaLista) => AccionDelMenu[];
  /**
   * Hay marcas, pero ninguna entra en el pedazo de mapa que se está mirando.
   * El mapa sigue mostrando lo tildado: esto solo explica la lista vacía.
   */
  nadaEnEstaVista?: boolean;
  /**
   * Lo que solo explica a un grupo y va adentro de él, cuando está abierto:
   * la referencia de colores y líneas va adentro de Caminos.
   */
  adentroDelGrupo?: Partial<Record<GrupoDeLaLista, ReactNode>>;
};

const NOMBRE_DEL_GRUPO: Record<GrupoDeLaLista, string> = {
  ...Object.fromEntries(Object.entries(NOMBRE_DE_LA_CLASE).map(([clase, nombre]) => [clase, nombre.varias])) as Record<ClaseDeMarca, string>,
  zona: "Zonas",
};

/** Al abrir Marcas todos los grupos arrancan plegados, pedido de Ale. */
const PLEGADOS_AL_ABRIR: GrupoDeLaLista[] = ["camino", "punto", "trazo", "zona"];
const OPCIONES_DE_ORIGEN: { valor: Origen; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "propios", etiqueta: "Propios" },
  { valor: "openstreetmap", etiqueta: "OpenStreetMap" },
];
const OPCIONES_DE_AUTORIA: { valor: Autoria; etiqueta: string }[] = [
  { valor: "todas", etiqueta: "De todos" },
  { valor: "mias", etiqueta: "Mías" },
  { valor: "de_otros", etiqueta: "De otros" },
];

export function ListaDeMarcas(propiedades: Propiedades) {
  const { marcas, filtros, alCambiarFiltros, miPerfilId, destildadas } = propiedades;
  const [plegados, setPlegados] = useState<GrupoDeLaLista[]>(PLEGADOS_AL_ABRIR);

  const enLaLista = useMemo(
    () => marcas.filter((marca) => pasaLosFiltros(marca, filtrosQueSeAplican(filtros), miPerfilId)),
    [marcas, filtros, miPerfilId],
  );
  // Los grupos salen de todo lo que hay, no de lo filtrado: si la actividad
  // deja a Caminos sin ninguno, el grupo sigue ahí para cambiarla.
  const grupos = useMemo(() => {
    const visibles = new Set(enLaLista.map((marca) => marca.clave));
    return agrupar(marcas, destildadas).map((grupo) => {
      const delGrupo = grupo.marcas.filter((marca) => visibles.has(marca.clave));
      return { ...grupo, marcas: delGrupo, tildadas: delGrupo.filter((marca) => !destildadas.has(marca.clave)).length };
    });
  }, [marcas, enLaLista, destildadas]);

  /** Lo que va adentro de cada grupo, arriba de su lista. La actividad solo filtra Caminos. */
  const adentroDe = (grupo: GrupoDeLaLista): ReactNode => {
    if (grupo === "punto" || grupo === "trazo") {
      // Filtro discreto: texto chico, sin recuadros. Vale para puntos y trazos a la vez.
      return (
        <div role="radiogroup" aria-label="Origen de los puntos y trazos" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-texto-suave">
          <span>Origen</span>
          {OPCIONES_DE_ORIGEN.map((opcion) => {
            const elegida = filtros.origen === opcion.valor;
            return (
              <button key={opcion.valor} type="button" role="radio" aria-checked={elegida}
                onClick={() => alCambiarFiltros({ ...filtros, origen: opcion.valor })}
                className={`rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde ${elegida ? "font-semibold text-texto" : "underline underline-offset-2"}`}>
                {opcion.etiqueta}
              </button>
            );
          })}
        </div>
      );
    }
    return propiedades.adentroDelGrupo?.[grupo] ?? null;
  };
  // Los Caminos que la actividad elegida deja afuera: se dicen, no se esconden callados.
  const caminosOcultos = marcas.filter((marca) => marca.grupo === "camino"
    && !comparteActividad(marca.actividades ?? [], propiedades.seleccion.visibles)).length;

  return (
    <div className="space-y-4">
      {FILTRO_DE_AUTOR_A_LA_VISTA ? (
        <Opciones etiqueta="De quién" titulo="seccion" columnas={3}
          opciones={OPCIONES_DE_AUTORIA} elegidas={[filtros.autoria]}
          alElegir={(autoria) => alCambiarFiltros({ ...filtros, autoria })} />
      ) : null}

      {grupos.length === 0 ? (
        <Tarjeta>
          <p className="text-base leading-6 text-texto-suave">
            {marcas.length === 0
              ? propiedades.nadaEnEstaVista
                ? "En lo que estás mirando no hay nada de la lista. Alejate o mové el mapa."
                : "Todavía no hay marcas en el mapa."
              : "Ninguna marca cumple con estos filtros. Probá sacando alguno."}
          </p>
        </Tarjeta>
      ) : (
        <div className="space-y-3">
          {grupos.map((grupo) => {
            const plegado = plegados.includes(grupo.grupo);
            const todas = grupo.tildadas === grupo.marcas.length;
            return (
              <section key={grupo.grupo} aria-label={NOMBRE_DEL_GRUPO[grupo.grupo]}
                className={`overflow-hidden rounded-xl border bg-superficie shadow-[var(--sombra)] ${grupo.tildadas > 0 ? "border-acento-borde" : "border-borde"}`}>
                <div className="flex min-h-12 items-center gap-3 px-3">
                  <Casilla tildada={todas} aMedias={!todas && grupo.tildadas > 0}
                    etiqueta={`Ver en el mapa todos los ${NOMBRE_DEL_GRUPO[grupo.grupo]}`}
                    alTocar={() => propiedades.alTildarGrupo(grupo)} />
                  <button type="button" aria-expanded={!plegado}
                    onClick={() => setPlegados(plegado ? plegados.filter((cada) => cada !== grupo.grupo) : [...plegados, grupo.grupo])}
                    className="flex min-h-12 flex-1 items-center gap-2 text-left">
                    <span className="text-texto-suave"><IconoDeClase grupo={grupo.grupo} /></span>
                    <span className="flex-1 text-base font-semibold text-texto">{NOMBRE_DEL_GRUPO[grupo.grupo]}</span>
                    <span className="text-sm tabular-nums text-texto-suave">{grupo.tildadas} de {grupo.marcas.length}</span>
                    <svg viewBox="0 0 24 24" fill="none" className={`h-4 w-4 text-texto-suave transition-transform ${plegado ? "" : "rotate-180"}`} aria-hidden
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                </div>
                {/* Qué actividades se están mirando: siempre a la vista, abierta o cerrada la tarjeta. */}
                {grupo.grupo === "camino" ? (
                  <div className="border-t border-borde px-3 py-3">
                    <SelectorDeActividadesDelMapa seleccion={propiedades.seleccion} alCambiar={propiedades.alCambiarSeleccion}
                      ocultos={caminosOcultos} />
                  </div>
                ) : null}
                {plegado ? null : (
                  <>
                    {adentroDe(grupo.grupo) ? (
                      <div className="border-t border-borde px-3 py-3">{adentroDe(grupo.grupo)}</div>
                    ) : null}
                    {grupo.marcas.length > 0 ? (
                      <ul className="border-t border-borde bg-fondo/40">
                        {grupo.marcas.map((marca) => <Renglon key={marca.clave} marca={marca} {...propiedades} />)}
                      </ul>
                    ) : (
                      <p className="border-t border-borde px-3 py-3 text-sm text-texto-suave">Ningún Camino tiene esa actividad.</p>
                    )}
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Renglon({ marca, caminos, detalles, zonas, sectoresPorZona, destildadas, alTildarUna, alMostrar, accionesDe }: Propiedades & { marca: MarcaDeLaLista }) {
  const { titulo, detalle, icono } = queMostrar(marca, caminos, detalles, zonas, sectoresPorZona);
  const acciones = accionesDe(marca);
  return (
    <li className="flex min-h-14 items-center gap-3 border-b border-borde px-3 py-1 last:border-b-0">
      <Casilla clara tildada={!destildadas.has(marca.clave)} etiqueta={`Ver «${titulo}» en el mapa`} alTocar={() => alTildarUna(marca.clave)} />
      <button type="button" onClick={() => alMostrar(marca)} title="Mostrar en el mapa"
        className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg text-left hover:bg-superficie-alta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde">
        {icono}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-semibold text-texto">{titulo}</span>
          <span className="block truncate text-sm text-texto-suave">{detalle}</span>
        </span>
      </button>
      {acciones.length > 0 ? <MenuDeAcciones etiqueta={`Opciones de «${titulo}»`} acciones={acciones} /> : null}
    </li>
  );
}

const enCuadrito = (grupo: GrupoDeLaLista) => (
  <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-superficie-alta text-texto">
    <IconoDeClase grupo={grupo} />
  </span>
);
const ICONO_DE_CAMINO = enCuadrito("camino");
const ICONO_DE_ZONA = enCuadrito("zona");

function queMostrar(
  marca: MarcaDeLaLista,
  caminos: Map<number, CaminoSinLinea>,
  detalles: Map<number, Anotacion>,
  zonas: Map<number, Zona>,
  sectoresPorZona: Record<number, number>,
): { titulo: string; detalle: string; icono: ReactNode } {
  if (marca.grupo === "camino") {
    const camino = caminos.get(marca.id);
    const largo = camino ? `${(camino.largoM / 1000).toFixed(1).replace(".", ",")} km` : null;
    const actividades = (camino?.actividades ?? []).map((actividad) => mostrarActividad(actividad).etiqueta).join(" · ");
    return { titulo: camino?.nombre ?? "Camino", detalle: [largo, actividades].filter(Boolean).join(" · "), icono: ICONO_DE_CAMINO };
  }
  if (marca.grupo === "zona") {
    const zona = zonas.get(marca.id);
    const cantidad = sectoresPorZona[marca.id] ?? 0;
    return { titulo: zona?.nombre ?? "Zona", detalle: `${cantidad} ${cantidad === 1 ? "sector" : "sectores"}`, icono: ICONO_DE_ZONA };
  }
  const anotacion = detalles.get(marca.id);
  if (!anotacion) return { titulo: NOMBRE_DE_LA_CLASE[marca.grupo].una, detalle: "", icono: null };
  return {
    titulo:
      anotacion.tipo === "punto"
        ? anotacion.titulo?.trim() || anotacion.comentario?.trim() || queEs(anotacion)
        : anotacion.comentario?.trim() || queEs(anotacion),
    detalle: [queEs(anotacion), deDondeSalio(anotacion)].join(" · "),
    icono: <IconoDeAnotacion anotacion={anotacion} />,
  };
}
