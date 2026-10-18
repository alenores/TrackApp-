"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useCerrarConAtras } from "@/hooks/use-cerrar-con-atras";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";
import { vibrarAlTocar } from "@/lib/vibracion";

/**
 * El aviso de que falta mapa, en los mapas del cerro.
 *
 * Antes era una pastilla siempre abierta que decía «Sin mapa descargado»,
 * aunque faltara solo un tramo. Decisión de Ale, 2026-10-18: un círculo ámbar
 * con «!», del mismo alto que Simple. El texto se ve al tocarlo y se cierra
 * al tocar afuera, con el atrás del celular o con Escape.
 */
export function AvisoDeMapaFaltante({ texto }: { texto: string }) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const id = useId();
  const cerrar = useCallback(() => setAbierto(false), []);
  useCerrarConAtras(abierto, cerrar);

  useEffect(() => {
    if (!abierto) return;
    const alTocarAfuera = (evento: PointerEvent) => {
      if (!caja.current?.contains(evento.target as Node)) cerrar();
    };
    document.addEventListener("pointerdown", alTocarAfuera, true);
    return () => document.removeEventListener("pointerdown", alTocarAfuera, true);
  }, [abierto, cerrar]);

  return (
    <div ref={caja} className="pointer-events-auto relative">
      <button
        type="button"
        aria-label="Ver el aviso del mapa"
        aria-expanded={abierto}
        aria-controls={id}
        onPointerDown={() => vibrarAlTocar()}
        onClick={() => setAbierto((antes) => !antes)}
        className={[
          CLASE_DE_RESPUESTA_AL_TOQUE,
          "flex h-7 w-7 items-center justify-center rounded-full border border-ambar-borde bg-ambar-fondo text-lg font-bold leading-none text-ambar-texto shadow-[var(--sombra-alta)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde",
        ].join(" ")}
      >
        !
      </button>
      {abierto ? (
        <p
          id={id}
          role="status"
          className="absolute left-0 top-full z-10 mt-1.5 w-72 max-w-[calc(100vw-1.5rem)] rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-2 text-lg leading-6 text-ambar-texto shadow-[var(--sombra-alta)]"
        >
          {texto}
        </p>
      ) : null}
    </div>
  );
}
