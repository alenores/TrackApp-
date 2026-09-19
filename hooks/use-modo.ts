"use client";

import { useCallback, useEffect, useState } from "react";
import {
  aplicarModo,
  elOtroModo,
  guardarModo,
  leerModoGuardado,
  MODO_POR_DEFECTO,
  type Modo,
} from "@/lib/modo";

/**
 * El modo de color que está puesto, y cómo cambiarlo.
 *
 * El modo real ya lo dejó puesto el guión que corre antes de dibujar, así que
 * acá solo se lee para que el botón muestre el estado correcto.
 */
export function useModo(): { modo: Modo; cambiar: () => void } {
  const [modo, setModo] = useState<Modo>(MODO_POR_DEFECTO);

  useEffect(() => {
    setModo(leerModoGuardado());
  }, []);

  const cambiar = useCallback(() => {
    setModo((actual) => {
      const nuevo = elOtroModo(actual);
      aplicarModo(nuevo);
      guardarModo(nuevo);
      return nuevo;
    });
  }, []);

  return { modo, cambiar };
}
