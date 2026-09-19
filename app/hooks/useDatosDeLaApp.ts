"use client";

import { useEffect, useState } from "react";
import { leerPaquete, type Paquete } from "@/lib/offline/paquete";
import { sincronizarPaquete } from "@/lib/offline/sincronizacion";

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

export function useDatosDeLaApp(): DatosDeLaApp {
  const [paquete, setPaquete] = useState<Paquete | null>(null);
  const [estado, setEstado] = useState<EstadoDeLosDatos>("abriendo");
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;

    // Primero lo que ya está: la pantalla no espera a internet para dibujar.
    const guardado = leerPaquete();
    if (guardado) {
      setPaquete(guardado);
      setEstado("listo");
    }

    void (async () => {
      const resultado = await sincronizarPaquete();
      if (!vigente) return;

      setPaquete(resultado.paquete);

      if (resultado.clase === "fallo") {
        setEstado(resultado.paquete ? "incompleto" : "sin_datos");
        setAviso(resultado.motivo);
        return;
      }

      if (resultado.clase === "sin_senal") {
        setEstado(resultado.paquete ? "sin_senal" : "sin_datos");
        return;
      }

      setEstado(resultado.paquete ? "listo" : "sin_datos");
      setAviso(null);
    })();

    return () => {
      vigente = false;
    };
  }, []);

  return { paquete, estado, aviso };
}
