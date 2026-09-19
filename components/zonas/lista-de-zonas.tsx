"use client";

import { TarjetaDeZona } from "@/components/zonas/tarjeta-de-zona";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Enlace } from "@/components/ui/enlace";
import type { Zona } from "@/types/database";

/**
 * La lista de zonas.
 *
 * Crear zonas es tarea exclusiva del administrador, así que el botón de crear
 * solo aparece para él.
 */

type ZonaListProps = {
  zonas: Zona[];
  soyAdministrador: boolean;
  sectoresPorZona?: Record<number, number>;
  /** Cuando la lista quedó corta, se dice. Nunca se muestra incompleta callado. */
  avisoDeListaIncompleta?: string | null;
};

export function ListaDeZonas({
  zonas,
  soyAdministrador,
  sectoresPorZona = {},
  avisoDeListaIncompleta = null,
}: ZonaListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-texto">Zonas</h1>

        {soyAdministrador ? (
          <Enlace
            href="/zonas/nueva"
            className="inline-flex min-h-14 items-center justify-center rounded-xl border border-acento-borde bg-acento px-5 py-3 text-base font-semibold text-acento-texto transition-colors hover:bg-acento-hover"
          >
            Nueva zona
          </Enlace>
        ) : null}
      </div>

      {avisoDeListaIncompleta ? (
        <Tarjeta franja="ambar">
          <p role="alert" className="text-sm leading-6 text-ambar-texto">
            La lista de zonas quedó incompleta: {avisoDeListaIncompleta}. Lo que
            ves acá abajo puede no ser todo. Recargá la pantalla para intentar de
            nuevo.
          </p>
        </Tarjeta>
      ) : null}

      {zonas.length === 0 ? (
        <Tarjeta>
          <p className="text-base font-medium text-texto-suave">
            Todavía no hay zonas.
          </p>
          <p className="mt-1 text-sm leading-6 text-texto-suave">
            {soyAdministrador
              ? "Creá la primera zona para empezar a armar los sectores que después se descargan."
              : "Cuando Ale cargue la primera zona, va a aparecer acá."}
          </p>
        </Tarjeta>
      ) : (
        <ul className="space-y-3">
          {zonas.map((zona) => (
            <li key={zona.id}>
              <TarjetaDeZona
                zona={zona}
                soyAdministrador={soyAdministrador}
                cantidadDeSectores={sectoresPorZona[zona.id]}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
