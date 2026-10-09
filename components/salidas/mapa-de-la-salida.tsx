"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useCerrarConAtras } from "@/hooks/use-cerrar-con-atras";
import { useYaEnElNavegador } from "@/hooks/use-del-navegador";
import { NIVEL_DEL_MAPA_EN_GRANDE } from "@/lib/capas";
import { traerLaLineaCompleta, type LineaCompleta } from "@/lib/salidas/archivo";
import { dibujarLinea, lineaComoColeccion, rectanguloDeLaLinea } from "@/lib/salidas/linea";
import type { Salida } from "@/types/database";

/**
 * La línea de la salida en un mapa de verdad, tapando la ficha entera.
 *
 * **Salidas es solo con internet**: el fondo del mapa y el archivo GPS se
 * piden en vivo. Mientras llega el archivo completo se ve la línea liviana, así
 * nunca hay un mapa vacío; si no llega, se dice por qué y se queda la liviana.
 *
 * Cierra con la cruz y con el botón físico de atrás.
 */

/** El cuadradito con la línea dibujada. Tocándolo se abre el mapa. */
export function MiniaturaDeLaLinea({ salida, alTocar }: { salida: Salida; alTocar: () => void }) {
  const dibujo = salida.linea
    ? dibujarLinea(salida.linea, { x: 10, y: 10, ancho: 76, alto: 76 })
    : null;

  return (
    <button
      type="button"
      onClick={alTocar}
      aria-label="Ver el recorrido en el mapa"
      title="Ver el recorrido en el mapa"
      className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-borde-fuerte bg-sobre-foto-fondo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde"
    >
      {dibujo ? (
        <svg viewBox="0 0 96 96" aria-hidden className="absolute inset-0 h-full w-full">
          <path
            d={dibujo.trazo}
            fill="none"
            className="stroke-sobre-foto-linea"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={dibujo.inicio[0]} cy={dibujo.inicio[1]} r={3} className="fill-sobre-foto-texto" />
          <circle cx={dibujo.fin[0]} cy={dibujo.fin[1]} r={3} className="fill-sobre-foto-linea" />
        </svg>
      ) : (
        <span className="absolute inset-0 flex items-center justify-center px-2 text-center text-xs font-medium text-sobre-foto-texto">
          Ver en el mapa
        </span>
      )}
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="absolute bottom-1.5 right-1.5 h-4 w-4 text-sobre-foto-texto-suave"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      >
        <path d="M9 4H4v5M15 4h5v5M15 20h5v-5M9 20H4v-5" />
      </svg>
    </button>
  );
}

export function MapaDeLaSalida({
  salida,
  abierto,
  alCerrar,
}: {
  salida: Salida;
  abierto: boolean;
  alCerrar: () => void;
}) {
  const yaEstaVivo = useYaEnElNavegador();
  const [completa, setCompleta] = useState<LineaCompleta | null>(null);

  useCerrarConAtras(abierto, alCerrar);

  // El archivo completo se pide una sola vez, la primera que se abre el mapa.
  useEffect(() => {
    if (!abierto || completa || !salida.archivoUrl) return;
    let vigente = true;
    void traerLaLineaCompleta(salida.archivoUrl).then((resultado) => {
      if (vigente) setCompleta(resultado);
    });
    return () => {
      vigente = false;
    };
  }, [abierto, completa, salida.archivoUrl]);

  useEffect(() => {
    if (!abierto) return;
    const desbordeAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = desbordeAnterior;
    };
  }, [abierto]);

  if (!abierto || !yaEstaVivo) return null;

  const liviana = salida.linea;
  const recorrido = completa?.ok
    ? completa.geometria
    : liviana
      ? lineaComoColeccion(liviana)
      : null;
  const encuadre = completa?.ok ? completa.rectangulo : liviana ? rectanguloDeLaLinea(liviana) : null;
  const trayendo = salida.archivoUrl !== null && completa === null;
  const fallo = completa && !completa.ok ? completa.motivo : null;

  return createPortal(
    <div
      className="fixed inset-0 flex h-dvh w-screen flex-col bg-mapa-fondo"
      style={{ zIndex: NIVEL_DEL_MAPA_EN_GRANDE }}
      role="dialog"
      aria-modal="true"
      aria-label={`El recorrido de «${salida.titulo}»`}
    >
      {recorrido ? (
        <CargadorDeMapa
          recorrido={recorrido}
          encuadre={encuadre}
          enVivo
          consultaGoogle
          pantallaCompleta
          alCerrarPantallaCompleta={alCerrar}
          className="h-full"
        />
      ) : (
        <div className="flex flex-1 items-center justify-center p-4">
          <Tarjeta franja={fallo ? "rojo" : undefined} className="max-w-md space-y-3">
            <p role={fallo ? "alert" : "status"} className="text-base leading-6 text-texto">
              {fallo
                ? `No se puede mostrar el recorrido: ${fallo}.`
                : trayendo
                  ? "Trayendo el recorrido…"
                  : "Esta salida no tiene archivo GPS, así que no hay recorrido para mostrar."}
            </p>
            <Boton variante="secundario" onClick={alCerrar}>
              Cerrar
            </Boton>
          </Tarjeta>
        </div>
      )}

      {recorrido && (trayendo || fallo) ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-center">
          <Tarjeta franja={fallo ? "ambar" : undefined} className="pointer-events-auto max-w-md">
            <p role={fallo ? "alert" : "status"} className="text-sm leading-6 text-texto">
              {fallo
                ? `Se ve una versión simplificada del recorrido: ${fallo}.`
                : "Trayendo el archivo completo para ver cada curva…"}
            </p>
          </Tarjeta>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
