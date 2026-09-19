"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  cambiarModo,
  elOtroModo,
  mirarElModo,
  MODO_POR_DEFECTO,
  modoPuesto,
  type Modo,
} from "@/lib/modo";

/**
 * El modo de color que está puesto, y cómo cambiarlo.
 *
 * El modo de verdad lo manda el atributo del documento, que el guión de
 * arranque ya dejó puesto antes de que se dibujara nada. Acá solo se lee, así
 * que el botón muestra siempre el estado real y nunca hay un parpadeo.
 */
export function useModo(): { modo: Modo; cambiar: () => void } {
  const modo = useSyncExternalStore(
    mirarElModo,
    modoPuesto,
    () => MODO_POR_DEFECTO,
  );

  const cambiar = useCallback(() => {
    cambiarModo(elOtroModo(modoPuesto()));
  }, []);

  return { modo, cambiar };
}
