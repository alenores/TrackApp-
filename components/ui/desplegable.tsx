"use client";

import { useId, useState } from "react";
import { vibrarAlTocar } from "@/lib/vibracion";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";
import { CLASE_DE_TITULO_DE_SECCION } from "@/components/ui/opciones";

/**
 * Elegir una opción de una lista larga, que se abre al tocar.
 *
 * **Reemplaza al `<select>` del sistema**, que abre renglones de veinte
 * píxeles. Acá cada renglón es de 56 y la lista se abre debajo, en la misma
 * pantalla. Para pocas opciones que conviene ver juntas está `Opciones`.
 */

export type OpcionDeDesplegable<T extends string | number> = {
  valor: T;
  etiqueta: string;
};

type DesplegableProps<T extends string | number> = {
  etiqueta: string;
  opciones: OpcionDeDesplegable<T>[];
  elegida: T | null;
  alElegir: (valor: T | null) => void;
  /** Lo que se muestra cuando no hay ninguna elegida, y la opción para volver a eso. */
  textoDeNinguna: string;
};

function Flecha({ abierta }: { abierta: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`h-5 w-5 shrink-0 transition-transform ${abierta ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Tilde() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-5 w-5 shrink-0">
      <path
        d="m5 12.5 4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Desplegable<T extends string | number>({
  etiqueta,
  opciones,
  elegida,
  alElegir,
  textoDeNinguna,
}: DesplegableProps<T>) {
  const [abierta, setAbierta] = useState(false);
  const idDeLaLista = useId();
  const idDeLaEtiqueta = useId();

  const actual = opciones.find((opcion) => opcion.valor === elegida);
  const renglones: { valor: T | null; etiqueta: string }[] = [
    { valor: null, etiqueta: textoDeNinguna },
    ...opciones,
  ];

  return (
    <div className="space-y-2">
      <span
        id={idDeLaEtiqueta}
        className={`block ${CLASE_DE_TITULO_DE_SECCION}`}
      >
        {etiqueta}
      </span>

      <button
        type="button"
        aria-expanded={abierta}
        aria-controls={idDeLaLista}
        aria-labelledby={idDeLaEtiqueta}
        onPointerDown={() => vibrarAlTocar()}
        onClick={() => setAbierta((antes) => !antes)}
        className={[
          CLASE_DE_RESPUESTA_AL_TOQUE,
          "flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border bg-fondo px-4 text-left text-base text-texto",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde",
          abierta ? "border-acento-borde" : "border-borde-fuerte",
        ].join(" ")}
      >
        <span className="truncate">{actual?.etiqueta ?? textoDeNinguna}</span>
        <Flecha abierta={abierta} />
      </button>

      {abierta ? (
        <ul
          id={idDeLaLista}
          role="listbox"
          aria-labelledby={idDeLaEtiqueta}
          className="overflow-hidden rounded-xl border border-borde-fuerte bg-superficie"
        >
          {renglones.map((renglon) => {
            const esLaElegida = renglon.valor === elegida;

            return (
              <li key={String(renglon.valor)} className="border-b border-borde last:border-b-0">
                <button
                  type="button"
                  role="option"
                  aria-selected={esLaElegida}
                  onPointerDown={() => vibrarAlTocar()}
                  onClick={() => {
                    alElegir(renglon.valor);
                    setAbierta(false);
                  }}
                  className={[
                    CLASE_DE_RESPUESTA_AL_TOQUE,
                    "flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left text-base",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-acento-borde",
                    esLaElegida
                      ? "bg-verde-fondo font-semibold text-verde-texto"
                      : "text-texto hover:bg-superficie-alta",
                  ].join(" ")}
                >
                  <span className="truncate">{renglon.etiqueta}</span>
                  {esLaElegida ? <Tilde /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
