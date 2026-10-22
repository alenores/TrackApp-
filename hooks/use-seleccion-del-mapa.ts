"use client";

import { useState } from "react";
import { useQuienSoy } from "@/components/armazon/quien-soy";
import { principalDelPerfil } from "@/lib/perfiles/actividades";
import { type SeleccionDelMapa } from "@/lib/caminos/seleccion-del-mapa";

/** Cada consulta empieza desde el perfil. La elección dentro del mapa es temporal. */
export function useSeleccionDelMapa(): [SeleccionDelMapa, (seleccion: SeleccionDelMapa) => void] {
  const { misActividades, miActividadPrincipal } = useQuienSoy();
  return useState<SeleccionDelMapa>(() => {
    const principal = principalDelPerfil(misActividades ?? [], miActividadPrincipal);
    return { visibles: principal ? [principal] : [], principal };
  });
}
