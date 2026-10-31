"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useMapasBajados } from "@/hooks/use-mapa-del-sector";
import {
  reintentarElSombreado,
  sombraGruesaDeLosSectores,
  type ResultadoDeReintentarElSombreado,
} from "@/lib/mapas/descarga";
import { fuenteDelServidor } from "@/lib/mapas/fuente-del-servidor";
import { mirarLaSombraGruesa, sombraGruesa, type SombraGruesa } from "@/lib/offline/sombra-gruesa";
import type { Sector } from "@/types/database";

/**
 * El sombreado con menos detalle de unos sectores, visto desde una pantalla
 * (decisión 079): cuántos pedazos quedaron así, por qué, y reintentarlos.
 *
 * Solo cuenta los sectores que tienen algún mapa bajado: de uno que no se bajó
 * no hay nada que mejorar.
 */

const SIN_NADA: SombraGruesa = {};

export type PasoDelReintento =
  | { paso: "quieto" }
  | { paso: "reintentando" }
  | { paso: "termino"; resultado: ResultadoDeReintentarElSombreado };

export function useSombraGruesa(sectores: Sector[]) {
  const gruesa = useSyncExternalStore(mirarLaSombraGruesa, sombraGruesa, () => SIN_NADA);
  const bajados = useMapasBajados();
  const conMapa = useMemo(() => {
    const ids = new Set(bajados.map((cada) => cada.sectorId));
    return sectores.filter((sector) => ids.has(sector.id));
  }, [bajados, sectores]);
  const { pedazos, motivo } = useMemo(() => sombraGruesaDeLosSectores(conMapa, gruesa), [conMapa, gruesa]);

  const [paso, setPaso] = useState<PasoDelReintento>({ paso: "quieto" });
  const canceladorRef = useRef<AbortController | null>(null);
  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
      canceladorRef.current?.abort();
    };
  }, []);

  const reintentar = useCallback(async () => {
    canceladorRef.current?.abort();
    const cancelador = new AbortController();
    canceladorRef.current = cancelador;
    setPaso({ paso: "reintentando" });
    const resultado = await reintentarElSombreado({
      sectores: conMapa,
      fuente: fuenteDelServidor(),
      senal: cancelador.signal,
    });
    if (montadoRef.current) setPaso({ paso: "termino", resultado });
  }, [conMapa]);

  return { pedazos: pedazos.length, motivo, paso, reintentar };
}
