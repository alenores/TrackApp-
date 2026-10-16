"use client";

import { useSyncExternalStore } from "react";
import { ACTIVIDADES_RUTA, type ActividadRuta } from "@/types/database";

const CLAVE = "actividades-visibles-en-navegacion";
const EVENTO = "actividades-visibles-cambiadas";

/** Sin una elección guardada, se ven las cinco. El orden es el de la app. */
export function actividadesVisiblesDesdeTexto(crudo: string | null): ActividadRuta[] {
  if (!crudo) return ACTIVIDADES_RUTA;
  try {
    const lista = JSON.parse(crudo) as unknown;
    if (!Array.isArray(lista)) return ACTIVIDADES_RUTA;
    const validas = ACTIVIDADES_RUTA.filter((actividad) => lista.includes(actividad));
    if (validas.length === 0 || validas.length === ACTIVIDADES_RUTA.length) return ACTIVIDADES_RUTA;
    return validas;
  } catch {
    return ACTIVIDADES_RUTA;
  }
}

let cache = actividadesVisiblesDesdeTexto(null);
let cacheCrudo: string | null = null;

function leer(): ActividadRuta[] {
  let crudo: string | null = null;
  try {
    crudo = localStorage.getItem(CLAVE);
  } catch {
    crudo = null;
  }
  if (crudo === cacheCrudo) return cache;
  cacheCrudo = crudo;
  cache = actividadesVisiblesDesdeTexto(crudo);
  return cache;
}

function suscribir(notificar: () => void): () => void {
  window.addEventListener("storage", notificar);
  window.addEventListener(EVENTO, notificar);
  return () => {
    window.removeEventListener("storage", notificar);
    window.removeEventListener(EVENTO, notificar);
  };
}

/**
 * Qué actividades se ven en la navegación libre. Se recuerda en el celular.
 * La primera vez vienen las cinco prendidas.
 */
export function useActividadesVisibles(): [ActividadRuta[], (actividades: readonly ActividadRuta[]) => void] {
  const actividades = useSyncExternalStore(suscribir, leer, () => ACTIVIDADES_RUTA);

  const elegir = (nuevas: readonly ActividadRuta[]) => {
    const siguientes = actividadesVisiblesDesdeTexto(JSON.stringify(nuevas));
    const crudo = JSON.stringify(siguientes);
    cache = siguientes;
    cacheCrudo = crudo;
    try {
      localStorage.setItem(CLAVE, crudo);
    } catch { /* Si el navegador impide guardar preferencias, el mapa sigue disponible. */ }
    window.dispatchEvent(new Event(EVENTO));
  };

  return [actividades, elegir];
}
