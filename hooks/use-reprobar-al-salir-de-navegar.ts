"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { esLaPantallaDeNavegar } from "@/lib/actualizacion/version-nueva";
import { reprobarAlSalirDeLaNavegacion } from "@/lib/conexion";

/**
 * Cuando se cierra el mapa del cerro, vuelve a preguntar si hay señal.
 *
 * Mientras se navega esa pregunta no se hace. Si no se retoma al salir, la
 * casa queda mostrando «sin señal» aunque el teléfono tenga internet.
 */
export function useReprobarAlSalirDeLaNavegacion(): void {
  const pathname = usePathname();
  const anterior = useRef(pathname);

  useEffect(() => {
    const veniaDeNavegar = esLaPantallaDeNavegar(anterior.current);
    anterior.current = pathname;
    if (veniaDeNavegar && !esLaPantallaDeNavegar(pathname)) {
      void reprobarAlSalirDeLaNavegacion();
    }
  }, [pathname]);
}
