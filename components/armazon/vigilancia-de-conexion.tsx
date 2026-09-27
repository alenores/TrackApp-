"use client";

import { useEffect } from "react";
import { iniciarVigilanciaDeConexion } from "@/lib/conexion";

/**
 * Arranca la vigilancia de la señal apenas abre la app, en cualquier pantalla.
 * No dibuja nada. Ver `lib/conexion.ts`.
 */
export function VigilanciaDeConexion() {
  useEffect(() => {
    iniciarVigilanciaDeConexion();
  }, []);

  return null;
}
