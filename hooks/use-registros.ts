"use client";

import { useSyncExternalStore } from "react";
import {
  mirarLosRegistros,
  registrosDelServidor,
  registrosEnMemoria,
  type Registro,
} from "@/lib/salidas/registro";

/**
 * Las salidas registradas navegando que están en el celular: la que está en
 * curso y las terminadas que esperan para subirse. Estado vivo, leído del
 * celular: no sale a internet.
 */
export function useRegistros(): Registro[] {
  return useSyncExternalStore(mirarLosRegistros, registrosEnMemoria, registrosDelServidor);
}
