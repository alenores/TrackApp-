"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { Mapa } from "@/components/mapa/mapa";

/**
 * El mapa se arma en el navegador: Leaflet necesita una pantalla de verdad y no
 * puede dibujarse en el servidor.
 *
 * Mientras carga se muestra un cartel, no un hueco: el usuario nunca se queda
 * sin saber qué está pasando.
 */

const MapaEnElNavegador = dynamic(
  () => import("@/components/mapa/mapa").then((modulo) => modulo.Mapa),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 w-full items-center justify-center rounded-xl border border-border bg-surface text-sm text-muted sm:h-80">
        Abriendo el mapa…
      </div>
    ),
  },
);

export function CargadorDeMapa(props: ComponentProps<typeof Mapa>) {
  return <MapaEnElNavegador {...props} />;
}
