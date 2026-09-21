"use client";

import { useEffect } from "react";
import { trabarElTirarParaRecargar } from "@/lib/sin-recargar-al-tirar";
import { trabarElZoom } from "@/lib/sin-zoom";

/** Traba los gestos del navegador que acá no sirven: el zoom y el tirar para recargar. */
export function SinZoom() {
  useEffect(() => {
    const soltarElZoom = trabarElZoom();
    const soltarElTiron = trabarElTirarParaRecargar();
    return () => {
      soltarElZoom();
      soltarElTiron();
    };
  }, []);
  return null;
}
