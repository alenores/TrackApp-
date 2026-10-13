"use client";

import { useSyncExternalStore } from "react";

/** Desde este ancho la app usa la barra lateral de la computadora en vez de la barra de abajo. */
const CONSULTA = "(min-width: 1024px)";

function suscribir(avisar: () => void): () => void {
  const consulta = window.matchMedia(CONSULTA);
  consulta.addEventListener("change", avisar);
  return () => consulta.removeEventListener("change", avisar);
}

/**
 * `true` en la computadora: el mismo corte que separa la barra lateral de la
 * barra de abajo. Mientras se arma en el servidor, celular.
 */
export function usePantallaAncha(): boolean {
  return useSyncExternalStore(suscribir, () => window.matchMedia(CONSULTA).matches, () => false);
}
