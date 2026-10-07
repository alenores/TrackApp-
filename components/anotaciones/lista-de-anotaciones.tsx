"use client";

import { useMemo, useState } from "react";
import { deDondeSalio, IconoDeAnotacion, queEs } from "@/components/anotaciones/icono-de-anotacion";
import { Desplegable } from "@/components/ui/desplegable";
import { Opciones } from "@/components/ui/opciones";
import { Tarjeta } from "@/components/ui/tarjeta";
import {
  dondeQueda,
  filtrarAnotaciones,
  SIN_FILTROS_DE_ANOTACIONES,
  type FiltroDeLugar,
  type FiltroDeTipo,
  type FiltrosDeAnotaciones,
} from "@/lib/anotaciones/filtros-de-anotaciones";
import { COMO_SE_LLAMA } from "@/lib/anotaciones/iconos";
import { ICONOS_PUNTO, type Anotacion, type IconoPunto, type Sector, type Zona } from "@/types/database";

/**
 * La lista de anotaciones, igual en Mapas y en el sector. Cada renglón se toca
 * para abrirlo; no hay botones chicos de editar ni de borrar.
 *
 * En Mapas, donde hay de todo Córdoba, suma el filtro por zona y sector y dice
 * dónde queda cada una.
 */

type Props = {
  anotaciones: Anotacion[];
  zonas: Zona[];
  sectores: Sector[];
  /** `true` en Mapas: filtro por lugar y dónde queda cada una. */
  deTodaCordoba: boolean;
  /** Sin esto, los renglones se miran pero no se abren. */
  alAbrir?: (id: number) => void;
  puedeAbrir?: (anotacion: Anotacion) => boolean;
  /** La que está abierta en el formulario, para marcarla. */
  abiertaId: number | null;
};

const OPCIONES_DE_TIPO: { valor: FiltroDeTipo; etiqueta: string }[] = [
  { valor: "todas", etiqueta: "Todas" },
  { valor: "punto", etiqueta: "Puntos" },
  { valor: "trazo", etiqueta: "Trazos" },
];

export function ListaDeAnotaciones({ anotaciones, zonas, sectores, deTodaCordoba, alAbrir, puedeAbrir, abiertaId }: Props) {
  const [filtros, setFiltros] = useState<FiltrosDeAnotaciones>(SIN_FILTROS_DE_ANOTACIONES);

  const opcionesDeLugar = useMemo(
    () => [
      ...zonas.map((zona) => ({ valor: `zona:${zona.id}` as const, etiqueta: `Zona · ${zona.nombre}` })),
      ...sectores.map((sector) => {
        const zona = zonas.find((cada) => cada.id === sector.zonaId);
        return {
          valor: `sector:${sector.id}` as const,
          etiqueta: `Sector · ${zona?.nombre ?? "sin zona"} · ${sector.nombre}`,
        };
      }),
    ],
    [zonas, sectores],
  );
  const opcionesDeIcono = useMemo(
    () => ICONOS_PUNTO.map((icono) => ({ valor: icono, etiqueta: COMO_SE_LLAMA[icono] })),
    [],
  );

  const filtradas = useMemo(
    () => filtrarAnotaciones(anotaciones, filtros, zonas, sectores),
    [anotaciones, filtros, zonas, sectores],
  );

  return (
    <section aria-labelledby="titulo-de-la-lista-de-anotaciones" className="space-y-3">
      <h2 id="titulo-de-la-lista-de-anotaciones" className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
        {anotaciones.length === 0 ? "Anotaciones" : `Anotaciones (${anotaciones.length})`}
      </h2>

      {anotaciones.length > 0 ? (
        <div className="space-y-3">
          <Opciones
            etiqueta="Mostrar"
            opciones={OPCIONES_DE_TIPO}
            elegidas={[filtros.tipo]}
            alElegir={(tipo) =>
              setFiltros((actuales) => ({ ...actuales, tipo, icono: tipo === "trazo" ? null : actuales.icono }))
            }
            columnas={3}
          />
          <div className={`grid gap-3 ${deTodaCordoba ? "sm:grid-cols-2" : ""}`}>
            {deTodaCordoba ? (
              <Desplegable<FiltroDeLugar>
                etiqueta="Zona y sector"
                opciones={opcionesDeLugar}
                elegida={filtros.lugar}
                alElegir={(lugar) => setFiltros((actuales) => ({ ...actuales, lugar }))}
                textoDeNinguna="Todas las zonas y sectores"
              />
            ) : null}
            {filtros.tipo !== "trazo" ? (
              <Desplegable<IconoPunto>
                etiqueta="Ícono"
                opciones={opcionesDeIcono}
                elegida={filtros.icono}
                alElegir={(icono) => setFiltros((actuales) => ({ ...actuales, icono }))}
                textoDeNinguna="Todos los íconos"
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {filtradas.length === 0 ? (
        <Tarjeta>
          <p className="text-base leading-6 text-texto-suave">
            {anotaciones.length === 0
              ? deTodaCordoba
                ? "Todavía no hay anotaciones."
                : "Este sector todavía no tiene anotaciones."
              : "Ninguna anotación cumple con estos filtros."}
          </p>
        </Tarjeta>
      ) : (
        <ul className="space-y-2">
          {filtradas.map((anotacion) => {
            const titulo = anotacion.comentario?.trim() || queEs(anotacion);
            const detalle = [
              queEs(anotacion),
              deTodaCordoba ? dondeQueda(anotacion, zonas, sectores) : null,
              deDondeSalio(anotacion),
            ]
              .filter(Boolean)
              .join(" · ");
            const contenido = (
              <>
                <IconoDeAnotacion anotacion={anotacion} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-semibold text-texto">{titulo}</span>
                  <span className="block truncate text-sm text-texto-suave">{detalle}</span>
                </span>
                {anotacion.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- la foto ya viene achicada por el módulo de fotos.
                  <img src={anotacion.fotoUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                ) : null}
              </>
            );
            const clase = [
              "flex min-h-14 w-full items-center gap-3 rounded-xl border bg-superficie px-3 py-2 text-left",
              abiertaId === anotacion.id ? "border-acento-borde" : "border-borde",
            ].join(" ");
            return (
              <li key={anotacion.id}>
                {alAbrir && (puedeAbrir?.(anotacion) ?? true) ? (
                  <button
                    type="button"
                    onClick={() => alAbrir(anotacion.id)}
                    className={`${clase} hover:bg-superficie-alta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde`}
                  >
                    {contenido}
                  </button>
                ) : (
                  <div className={clase}>{contenido}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
