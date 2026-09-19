"use client";

import { vibrarAlTocar } from "@/lib/vibracion";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";

/**
 * Elegir entre varias opciones, tocando.
 *
 * **Reemplaza al `<select>` del sistema**, que además de ser una pantalla del
 * sistema operativo abre una lista con renglones de veinte píxeles: imposible
 * de acertar con guantes. Acá cada opción es un botón de 56, se ven todas
 * juntas y se ve cuál está elegida sin desplegar nada.
 */

export type Opcion<T extends string | number> = {
  valor: T;
  etiqueta: string;
  /** Trazo del ícono, para dibujar dentro de un `<svg viewBox="0 0 24 24">`. */
  trazo?: string;
};

type OpcionesProps<T extends string | number> = {
  etiqueta: string;
  ayuda?: string;
  opciones: Opcion<T>[];
  elegidas: T[];
  alElegir: (valor: T) => void;
  /** Cuántas entran por fila. */
  columnas?: 2 | 3 | 4 | 5;
  /** `true` cuando se puede elegir más de una. */
  multiple?: boolean;
};

const COLUMNAS: Record<2 | 3 | 4 | 5, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

export function Opciones<T extends string | number>({
  etiqueta,
  ayuda,
  opciones,
  elegidas,
  alElegir,
  columnas = 2,
  multiple = false,
}: OpcionesProps<T>) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-1.5 p-0 text-sm font-medium text-texto-suave">
        {etiqueta}
      </legend>
      {ayuda ? (
        <p className="mb-2 text-sm leading-6 text-texto-suave">{ayuda}</p>
      ) : null}

      <div className={`grid gap-1.5 ${COLUMNAS[columnas]}`}>
        {opciones.map((opcion) => {
          const elegida = elegidas.includes(opcion.valor);

          return (
            <button
              key={String(opcion.valor)}
              type="button"
              role={multiple ? undefined : "radio"}
              aria-checked={multiple ? undefined : elegida}
              aria-pressed={multiple ? elegida : undefined}
              onPointerDown={() => vibrarAlTocar()}
              onClick={() => alElegir(opcion.valor)}
              className={[
                CLASE_DE_RESPUESTA_AL_TOQUE,
                "flex min-h-14 items-center justify-center gap-1.5 rounded-xl border px-2 text-sm font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde",
                elegida
                  ? "border-acento-borde bg-acento text-acento-texto"
                  : "border-borde-fuerte bg-fondo text-texto",
              ].join(" ")}
            >
              {opcion.trazo ? (
                <svg
                  viewBox="0 0 24 24"
                  className="h-[18px] w-[18px] shrink-0"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d={opcion.trazo}
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
              <span className="truncate">{opcion.etiqueta}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
