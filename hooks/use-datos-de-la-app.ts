"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  mirarElPaquete,
  paqueteEnMemoria,
  type Paquete,
} from "@/lib/offline/paquete";
import {
  mirarLaPuestaAlDia,
  ponerAlDiaUnaVezPorApertura,
  puestaAlDiaDeEstaApertura,
} from "@/lib/offline/puesta-al-dia";
import type { ResultadoDeSincronizacion } from "@/lib/offline/sincronizacion";

/**
 * Los datos de la app en el celular.
 *
 * Dibuja **al instante** con lo que ya está guardado, y si hay señal se pone al
 * día solo, sin preguntar nada ni mostrar un cartel de «hay novedades».
 *
 * **Ponerse al día pasa una vez por apertura, no en cada pantalla.** Todas las
 * pantallas usan esto, pero solo la primera sale a la base: ver
 * `lib/offline/puesta-al-dia.ts`.
 *
 * Cuando algo falla, lo que había sigue sirviendo: una actualización a medias
 * nunca rompe un paquete que ya andaba.
 */

export type EstadoDeLosDatos =
  | "abriendo"
  | "listo"
  | "sin_senal"
  | "sin_datos"
  | "incompleto";

export type DatosDeLaApp = {
  paquete: Paquete | null;
  estado: EstadoDeLosDatos;
  /** Qué salió mal, cuando algo salió mal. Se muestra: nunca se traga. */
  aviso: string | null;
};

/** Lo que pasó con el último intento de ponerse al día. */
type Puesta =
  | { clase: "buscando" }
  | { clase: "al_dia" }
  | { clase: "sin_senal" }
  | { clase: "fallo"; motivo: string };

function comoPuesta(resultado: ResultadoDeSincronizacion | null): Puesta {
  if (!resultado) return { clase: "buscando" };
  if (resultado.clase === "fallo") return { clase: "fallo", motivo: resultado.motivo };
  if (resultado.clase === "sin_senal") return { clase: "sin_senal" };
  return { clase: "al_dia" };
}

export function useDatosDeLaApp(): DatosDeLaApp {
  // El paquete guardado ya está en la primera pantalla: no se espera a nada.
  const paquete = useSyncExternalStore(
    mirarElPaquete,
    paqueteEnMemoria,
    () => null,
  );

  const [puesta, setPuesta] = useState<Puesta>(() =>
    comoPuesta(puestaAlDiaDeEstaApertura()),
  );

  useEffect(() => {
    let vigente = true;
    const anotar = (resultado: ResultadoDeSincronizacion) => {
      if (vigente) setPuesta(comoPuesta(resultado));
    };

    // Si otra pantalla o un guardado la pone al día, esta se entera.
    const dejarDeMirar = mirarLaPuestaAlDia(anotar);
    void ponerAlDiaUnaVezPorApertura().then(anotar);

    return () => {
      vigente = false;
      dejarDeMirar();
    };
  }, []);

  if (puesta.clase === "buscando") {
    // Con algo guardado no hay nada que esperar: se muestra y listo.
    return {
      paquete,
      estado: paquete ? "listo" : "abriendo",
      aviso: null,
    };
  }

  if (puesta.clase === "fallo") {
    return {
      paquete,
      estado: paquete ? "incompleto" : "sin_datos",
      aviso: puesta.motivo,
    };
  }

  if (puesta.clase === "sin_senal") {
    return {
      paquete,
      estado: paquete ? "sin_senal" : "sin_datos",
      aviso: null,
    };
  }

  return { paquete, estado: paquete ? "listo" : "sin_datos", aviso: null };
}
