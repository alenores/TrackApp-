"use client";

import { useCallback, useMemo, useState } from "react";
import { useCaminosGuardados } from "@/hooks/use-caminos-guardados";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { rectangulosDeLineas, type VistaDeLineas } from "@/lib/mapas/lineas-del-territorio";
import type { ClaseAlMarcar } from "@/lib/marcas/buscar-al-marcar";
import type { Rectangulo } from "@/types/database";

/**
 * Líneas y viaje del mapa mientras se marca algo nuevo.
 *
 * Abre sin líneas. Elegir una zona las prende, si estaban apagadas; elegir un
 * sector prende también las de los sectores, para que se vea a dónde se fue.
 */
export function useAlMarcar() {
  const { paquete } = useDatosDeLaApp();
  const zonas = useMemo(() => paquete?.zonas ?? [], [paquete]);
  const sectores = useMemo(() => paquete?.sectores ?? [], [paquete]);
  const caminosSinLinea = useMemo(() => paquete?.caminos ?? [], [paquete]);
  const anotaciones = useMemo(() => paquete?.anotaciones ?? [], [paquete]);
  const { caminos, cargando } = useCaminosGuardados(caminosSinLinea);
  const [lineas, setLineas] = useState<VistaDeLineas>("nada");
  const [vista, setVista] = useState<Rectangulo | null>(null);
  const [viaje, setViaje] = useState(0);

  const rectangulos = useMemo(
    () => rectangulosDeLineas(zonas, sectores, lineas),
    [zonas, sectores, lineas],
  );

  const ir = useCallback((encuadre: Rectangulo, clase: ClaseAlMarcar | null) => {
    setVista(encuadre);
    setViaje((actual) => actual + 1);
    if (clase === "sector") setLineas("zonas_y_sectores");
    else if (clase === "zona") setLineas((actual) => actual === "nada" ? "zonas" : actual);
  }, []);

  /** Un salto, sin viaje: la coordenada escrita manda sobre la búsqueda. */
  const mostrar = useCallback((encuadre: Rectangulo) => {
    setVista(encuadre);
  }, []);

  return {
    zonas,
    sectores,
    caminosSinLinea,
    caminos,
    anotaciones,
    cargandoCaminos: cargando,
    lineas,
    setLineas,
    rectangulos,
    vista,
    viaje,
    ir,
    mostrar,
  };
}
