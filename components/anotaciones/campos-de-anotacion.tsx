"use client";

import { AreaDeTexto } from "@/components/ui/area-de-texto";
import { Tarjeta } from "@/components/ui/tarjeta";
import { SelectorDeFoto } from "@/components/fotos/selector-de-foto";
import type { FotoDeFormulario } from "@/hooks/use-foto";
import { COMO_SE_LLAMA } from "@/lib/anotaciones/iconos";
import { TRAZOS_DEL_ICONO } from "@/components/anotaciones/icono-de-anotacion";
import {
  COLORES_DE_TRAZO,
  type ColorDeTrazo,
  TRAZO,
} from "@/lib/anotaciones/colores-de-trazo";
import { ICONOS_PUNTO, type IconoPunto } from "@/types/database";

/**
 * Lo que se completa de una anotación: qué es, qué hay que saber y la foto.
 *
 * **Es la misma pieza en la pantalla del sector y en la navegación.** Una sola
 * forma de elegir el ícono, el color, escribir el comentario y sumar la foto:
 * cambiar una regla de cómo se anota se cambia acá y vale para las dos.
 *
 * En la navegación va con `delCerro`: letra de 18, que es lo que pide esa
 * pantalla. Los botones tienen el tamaño normal (decisión 024).
 */

type Props = {
  tipo: "punto" | "trazo";
  icono: IconoPunto | null;
  alCambiarIcono: (icono: IconoPunto) => void;
  color: ColorDeTrazo | null;
  alCambiarColor: (color: ColorDeTrazo) => void;
  comentario: string;
  alCambiarComentario: (comentario: string) => void;
  foto: FotoDeFormulario;
  /** La foto que ya tiene, al editar. */
  fotoActual: string | null;
  /** Para sacar la foto que ya tenía. Sin esto no aparece el botón. */
  alQuitarFotoActual?: () => void;
  guardando: boolean;
  delCerro?: boolean;
};

export function CamposDeAnotacion({
  tipo,
  icono,
  alCambiarIcono,
  color,
  alCambiarColor,
  comentario,
  alCambiarComentario,
  foto,
  fotoActual,
  alQuitarFotoActual,
  guardando,
  delCerro = false,
}: Props) {
  const claseDeTipo = (elegida: boolean) =>
    [
      "min-h-10 px-4 text-sm",
      "rounded-xl border font-semibold transition-colors",
      elegida
        ? "border-acento-borde bg-acento text-acento-texto"
        : "border-borde bg-superficie-alta text-texto hover:border-borde-fuerte",
    ].join(" ");

  // El fondo se despega de la tarjeta. El elegido va un tono más oscuro, sin el verde de los botones.
  const claseDeColor = (elegida: boolean) =>
    [
      "min-h-10 px-4 text-sm",
      "rounded-xl border font-semibold transition-colors",
      elegida
        ? "border-borde-fuerte bg-[var(--panel-cabeza)] text-texto"
        : "border-borde bg-superficie-alta text-texto hover:border-borde-fuerte",
    ].join(" ");

  const claseDeTitulo = `text-texto-suave ${delCerro ? "text-lg" : "text-sm"}`;

  return (
    <div className="space-y-3">
      {tipo === "punto" ? (
        <Tarjeta className="space-y-2">
          <p className={claseDeTitulo}>Qué es</p>
          <div className="flex flex-wrap gap-2">
            {ICONOS_PUNTO.map((cual) => (
              <button
                key={cual}
                type="button"
                onClick={() => alCambiarIcono(cual)}
                aria-pressed={icono === cual}
                className={`inline-flex items-center gap-2 ${claseDeTipo(icono === cual)}`}
              >
                {/* El mismo dibujo que tiene en las listas de Marcas. */}
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" aria-hidden>
                  <path d={TRAZOS_DEL_ICONO[cual]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {COMO_SE_LLAMA[cual]}
              </button>
            ))}
          </div>
        </Tarjeta>
      ) : (
        <Tarjeta className="space-y-2">
          <p className={claseDeTitulo}>COLOR:</p>
          <div className="flex flex-wrap gap-2">
            {COLORES_DE_TRAZO.map((cual) => (
              <button
                key={cual}
                type="button"
                onClick={() => alCambiarColor(cual)}
                aria-pressed={color === cual}
                className={`flex items-center gap-2 ${claseDeColor(color === cual)}`}
              >
                <span
                  aria-hidden
                  className="h-3 w-6 rounded-full"
                  // El color del trazo es un dato de la anotación, no del tema.
                  style={{ backgroundColor: TRAZO[cual].color }}
                />
                {TRAZO[cual].nombre}
              </button>
            ))}
          </div>
        </Tarjeta>
      )}

      <AreaDeTexto
        label="Descripción"
        id="comentario-de-la-anotacion"
        rows={3}
        value={comentario}
        onChange={(evento) => alCambiarComentario(evento.target.value)}
        className={delCerro ? "text-lg" : undefined}
        placeholder={
          tipo === "punto"
            ? "Por acá se cruza el arroyo. Por la izquierda no se puede."
            : "Huella que no figura en el mapa. Sigue el alambrado hasta la tranquera."
        }
      />

      <SelectorDeFoto
        foto={foto}
        deshabilitado={guardando}
        fotoActual={fotoActual}
        alQuitarFotoActual={alQuitarFotoActual}
      />
    </div>
  );
}
