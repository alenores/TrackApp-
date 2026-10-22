"use client";

import { useCallback, useEffect, useState } from "react";
import { leerParticipantes, leerSalidas } from "@/app/actions/salidas";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { olvidarLoDeEstaApertura, unaVezPorApertura } from "@/lib/datos/una-vez-por-apertura";
import type { PerfilBreve, Salida } from "@/types/database";

/**
 * Las salidas y los usuarios, **pedidos una sola vez por apertura** (decisión
 * 054). La lista, las fichas, el calendario y los filtros leen de acá: buscar,
 * filtrar, pasar de página o abrir una ficha no vuelven a preguntarle a la
 * base. Cuando alguien guarda o borra una salida se olvida lo pedido, y la
 * próxima pantalla lo trae fresco.
 *
 * Salidas es 100 % con internet: sin señal no se pide nada, y lo que ya llegó
 * queda a la vista.
 */

export type SalidasDeLaApertura =
  | { estado: "cargando" }
  | { estado: "fallo"; motivo: string }
  | {
      estado: "listo";
      salidas: Salida[];
      participantes: PerfilBreve[];
      /** Por qué falta la lista de usuarios, si faltó. Las salidas igual se ven. */
      faltanParticipantes: string | null;
    };

async function pedir(): Promise<SalidasDeLaApertura> {
  const [salidas, participantes] = await Promise.all([
    unaVezPorApertura("salidas", leerSalidas),
    unaVezPorApertura("participantes", leerParticipantes),
  ]);
  if (!salidas.ok) return { estado: "fallo", motivo: salidas.error };
  // Sin la lista de usuarios igual se ven las salidas: solo falta poder
  // filtrar por participantes.
  return {
    estado: "listo",
    salidas: salidas.datos,
    participantes: participantes.ok ? participantes.datos : [],
    faltanParticipantes: participantes.ok ? null : participantes.error,
  };
}

export function useSalidasDeLaApertura(): SalidasDeLaApertura & { reintentar: () => void } {
  const haySenal = useHaySenal();
  const [datos, setDatos] = useState<SalidasDeLaApertura>({ estado: "cargando" });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!haySenal) return;
    let vigente = true;
    void pedir()
      .then((resultado) => {
        if (vigente) setDatos(resultado);
      })
      .catch((causa: unknown) => {
        if (!vigente) return;
        setDatos({
          estado: "fallo",
          motivo: `${causa instanceof Error ? causa.message : String(causa)}. Probá de nuevo con señal`,
        });
      });
    return () => {
      vigente = false;
    };
  }, [haySenal, intento]);

  const reintentar = useCallback(() => {
    setDatos({ estado: "cargando" });
    setIntento((cada) => cada + 1);
  }, []);

  return { ...datos, reintentar };
}

/** Se guardó o se borró una salida: lo próximo que se pida llega fresco. */
export function olvidarLasSalidas(): void {
  olvidarLoDeEstaApertura();
}
