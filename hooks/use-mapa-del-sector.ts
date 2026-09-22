"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  bajarElMapaDelSector,
  borrarElMapaDelSector,
} from "@/lib/mapas/descarga";
import { fuenteDelServidor } from "@/lib/mapas/fuente-del-servidor";
import {
  mapasBajados,
  mirarLosMapas,
  anotarMapaBajado,
  type MapaDeSector,
  type TipoDeMapa,
} from "@/lib/offline/mapas";
import { bajarLasFotosDeLasAnotaciones } from "@/lib/anotaciones/descarga";
import type { Anotacion, Sector } from "@/types/database";

/**
 * El mapa de un sector, visto desde una pantalla.
 *
 * Junta las dos mitades: **qué hay bajado** —que se lee al instante de lo
 * anotado en el celular— y **la descarga en curso**, con su avance, su
 * cancelación y su motivo de falla.
 *
 * Ninguna pantalla habla con el depósito ni con el servidor: le piden a esto.
 */

export type PasoDeLaDescarga =
  | { paso: "quieto" }
  | { paso: "bajando"; resueltos: number; total: number }
  | { paso: "fallo"; motivo: string; resueltos: number; total: number };

const SIN_MAPAS: MapaDeSector[] = [];

/** Lo anotado en el celular, al instante y al día. */
export function useMapasBajados(): MapaDeSector[] {
  return useSyncExternalStore(mirarLosMapas, mapasBajados, () => SIN_MAPAS);
}

/**
 * Qué sectores tienen mapa, para las pantallas que solo necesitan saber eso.
 *
 * Va por acá y no por la función suelta para que la pantalla **se vuelva a
 * dibujar sola** cuando el usuario baja o saca un mapa. Leyéndolo por afuera,
 * la ruta seguiría diciendo «te falta un mapa» con el mapa ya bajado.
 */
export function useSectoresConMapaBajado(): Set<number> {
  const bajados = useMapasBajados();
  // El mismo conjunto mientras no cambien los mapas: uno nuevo en cada dibujado
  // haría que los efectos que dependen de él se repitieran para siempre.
  return useMemo(() => new Set(bajados.map((cada) => cada.sectorId)), [bajados]);
}

export function useMapaDelSector(sector: Sector, anotaciones: Anotacion[]) {
  const bajados = useMapasBajados();
  const mapa = bajados.find((cada) => cada.sectorId === sector.id) ?? null;

  const [paso, setPaso] = useState<PasoDeLaDescarga>({ paso: "quieto" });
  /**
   * Qué pasó con las fotos de las anotaciones, cuando algo pasó.
   *
   * Va aparte del paso porque el mapa sí entró: el sector queda bajado y se
   * puede salir. Lo que no entró son las fotos, y eso **se dice igual**.
   */
  const [fallaDeFotos, setFallaDeFotos] = useState<string | null>(null);
  const canceladorRef = useRef<AbortController | null>(null);
  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
      // Si la pantalla se cierra a mitad de una descarga, se corta: seguir
      // pidiendo pedazos para una pantalla que ya no está gasta datos de gusto.
      canceladorRef.current?.abort();
    };
  }, []);

  const bajar = useCallback(
    async (tipo: TipoDeMapa) => {
      canceladorRef.current?.abort();
      const cancelador = new AbortController();
      canceladorRef.current = cancelador;

      setPaso({ paso: "bajando", resueltos: 0, total: 0 });
      setFallaDeFotos(null);

      const resultado = await bajarElMapaDelSector({
        sector,
        tipo,
        fuente: fuenteDelServidor(),
        anotaciones,
        senal: cancelador.signal,
        avisarAvance: ({ resueltos, total }) => {
          if (montadoRef.current) setPaso({ paso: "bajando", resueltos, total });
        },
      });

      if (!montadoRef.current) return;

      if (resultado.estado === "incompleta") {
        setPaso({
          paso: "fallo",
          motivo: resultado.motivo,
          resueltos: resultado.resueltos,
          total: resultado.total,
        });
        return;
      }

      if (resultado.estado === "listo" && resultado.fotos.motivo) {
        setFallaDeFotos(
          `Quedaron ${resultado.fotos.total - resultado.fotos.bajadas} de ${
            resultado.fotos.total
          } fotos sin bajar: ${resultado.fotos.motivo} Probá de nuevo con mejor señal.`,
        );
      }

      setPaso({ paso: "quieto" });
    },
    [sector, anotaciones],
  );

  const cancelar = useCallback(() => {
    canceladorRef.current?.abort();
    setPaso({ paso: "quieto" });
  }, []);

  /**
   * Sacar el mapa del celular.
   *
   * Recibe todos los sectores porque borrar es al revés de lo que parece: se
   * dice qué pedazos siguen haciendo falta y se va el resto. Sin esa lista, se
   * llevaría puesto el mapa del sector de al lado.
   */
  const sacar = useCallback(
    async (todosLosSectores: Sector[]) => {
      const resultado = await borrarElMapaDelSector(sector.id, todosLosSectores);
      return resultado;
    },
    [sector],
  );

  const bajarFotosSolo = useCallback(async () => {
    if (!mapa) return;
    const cancelador = new AbortController();
    
    const fotos = await bajarLasFotosDeLasAnotaciones({
      anotaciones: anotaciones.filter((cada) => cada.sectorId === sector.id),
      senal: cancelador.signal,
    });

    if (fotos.motivo) {
      return; // Falló silenciosamente, se reintentará luego
    }

    const fotosGuardadas = Array.from(new Set([...mapa.fotos, ...fotos.direcciones]));

    anotarMapaBajado({
      ...mapa,
      fotos: fotosGuardadas,
    });
  }, [sector.id, anotaciones, mapa]);

  return { mapa, paso, fallaDeFotos, bajar, bajarFotosSolo, cancelar, sacar };
}
