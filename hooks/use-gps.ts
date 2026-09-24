"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { mensajeDeErrorDelGps, type EstadoDelGps } from "@/lib/navegacion/desvio";

/**
 * El GPS del celular, para las pantallas del cerro: navegar y el mapa libre.
 *
 * El GPS funciona por satélite: no necesita señal ni internet.
 */

/** Cuántos segundos sin noticias del GPS para avisar que la posición envejeció. */
const SEGUNDOS_PARA_AVISAR_POSICION_VIEJA = 30;

export type Gps = {
  estado: EstadoDelGps;
  /** Qué pasó cuando el GPS falla. Se muestra: nunca se traga. */
  error: string | null;
  posicion: { lat: number; lon: number } | null;
  /** Cuántos metros puede errar la última posición, según el propio GPS. */
  precision: number | null;
  prender: () => void;
  segundosSinNoticias: number;
  /** `true` cuando el GPS anda pero hace rato que no da novedades. */
  posicionVieja: boolean;
};

export function useGps(): Gps {
  const vigilanciaRef = useRef<number | null>(null);
  const [estado, setEstado] = useState<EstadoDelGps>("apagado");
  const [error, setError] = useState<string | null>(null);
  const [posicion, setPosicion] = useState<{ lat: number; lon: number } | null>(null);
  const [precision, setPrecision] = useState<number | null>(null);
  const [ultimaNoticia, setUltimaNoticia] = useState<number | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());

  // Un reloj lento, solo para saber si la posición envejeció.
  useEffect(() => {
    if (estado !== "andando") return;
    const tic = window.setInterval(() => setAhora(Date.now()), 5000);
    return () => window.clearInterval(tic);
  }, [estado]);

  useEffect(() => {
    return () => {
      if (vigilanciaRef.current !== null) {
        navigator.geolocation.clearWatch(vigilanciaRef.current);
      }
    };
  }, []);

  const prender = useCallback(() => {
    if (!navigator.geolocation) {
      setError(
        "Este celular no tiene GPS disponible para la app. Fijate en los permisos del navegador.",
      );
      setEstado("no_disponible");
      return;
    }

    setEstado("pidiendo");
    setError(null);

    if (vigilanciaRef.current !== null) {
      navigator.geolocation.clearWatch(vigilanciaRef.current);
    }

    vigilanciaRef.current = navigator.geolocation.watchPosition(
      (lectura) => {
        setPosicion({ lat: lectura.coords.latitude, lon: lectura.coords.longitude });
        setPrecision(
          Number.isFinite(lectura.coords.accuracy) ? Math.round(lectura.coords.accuracy) : null,
        );
        setEstado("andando");
        setUltimaNoticia(Date.now());
        setAhora(Date.now());
      },
      (falla) => {
        setError(mensajeDeErrorDelGps(falla));
        setEstado(falla.code === falla.PERMISSION_DENIED ? "sin_permiso" : "no_disponible");
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );
  }, []);

  const segundosSinNoticias =
    ultimaNoticia === null ? 0 : Math.round((ahora - ultimaNoticia) / 1000);

  return {
    estado,
    error,
    posicion,
    precision,
    prender,
    segundosSinNoticias,
    posicionVieja:
      estado === "andando" && segundosSinNoticias > SEGUNDOS_PARA_AVISAR_POSICION_VIEJA,
  };
}
