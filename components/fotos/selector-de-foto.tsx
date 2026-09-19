"use client";

import { useRef, type ChangeEvent } from "react";
import { FORMATO_DE_FOTO } from "@/lib/fotos/preparar";
import { vibrarAlTocar } from "@/lib/vibracion";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";
import { Boton } from "@/components/ui/boton";
import { RecorteDeFoto } from "@/components/fotos/recorte-de-foto";
import type { FotoDeFormulario } from "@/hooks/use-foto";

/**
 * La caja de «elegí una foto». **Es la única de la app.**
 *
 * Dibuja el estado del hook y nada más: vacía, abriendo, preparando, lista —con
 * la vista previa de lo que se va a subir y los botones de recortar, cambiar y
 * quitar— o con error, **con el motivo, acá mismo**. También abre la pantalla
 * de recorte cuando toca.
 *
 *     const foto = useFoto("avatar", FORMAS_DE_RECORTE.avatar);
 *     <SelectorDeFoto foto={foto} />
 *     …
 *     <Boton disabled={!foto.archivo}>Guardar</Boton>
 *
 * Al editar algo que ya tiene foto, `fotoActual` la muestra hasta que se elija
 * otra.
 *
 * **La galería del celular acepta cualquier formato.** Lo que la app sube es
 * siempre WebP, porque la conversión pasa antes de salir del teléfono: el
 * usuario elige la foto como la tiene y no se entera de nada.
 */

type Props = {
  foto: FotoDeFormulario;
  /** El formulario está guardando: no se toca nada. */
  deshabilitado?: boolean;
  etiqueta?: string;
  /** Una foto que ya existe, al editar. Se muestra mientras el hook esté vacío. */
  fotoActual?: string | null;
  /** «circulo» para la foto de perfil. */
  vistaPreviaRedonda?: boolean;
};

export function SelectorDeFoto({
  foto,
  deshabilitado = false,
  etiqueta = "Elegir una foto",
  fotoActual = null,
  vistaPreviaRedonda = false,
}: Props) {
  const entradaRef = useRef<HTMLInputElement>(null);

  const ocupada = foto.estado === "abriendo" || foto.estado === "preparando";
  const trabado = deshabilitado || ocupada;

  // Lo que se ve: la foto lista del hook o, si está vacío, la que ya existía.
  const queSeVe =
    foto.estado === "lista"
      ? foto.vistaPrevia
      : foto.estado === "vacio"
        ? fotoActual
        : null;

  const alElegirArchivo = (evento: ChangeEvent<HTMLInputElement>) => {
    const elegido = evento.target.files?.[0];
    // Se limpia para que elegir la misma foto otra vez también cuente.
    evento.target.value = "";
    if (elegido) foto.elegir(elegido);
  };

  return (
    <div className="space-y-3">
      <input
        ref={entradaRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={alElegirArchivo}
      />

      {queSeVe ? (
        <div className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={queSeVe}
            alt="La foto que se va a subir"
            className={[
              "border border-borde-fuerte bg-fondo object-cover",
              vistaPreviaRedonda
                ? "h-40 w-40 rounded-full"
                : "max-h-64 w-full rounded-xl",
            ].join(" ")}
          />

          <div className="flex w-full gap-2">
            <Boton
              variante="secundario"
              className="flex-1 px-3 text-sm"
              disabled={trabado || !foto.abierta}
              onClick={foto.recortarDeNuevo}
            >
              Recortar
            </Boton>
            <Boton
              variante="secundario"
              className="flex-1 px-3 text-sm"
              disabled={trabado}
              onClick={() => entradaRef.current?.click()}
            >
              Cambiar
            </Boton>
            <Boton
              variante="destructivo"
              className="flex-1 px-3 text-sm"
              disabled={trabado}
              onClick={foto.quitar}
            >
              Quitar
            </Boton>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={trabado}
          onPointerDown={() => vibrarAlTocar()}
          onClick={() => entradaRef.current?.click()}
          className={[
            CLASE_DE_RESPUESTA_AL_TOQUE,
            "flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-xl",
            "border border-dashed border-borde-fuerte bg-fondo px-4 py-6",
            "text-base font-medium text-texto",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde",
            "disabled:opacity-50",
          ].join(" ")}
        >
          {ocupada ? (
            <>
              <span>
                {foto.estado === "abriendo"
                  ? (foto.progreso ?? "Abriendo la foto…")
                  : "Preparando la foto…"}
              </span>
              <span className="text-sm text-texto-suave">
                No cierres la pantalla.
              </span>
            </>
          ) : (
            <>
              <svg
                viewBox="0 0 24 24"
                className="h-8 w-8 text-acento-tenue"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="3" y="6" width="18" height="14" rx="2.5" />
                <circle cx="12" cy="13" r="3.5" />
                <path d="M8.5 6 10 3.5h4L15.5 6" />
              </svg>
              <span>{etiqueta}</span>
              <span className="text-sm text-texto-suave">
                Sacala de la galería como la tengas: la app la deja lista.
              </span>
            </>
          )}
        </button>
      )}

      {foto.estado === "error" && foto.error ? (
        <div className="rounded-xl border border-rojo-borde bg-rojo-fondo px-3 py-3">
          <p role="alert" className="text-sm leading-6 text-rojo-texto">
            {foto.error}
          </p>
        </div>
      ) : null}

      <RecorteDeFoto
        abierto={foto.estado === "recortando" || foto.estado === "preparando"}
        foto={foto.abierta}
        forma={foto.forma}
        ocupado={foto.estado === "preparando"}
        alCancelar={foto.cancelarRecorte}
        alConfirmar={foto.confirmarRecorte}
      />
    </div>
  );
}

/** Lo que la app sube siempre, para que nadie lo escriba a mano en otro lado. */
export { FORMATO_DE_FOTO };
