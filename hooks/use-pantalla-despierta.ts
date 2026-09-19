"use client";

import { useEffect } from "react";

/**
 * Mantiene la pantalla encendida mientras se está navegando.
 *
 * Si la pantalla se apaga sola a los treinta segundos, la navegación no existe:
 * hay que despertar el teléfono cada vez que se quiere mirar dónde se está.
 *
 * **Vale solo mientras se navega**, nunca en toda la app: la pantalla encendida
 * consume mucha batería, y en el cerro la batería es seguridad.
 *
 * No todos los navegadores lo permiten. Cuando no se puede, no pasa nada: la
 * navegación funciona igual, solo que la pantalla se apaga como siempre.
 */
export function usePantallaDespierta(activo: boolean): void {
  useEffect(() => {
    if (!activo) return;
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let permiso: WakeLockSentinel | null = null;
    let cancelado = false;

    const pedir = async () => {
      try {
        permiso = await navigator.wakeLock.request("screen");
      } catch {
        // El navegador puede negarlo, por ejemplo con poca batería.
      }
    };

    // Al volver de otra app el permiso se pierde, así que se vuelve a pedir.
    const alVolverAMirar = () => {
      if (!cancelado && document.visibilityState === "visible") void pedir();
    };

    void pedir();
    document.addEventListener("visibilitychange", alVolverAMirar);

    return () => {
      cancelado = true;
      document.removeEventListener("visibilitychange", alVolverAMirar);
      void permiso?.release().catch(() => {});
    };
  }, [activo]);
}
