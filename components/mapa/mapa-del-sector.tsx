"use client";

import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { useMapaDelSector } from "@/hooks/use-mapa-del-sector";
import { mostrarPeso, pesoAproximadoDelMapa } from "@/lib/mapas/descarga";
import { NOMBRE_DEL_TIPO, TIPOS_DE_MAPA } from "@/lib/offline/mapas";
import type { Sector } from "@/types/database";

/**
 * El mapa de un sector: bajarlo, verlo y sacarlo.
 *
 * Tiene cuatro estados y **ninguno queda mudo**: no bajado, bajando, bajado y
 * cortado a medias. El que más importa es el último: si una descarga se corta,
 * acá se dice qué pasó de verdad y qué hacer, porque enterarse en el cerro no
 * es enterarse.
 *
 * Un sector puede tener el mapa simple, el satelital o los dos: cada uno se
 * baja por separado, con su peso a la vista antes de tocar.
 */

type PropiedadesDelMapaDelSector = {
  sector: Sector;
  /** Todos los sectores. Se mantiene por las pantallas que lo pasan. */
  todosLosSectores: Sector[];
};

export function MapaDelSector({ sector }: PropiedadesDelMapaDelSector) {
  const { mapas, paso, bajar } = useMapaDelSector(sector);
  // Bajar necesita señal: sin señal el botón no aparece, lo que falta se dice igual.
  const haySenal = useHaySenal();

  if (paso.paso === "bajando") {
    const porcentaje = paso.total > 0 ? Math.round((paso.resueltos / paso.total) * 100) : 0;

    return (
      <Tarjeta tono="alta" className="space-y-3">
        <Rotulo>El mapa de este sector</Rotulo>
        <p className="text-base font-semibold text-texto">
          Bajando el mapa {NOMBRE_DEL_TIPO[paso.tipo].toLowerCase()}…
        </p>

        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-superficie">
            <div
              className="h-full rounded-full bg-acento-borde transition-[width]"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-texto-suave">
            {paso.total > 0 ? `${paso.resueltos} de ${paso.total}` : "empezando"}
          </span>
        </div>

        <p className="text-sm leading-6 text-texto-suave">
          No cierres la app hasta que termine. Tarda unos segundos.
        </p>
      </Tarjeta>
    );
  }

  return (
    <div className="mt-2 space-y-2 border-t border-borde pt-2 text-sm">
      {TIPOS_DE_MAPA.map((tipo) => {
        const bajado = mapas.some((cada) => cada.tipo === tipo);
        const fallo = paso.paso === "fallo" && paso.tipo === tipo ? paso : null;

        return (
          <div key={tipo} className="space-y-1">
            <div className="flex min-h-14 items-center justify-between gap-3">
              {bajado ? (
                <span className="flex items-center gap-1 font-medium text-verde-texto">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {NOMBRE_DEL_TIPO[tipo]}: descargado
                </span>
              ) : (
                <span className="text-texto-suave">
                  {NOMBRE_DEL_TIPO[tipo]}:{" "}
                  <strong className="text-texto">
                    {mostrarPeso(pesoAproximadoDelMapa(sector.rectangulo, undefined, tipo))}
                  </strong>
                </span>
              )}

              {!bajado && haySenal ? (
                <Boton variante={tipo === "simple" ? "principal" : "secundario"} onClick={() => void bajar(tipo)}>
                  {fallo ? "Reintentar" : "Descargar"}
                </Boton>
              ) : null}
            </div>

            {fallo ? (
              <p role="alert" className="rounded-xl bg-rojo-fondo px-3 py-2 leading-6 text-rojo-texto">
                Quedó a medio bajar: {fallo.motivo} Lo que entró queda guardado, así que
                reintentar tarda menos.
              </p>
            ) : null}
          </div>
        );
      })}

    </div>
  );
}

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
      {children}
    </h3>
  );
}
