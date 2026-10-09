"use client";

import { useEffect, useMemo, useState } from "react";
import type { FeatureCollection } from "geojson";
import { leerCircuitoPreparado, type CircuitoSinDibujo } from "@/lib/offline/circuitos";

/**
 * Las líneas de varios Circuitos juntas, listas para el mapa: las que el
 * usuario prende para ubicarse mientras navega o mira una zona.
 *
 * **Solo lee lo guardado en el celular**, nunca internet: lo usa la
 * navegación. Las va leyendo a medida que se prenden y devuelve el mismo
 * objeto mientras no cambie nada, así el mapa no se redibuja de balde.
 */
export function useDibujosDeCircuitos(fichas: CircuitoSinDibujo[], idsPrendidos: number[]): FeatureCollection | null {
  const [cargados, setCargados] = useState<Record<string, FeatureCollection>>({});

  useEffect(() => {
    let montado = true;
    for (const id of idsPrendidos) {
      const ficha = fichas.find((cada) => cada.id === id);
      if (!ficha) continue;
      const clave = `${ficha.id}:${ficha.actualizadoEn}`;
      if (cargados[clave]) continue;
      void leerCircuitoPreparado(ficha).then((preparado) => {
        if (!montado || !preparado) return;
        setCargados((antes) => (antes[clave] ? antes : { ...antes, [clave]: preparado.dibujo }));
      });
    }
    return () => { montado = false; };
  }, [fichas, idsPrendidos, cargados]);

  return useMemo(() => {
    if (idsPrendidos.length === 0) return null;
    return {
      type: "FeatureCollection",
      features: idsPrendidos.flatMap((id) => {
        const ficha = fichas.find((cada) => cada.id === id);
        return ficha ? cargados[`${ficha.id}:${ficha.actualizadoEn}`]?.features ?? [] : [];
      }),
    };
  }, [fichas, idsPrendidos, cargados]);
}
