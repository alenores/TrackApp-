"use client";

import { useSyncExternalStore } from "react";

/**
 * Leer algo que solo existe en el navegador, sin romper el dibujado.
 *
 * El servidor arma la primera versión de la pantalla y ahí no hay `navigator`
 * ni `localStorage`. Esto devuelve el valor de respaldo mientras se arma, y el
 * de verdad apenas la pantalla está viva en el celular.
 *
 * `leer` tiene que devolver siempre lo mismo mientras nada cambió: si devuelve
 * un objeto nuevo cada vez, la pantalla se redibuja sin parar.
 */
function noCambiaNunca(): () => void {
  return () => {};
}

export function useDelNavegador<T>(leer: () => T, enElServidor: T): T {
  return useSyncExternalStore(noCambiaNunca, leer, () => enElServidor);
}

/** `true` apenas la pantalla está viva en el navegador. */
export function useYaEnElNavegador(): boolean {
  return useDelNavegador(() => true, false);
}
