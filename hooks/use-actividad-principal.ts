"use client";

import { useSyncExternalStore } from "react";
import { ACTIVIDADES_RUTA, type ActividadRuta } from "@/types/database";

const CLAVE = "actividad-principal-del-mapa";
const EVENTO = "actividad-principal-cambiada";

function leer(): ActividadRuta {
  try {
    const guardada = localStorage.getItem(CLAVE);
    if (ACTIVIDADES_RUTA.some((valor) => valor === guardada)) return guardada as ActividadRuta;
  } catch { /* Sigue la actividad inicial. */ }
  return "mountain_bike";
}

function suscribir(notificar: () => void): () => void {
  window.addEventListener("storage", notificar);
  window.addEventListener(EVENTO, notificar);
  return () => {
    window.removeEventListener("storage", notificar);
    window.removeEventListener(EVENTO, notificar);
  };
}

/** Se recuerda por dispositivo y nunca filtra Caminos: solo decide cómo se destacan. */
export function useActividadPrincipal(): [ActividadRuta, (actividad: ActividadRuta) => void] {
  const actividad = useSyncExternalStore<ActividadRuta>(suscribir, leer, () => "mountain_bike");

  const elegir = (nueva: ActividadRuta) => {
    try {
      localStorage.setItem(CLAVE, nueva);
      window.dispatchEvent(new Event(EVENTO));
    } catch { /* Si el navegador impide guardar preferencias, el mapa sigue disponible. */ }
  };

  return [actividad, elegir];
}
