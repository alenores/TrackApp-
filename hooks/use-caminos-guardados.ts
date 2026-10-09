"use client";

import { useEffect, useState } from "react";
import type { CaminoGuardado, CaminoSinLinea } from "@/lib/caminos/datos";
import { leerLineaDeCamino } from "@/lib/offline/lineas-de-caminos";

type Estado = { caminos: CaminoGuardado[]; error: string | null; cargando: boolean };

/** La navegación solo lee el paquete y su depósito local; nunca consulta la red. */
export function useCaminosGuardados(caminosSinLinea: CaminoSinLinea[]): Estado {
  const [estado, setEstado] = useState<Estado>({ caminos: [], error: null, cargando: true });

  useEffect(() => {
    let vigente = true;
    Promise.all(caminosSinLinea.map(async (camino) => ({ camino, linea: await leerLineaDeCamino(camino) })))
      .then((leidos) => {
        if (!vigente) return;
        const faltantes = leidos.filter(({ linea }) => linea === null).map(({ camino }) => camino.nombre);
        setEstado({
          caminos: leidos.flatMap(({ camino, linea }) => linea ? [{ ...camino, coordenadas: linea.coordenadas, alturas: linea.alturas }] : []),
          error: faltantes.length > 0
            ? `Falta la línea guardada de ${faltantes.join(", ")}. Abrí la app con conexión en casa para volver a descargarla.`
            : null,
          cargando: false,
        });
      })
      .catch((causa) => {
        if (!vigente) return;
        setEstado({ caminos: [], cargando: false, error: `No se pudieron leer los Caminos guardados: ${causa instanceof Error ? causa.message : String(causa)}. Abrí la app con conexión en casa para descargarlos de nuevo.` });
      });
    return () => { vigente = false; };
  }, [caminosSinLinea]);

  return estado;
}
