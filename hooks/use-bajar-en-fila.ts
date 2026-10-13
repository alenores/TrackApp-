"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { bajarElMapaDelSector } from "@/lib/mapas/descarga";
import { fuenteDelServidor } from "@/lib/mapas/fuente-del-servidor";
import type { TipoDeMapa } from "@/lib/offline/mapas";
import type { Sector } from "@/types/database";

/**
 * Bajar varios mapas **de a uno y en orden**: varios a la vez pelean por la
 * misma conexión y no terminan antes, solo se ve peor. Si uno se corta, se
 * frena la fila y se dice cuál falló y por qué; los que ya entraron quedan
 * bajados. Lo usan los Circuitos y el «Descargar todo» de una zona.
 */

export type BajandoEnFila = {
  sectorId: number;
  nombre: string;
  tipo: TipoDeMapa;
  resueltos: number;
  total: number;
  /** Cuál de la fila es (empieza en 1) y cuántos hay. */
  numero: number;
  deCuantos: number;
};
export type PendienteDeBajar = { sector: Sector; tipo: TipoDeMapa };
export type FalloDeLaFila = { nombre: string; motivo: string };

export function useBajarEnFila() {
  const [bajando, setBajando] = useState<BajandoEnFila | null>(null);
  const [fallo, setFallo] = useState<FalloDeLaFila | null>(null);
  const [terminados, setTerminados] = useState<number | null>(null);
  const canceladorRef = useRef<AbortController | null>(null);
  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
      canceladorRef.current?.abort();
    };
  }, []);

  const bajarEstos = useCallback(async (pendientes: PendienteDeBajar[]) => {
    canceladorRef.current?.abort();
    const cancelador = new AbortController();
    canceladorRef.current = cancelador;
    setFallo(null);
    setTerminados(null);
    let listos = 0;

    for (const [indice, { sector, tipo }] of pendientes.entries()) {
      if (cancelador.signal.aborted) break;
      const base = { sectorId: sector.id, nombre: sector.nombre, tipo, numero: indice + 1, deCuantos: pendientes.length };
      setBajando({ ...base, resueltos: 0, total: 0 });

      const resultado = await bajarElMapaDelSector({
        sector,
        tipo,
        fuente: fuenteDelServidor(),
        senal: cancelador.signal,
        avisarAvance: ({ resueltos, total }) => {
          if (montadoRef.current) setBajando({ ...base, resueltos, total });
        },
      });

      if (!montadoRef.current) return;
      if (resultado.estado === "cancelada") break;

      if (resultado.estado === "incompleta") {
        setFallo({ nombre: sector.nombre, motivo: resultado.motivo });
        break;
      }
      listos += 1;
    }

    if (!montadoRef.current) return;
    setBajando(null);
    // «Listo» solo si entraron todos: nunca sobre una descarga incompleta.
    if (listos === pendientes.length) setTerminados(listos);
  }, []);

  return { bajando, fallo, terminados, bajarEstos };
}
