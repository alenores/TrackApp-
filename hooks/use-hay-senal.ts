"use client";

import { useSyncExternalStore } from "react";
import {
  EVENTO_CONEXION,
  estadoDeLaSenal,
  iniciarVigilanciaDeConexion,
  type EstadoDeLaSenal,
} from "@/lib/conexion";

/**
 * ¿Hay señal ahora mismo?
 *
 * **Se entera al instante.** El navegador avisa cuando la conexión aparece o
 * se va —poner el celular en modo avión dispara el aviso—, así que la pantalla
 * se acomoda sola sin que el usuario tenga que recargar nada.
 *
 * Preguntar una sola vez al abrir no alcanza: alguien que abre la app en el
 * pueblo y sube al cerro seguiría viendo botones que ya no funcionan.
 *
 * **Señal es señal que sirve** (`lib/conexion.ts`): con una rayita que no deja
 * pasar nada —el gris del cerro— da `false`, igual que con modo avión.
 *
 * **Mientras no se sabe, se responde que no hay.** Un botón que aparece tarde
 * no molesta a nadie; uno que aparece y al tocarlo falla, sí.
 */
export function useHaySenal(): boolean {
  return useEstadoDeLaSenal() === "hay";
}

/**
 * Pensando, hay o no hay. La entrada lo usa para no mostrar la pantalla de
 * sin señal mientras todavía se está averiguando.
 */
export function useEstadoDeLaSenal(): EstadoDeLaSenal {
  return useSyncExternalStore(suscribir, estadoDeLaSenal, () => "pensando");
}

function suscribir(avisar: () => void): () => void {
  iniciarVigilanciaDeConexion();
  window.addEventListener("online", avisar);
  window.addEventListener("offline", avisar);
  window.addEventListener(EVENTO_CONEXION, avisar);
  return () => {
    window.removeEventListener("online", avisar);
    window.removeEventListener("offline", avisar);
    window.removeEventListener(EVENTO_CONEXION, avisar);
  };
}
