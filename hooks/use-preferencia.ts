"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * Una elección de la persona que se recuerda en este celular, como qué capas
 * mirar en Consultas o qué marcas tildó.
 *
 * Es una comodidad, no un dato: si el navegador no deja guardar, la pantalla
 * anda igual con lo de siempre.
 */

const EVENTO = "preferencia-cambiada";

/** Por si el navegador no deja guardar: la elección dura mientras la app está abierta. */
const memoria = new Map<string, string>();

function suscribir(avisar: () => void): () => void {
  window.addEventListener("storage", avisar);
  window.addEventListener(EVENTO, avisar);
  return () => {
    window.removeEventListener("storage", avisar);
    window.removeEventListener(EVENTO, avisar);
  };
}

function leerTexto(clave: string): string | null {
  try {
    return memoria.get(clave) ?? localStorage.getItem(clave);
  } catch {
    return memoria.get(clave) ?? null;
  }
}

/**
 * `leer` convierte lo guardado en el valor, o devuelve `null` si no sirve;
 * en ese caso vale `inicial`.
 */
export function usePreferencia<T>(
  clave: string,
  inicial: T,
  leer: (guardado: unknown) => T | null,
): [T, (nuevo: T) => void] {
  const texto = useSyncExternalStore(suscribir, () => leerTexto(clave), () => null);

  const valor = useMemo(() => {
    if (texto === null) return inicial;
    try {
      return leer(JSON.parse(texto)) ?? inicial;
    } catch {
      return inicial;
    }
    // `inicial` y `leer` son fijos para cada pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  const guardar = useCallback((nuevo: T) => {
    const texto = JSON.stringify(nuevo);
    memoria.set(clave, texto);
    try {
      localStorage.setItem(clave, texto);
    } catch { /* Queda en memoria mientras la app está abierta. */ }
    window.dispatchEvent(new Event(EVENTO));
  }, [clave]);

  return [valor, guardar];
}
