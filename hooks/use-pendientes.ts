"use client";

import { useSyncExternalStore } from "react";
import {
  mirarLosPendientes,
  pendientesDelServidor,
  pendientesEnMemoria,
  type Pendiente,
} from "@/lib/anotaciones/pendientes";

/**
 * Lo que se marcó sin señal y espera para subirse, como estado vivo.
 *
 * Se lee del celular: no sale a internet. Sirve igual en la navegación y en el
 * inicio.
 */
export function usePendientes(): Pendiente[] {
  return useSyncExternalStore(mirarLosPendientes, pendientesEnMemoria, pendientesDelServidor);
}
