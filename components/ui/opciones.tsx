"use client";

import { vibrarAlTocar } from "@/lib/vibracion";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";

/**
 * Elegir entre varias opciones, tocando.
 *
 * **Reemplaza al `<select>` del sistema**, que además de ser una pantalla del
 * sistema operativo abre una lista con renglones de veinte píxeles: imposible
 * de acertar. Acá cada opción es un botón de tamaño normal, se ven todas
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
  /**
   * `campo` es el rótulo de un dato dentro de una tarjeta. `seccion` es el
   * título en mayúsculas de un bloque, cuando las opciones van sueltas.
   */
  titulo?: "campo" | "seccion";
};

/** El título en mayúsculas de un bloque de un formulario o de un filtro. */
export const CLASE_DE_TITULO_DE_SECCION =
  "text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave";

const CLASES_DE_TITULO = {
  campo: "mb-1.5 p-0 text-sm font-medium text-texto-suave",
  seccion: `mb-2 p-0 ${CLASE_DE_TITULO_DE_SECCION}`,
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
  titulo = "campo",
}: OpcionesProps<T>) {
  return (
    <fieldset className="border-0 p-0">
      <legend className={CLASES_DE_TITULO[titulo]}>
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
                "flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-2 text-sm font-semibold transition-colors",
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
