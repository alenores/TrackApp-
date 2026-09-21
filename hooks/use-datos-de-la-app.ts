"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  mirarElPaquete,
  paqueteEnMemoria,
  type Paquete,
} from "@/lib/offline/paquete";
import { sincronizarPaquete } from "@/lib/offline/sincronizacion";
import { calentarLasPantallas } from "@/lib/offline/calentar";

/**
 * Los datos de la app en el celular.
 *
 * Dibuja **al instante** con lo que ya está guardado, y si hay señal se pone al
 * día solo, sin preguntar nada ni mostrar un cartel de «hay novedades».
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

export function useDatosDeLaApp(): DatosDeLaApp {
  // El paquete guardado ya está en la primera pantalla: no se espera a nada.
  const paquete = useSyncExternalStore(
    mirarElPaquete,
    paqueteEnMemoria,
    () => null,
  );

  const [puesta, setPuesta] = useState<Puesta>({ clase: "buscando" });

  useEffect(() => {
    let vigente = true;
    const cancelador = new AbortController();

    void (async () => {
      const resultado = await sincronizarPaquete();
      if (!vigente) return;

      if (resultado.clase === "fallo") {
        setPuesta({ clase: "fallo", motivo: resultado.motivo });
        return;
      }

      if (resultado.clase === "sin_senal") {
        setPuesta({ clase: "sin_senal" });
        return;
      }

      setPuesta({ clase: "al_dia" });

      /**
       * Con el paquete al día se dejan listas las pantallas para el cerro.
       *
       * **El usuario no tiene que ir a visitarlas una por una.** Va sin esperar
       * a nadie: la pantalla ya está dibujada y esto pasa por detrás.
       */
      const alDia = resultado.paquete;
      if (alDia) {
        void calentarLasPantallas({ paquete: alDia, senal: cancelador.signal });
      }
    })();

    return () => {
      vigente = false;
      cancelador.abort();
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
