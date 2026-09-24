"use client";

import { useSyncExternalStore } from "react";
import { mirarElPaquete, paqueteEnMemoria, type Paquete } from "@/lib/offline/paquete";

/**
 * El paquete que ya está en el celular, **sin salir a internet**.
 *
 * Es lo único que puede usar la pantalla de navegación: lee lo guardado y se
 * entera si cambia, pero nunca dispara la puesta al día. Las demás pantallas
 * usan `useDatosDeLaApp`, que además se pone al día cuando hay señal.
 */
export function usePaqueteGuardado(): Paquete | null {
  return useSyncExternalStore(mirarElPaquete, paqueteEnMemoria, () => null);
}
