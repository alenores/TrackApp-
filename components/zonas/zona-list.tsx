"use client";

import { ZonaCard } from "@/components/zonas/zona-card";
import { Card } from "@/components/ui/card";
import { TapLink } from "@/components/ui/tap-link";
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

export function ZonaList({
  zonas,
  soyAdministrador,
  sectoresPorZona = {},
  avisoDeListaIncompleta = null,
}: ZonaListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Zonas</h1>

        {soyAdministrador ? (
          <TapLink
            href="/zonas/nueva"
            className="inline-flex min-h-14 items-center justify-center rounded-xl border border-emerald-700/50 bg-accent-light px-5 py-3 text-base font-semibold text-accent-foreground transition-colors hover:bg-accent"
          >
            Nueva zona
          </TapLink>
        ) : null}
      </div>

      {avisoDeListaIncompleta ? (
        <Card accent>
          <p role="alert" className="text-sm leading-6 text-amber-200">
            La lista de zonas quedó incompleta: {avisoDeListaIncompleta}. Lo que
            ves acá abajo puede no ser todo. Recargá la pantalla para intentar de
            nuevo.
          </p>
        </Card>
      ) : null}

      {zonas.length === 0 ? (
        <Card>
          <p className="text-base font-medium text-slate-300">
            Todavía no hay zonas.
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            {soyAdministrador
              ? "Creá la primera zona para empezar a armar los sectores que después se descargan."
              : "Cuando Ale cargue la primera zona, va a aparecer acá."}
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {zonas.map((zona) => (
            <li key={zona.id}>
              <ZonaCard
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
