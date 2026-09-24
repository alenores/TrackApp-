"use client";

import { AreaDeTexto } from "@/components/ui/area-de-texto";
import { Boton } from "@/components/ui/boton";
import { SelectorDeFoto } from "@/components/fotos/selector-de-foto";
import type { FotoDeFormulario } from "@/hooks/use-foto";
import { COMO_SE_LLAMA } from "@/lib/anotaciones/iconos";
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
 * En la navegación va con `delCerro`: botones de 64 y letra de 18, que es lo
 * que pide esa pantalla.
 */

type Props = {
  tipo: "punto" | "trazo";
  icono: IconoPunto;
  alCambiarIcono: (icono: IconoPunto) => void;
  color: ColorDeTrazo;
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
  const claseDeOpcion = (elegida: boolean) =>
    [
      delCerro ? "min-h-16 px-4 text-lg" : "min-h-14 px-4 text-base",
      "rounded-xl border font-semibold transition-colors",
      elegida
        ? "border-acento-borde bg-acento text-acento-texto"
        : "border-borde bg-superficie-alta text-texto hover:border-borde-fuerte",
    ].join(" ");

  return (
    <div className="space-y-3">
      {tipo === "punto" ? (
        <div>
          <p className={`mb-1.5 text-texto-suave ${delCerro ? "text-lg" : "text-sm"}`}>Qué es</p>
          <div className="flex flex-wrap gap-2">
            {ICONOS_PUNTO.map((cual) => (
              <button
                key={cual}
                type="button"
                onClick={() => alCambiarIcono(cual)}
                aria-pressed={icono === cual}
                className={claseDeOpcion(icono === cual)}
              >
                {COMO_SE_LLAMA[cual]}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p className={`mb-1.5 text-texto-suave ${delCerro ? "text-lg" : "text-sm"}`}>De qué color</p>
          <div className="flex flex-wrap gap-2">
            {COLORES_DE_TRAZO.map((cual) => (
              <button
                key={cual}
                type="button"
                onClick={() => alCambiarColor(cual)}
                aria-pressed={color === cual}
                className={`flex items-center gap-2 ${claseDeOpcion(color === cual)}`}
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
        </div>
      )}

      <AreaDeTexto
        label="Qué hay que saber"
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
        etiqueta="Agregar una foto del lugar"
        deshabilitado={guardando}
        fotoActual={fotoActual}
      />

      {fotoActual && alQuitarFotoActual && foto.estado === "vacio" ? (
        <Boton
          variante="destructivo"
          anchoCompleto
          paraNavegacion={delCerro}
          disabled={guardando}
          onClick={alQuitarFotoActual}
        >
          Quitar la foto
        </Boton>
      ) : null}
    </div>
  );
}
