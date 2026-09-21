"use client";

import { useEffect, useMemo, useState } from "react";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { useSectoresConMapaBajado } from "@/hooks/use-mapa-del-sector";
import {
  mapasPerdidos,
  rutasSinMapa,
  type MapaPerdido,
  type RutaSinMapa,
} from "@/lib/mapas/lo-que-falta";
import { losSacadosAProposito } from "@/lib/offline/sacados-a-proposito";
import type { Paquete } from "@/lib/offline/paquete";
import {
  traerLosMapasQueTenias,
  type MapaQueTenias,
} from "@/lib/supabase/mapas-bajados";

/**
 * Qué mapas le faltan a este celular, para decirlo en el inicio.
 *
 * **Se pregunta con señal y en casa.** Lo que la base dice que tenías bajado se
 * consulta una vez al abrir; de ahí en más la cuenta se rehace sola cada vez que
 * el usuario baja o saca un mapa, sin volver a preguntar nada.
 *
 * Sin señal no se consulta —no se puede— pero lo último que se supo sigue
 * valiendo: la información no se esconde, solo se esconde el botón.
 */

export type LoQueFalta = {
  /** Los que la base dice que tenías y ya no están. */
  perdidos: MapaPerdido[];
  /** Las rutas que nunca tuvieron el mapa bajado. */
  rutas: RutaSinMapa[];
  /** Por qué no se pudo saber, cuando no se pudo. */
  aviso: string | null;
};

const VACIO: LoQueFalta = { perdidos: [], rutas: [], aviso: null };

type LoQueDijoLaBase =
  | { paso: "buscando" }
  | { paso: "lista"; mapas: MapaQueTenias[] }
  | { paso: "no_se_pudo"; motivo: string };

export function useLoQueFalta(paquete: Paquete | null): LoQueFalta {
  const haySenal = useHaySenal();
  const conMapa = useSectoresConMapaBajado();
  const [laBase, setLaBase] = useState<LoQueDijoLaBase>({ paso: "buscando" });

  useEffect(() => {
    if (!haySenal) return;

    let vigente = true;

    void (async () => {
      const resultado = await traerLosMapasQueTenias();
      if (!vigente) return;

      setLaBase(
        resultado.clase === "lista"
          ? { paso: "lista", mapas: resultado.mapas }
          : { paso: "no_se_pudo", motivo: resultado.motivo },
      );
    })();

    return () => {
      vigente = false;
    };
  }, [haySenal]);

  return useMemo(() => {
    if (!paquete || laBase.paso === "buscando") return VACIO;

    if (laBase.paso === "no_se_pudo") {
      return {
        perdidos: [],
        rutas: [],
        aviso: `No se pudo revisar si te falta algún mapa: ${laBase.motivo} Probá de nuevo con mejor señal.`,
      };
    }

    /**
     * Los que sacaste vos y la base todavía no sabe no son una pérdida.
     *
     * Contarlos sería ofrecerte bajar de nuevo justo lo que decidiste tirar.
     */
    const sacados = new Set(losSacadosAProposito());
    const tenias = laBase.mapas.filter((cada) => !sacados.has(cada.sectorId));

    const perdidos = mapasPerdidos(tenias, paquete.sectores, conMapa);

    return {
      perdidos,
      rutas: rutasSinMapa(paquete.rutas, paquete.sectores, conMapa, perdidos),
      aviso: null,
    };
  }, [paquete, laBase, conMapa]);
}
