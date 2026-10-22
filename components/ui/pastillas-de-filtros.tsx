"use client";

import { Boton } from "@/components/ui/boton";

/**
 * Los filtros puestos sobre una lista, como pastillas con su cruz, y
 * «Limpiar todo» al final. Sacar uno cambia lo que se ve; no sale a internet.
 */

export type Puesto<T> = {
  clave: string;
  etiqueta: string;
  /** Los mismos filtros, sin este. */
  sinEste: T;
};

type Props<T> = {
  puestos: Puesto<T>[];
  alSacar: (sinEste: T) => void;
  alLimpiar: () => void;
};

export function PastillasDeFiltros<T>({ puestos, alSacar, alLimpiar }: Props<T>) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Filtros puestos">
      {puestos.map((puesto) => (
        <li key={puesto.clave}>
          <span className="inline-flex h-10 items-center gap-1 rounded-full border border-acento-borde bg-verde-fondo pl-3.5 text-sm font-semibold text-verde-texto">
            {puesto.etiqueta}
            <button
              type="button"
              onClick={() => alSacar(puesto.sinEste)}
              aria-label={`Sacar el filtro ${puesto.etiqueta}`}
              className="flex h-10 w-10 items-center justify-center rounded-full text-lg leading-none hover:bg-superficie-alta"
            >
              ×
            </button>
          </span>
        </li>
      ))}
      <li>
        <Boton variante="secundario" onClick={alLimpiar} className="rounded-full">
          Limpiar todo
        </Boton>
      </li>
    </ul>
  );
}
