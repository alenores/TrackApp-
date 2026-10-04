"use client";

import { useRef } from "react";
import { Boton } from "@/components/ui/boton";
import { useDialogos } from "@/components/ui/dialogos";
import type { useVariasFotos } from "@/hooks/use-varias-fotos";

/**
 * Las fotos elegidas de a varias, en una grilla de miniaturas. **Es la pieza
 * de la app para elegir muchas fotos juntas**; va de la mano de `useVariasFotos`.
 *
 * Tocar una miniatura la quita, con confirmación. El botón de sumar abre la
 * galería con selección múltiple.
 */

type Props = {
  varias: ReturnType<typeof useVariasFotos>;
  /** Cuántas entran todavía. */
  lugarLibre: number;
  deshabilitado?: boolean;
};

export function GrillaDeFotos({ varias, lugarLibre, deshabilitado = false }: Props) {
  const entrada = useRef<HTMLInputElement>(null);
  const { confirmar } = useDialogos();
  const ocupada = varias.procesando !== null;

  const alQuitar = async (clave: string, numero: number) => {
    const seguro = await confirmar({
      titulo: "¿Quitar esta foto?",
      mensaje: `La foto ${numero} deja de ser parte de la salida al guardar.`,
      textoDeAceptar: "Quitar la foto",
      destructivo: true,
    });
    if (seguro) varias.quitar(clave);
  };

  return (
    <div className="space-y-3">
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(evento) => {
          const elegidas = Array.from(evento.target.files ?? []);
          // Se limpia para que elegir las mismas otra vez también cuente.
          evento.target.value = "";
          if (elegidas.length > 0) void varias.elegir(elegidas, lugarLibre);
        }}
      />

      {varias.fotos.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {varias.fotos.map((foto, indice) => (
            <li key={foto.clave}>
              <button
                type="button"
                disabled={deshabilitado || ocupada}
                onClick={() => void alQuitar(foto.clave, indice + 2)}
                aria-label={`Quitar la foto ${indice + 2}`}
                className="relative block w-full overflow-hidden rounded-xl border border-borde-suave focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde disabled:opacity-60"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- es la vista previa de lo que se va a subir. */}
                <img
                  src={foto.clase === "nueva" ? foto.vistaPrevia : foto.url}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
                <span
                  aria-hidden
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-superficie text-sm leading-none text-texto shadow-[var(--sombra)]"
                >
                  ×
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {varias.procesando ? (
        <p role="status" className="text-base text-texto">
          Preparando las fotos: {varias.procesando.hechas} de {varias.procesando.total}… No cierres la pantalla.
        </p>
      ) : null}

      {varias.problemas.length > 0 ? (
        <div role="alert" className="space-y-1 rounded-xl border border-rojo-borde bg-rojo-fondo px-3 py-3">
          {varias.problemas.map((problema) => (
            <p key={problema} className="text-sm leading-6 text-rojo-texto">
              {problema}
            </p>
          ))}
        </div>
      ) : null}

      {lugarLibre > 0 ? (
        <Boton
          variante="secundario"
          anchoCompleto
          disabled={deshabilitado || ocupada}
          onClick={() => entrada.current?.click()}
        >
          {ocupada ? "Preparando…" : varias.fotos.length === 0 ? "Sumar fotos" : "Sumar más fotos"}
        </Boton>
      ) : (
        <p className="text-sm text-texto-suave">Llegaste al tope de fotos de una salida.</p>
      )}
    </div>
  );
}
