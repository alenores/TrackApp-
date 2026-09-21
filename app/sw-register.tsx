"use client";

import { useEffect } from "react";
import {
  cuandoRecargarPorVersionNueva,
  esLaPantallaDeNavegar,
} from "@/lib/actualizacion/version-nueva";

const PWA_CACHE_BUST = "2026-06-11-no-reload-on-sw-update-v1";

const OBSOLETE_CACHE_NAMES = [
  "supabase-api-cache",
  "brand-static-png-network-first",
  "brand-static-png-cache-first",
  "pages-network-first",
  "others",
  "html-navigate-cache",
];

async function deleteObsoleteCaches(): Promise<void> {
  if (typeof caches === "undefined") return;
  await Promise.all(OBSOLETE_CACHE_NAMES.map((name) => caches.delete(name)));
}

/**
 * Cuando la versión nueva toma el mando, la pantalla abierta hay que recargarla.
 *
 * **Sin esto, la pantalla vieja sigue en memoria pidiendo archivos que la
 * versión nueva ya tiró**, y al pasar a otra pantalla por dentro de la app se
 * rompe. Pasó el 2026-09-21. En junio se había sacado la recarga porque,
 * hecha en el acto, rompía el login en el celular; la forma de Vías de
 * Escalada, que anda desde julio, es recargar **solo si es una actualización**
 * y **solo cuando la app pasa a segundo plano**, que no se nota. Acá se suma
 * que nunca se recarga navegando una ruta: ver `lib/actualizacion`.
 */
function recargarCuandoCorresponda(habiaVersionAntes: boolean): void {
  let recargando = false;
  const recargar = () => {
    if (recargando) return;
    recargando = true;
    window.location.reload();
  };

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (recargando) return;

    const decidir = () =>
      cuandoRecargarPorVersionNueva({
        habiaVersionAntes,
        visible: document.visibilityState === "visible",
        navegando: esLaPantallaDeNavegar(window.location.pathname),
      });

    const ahora = decidir();
    if (ahora === "ahora") {
      recargar();
      return;
    }
    if (ahora === "nunca") return;

    // Se vuelve a decidir al esconderse: si para entonces está navegando, no.
    const alEsconderse = () => {
      if (document.visibilityState !== "hidden") return;
      document.removeEventListener("visibilitychange", alEsconderse);
      if (decidir() === "ahora") recargar();
    };
    document.addEventListener("visibilitychange", alEsconderse);
  });
}

async function registerServiceWorker(): Promise<void> {
  // Si ya había una versión al mando, lo que viene es una actualización.
  recargarCuandoCorresponda(Boolean(navigator.serviceWorker.controller));

  const registration = await navigator.serviceWorker.register("/sw.js");

  registration.addEventListener("updatefound", () => {
    const installing = registration.installing;
    if (!installing) return;

    installing.addEventListener("statechange", () => {
      if (
        installing.state === "installed" &&
        navigator.serviceWorker.controller
      ) {
        installing.postMessage({ type: "SKIP_WAITING" });
      }
    });
  });

  await registration.update();

  if (registration.waiting && navigator.serviceWorker.controller) {
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  }
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const isSecureContext =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost";
    if (!isSecureContext) return;

    const bustKey = "pwa-cache-bust-v1";

    void (async () => {
      try {
        const previousBust = window.localStorage.getItem(bustKey);
        if (previousBust !== PWA_CACHE_BUST) {
          window.localStorage.setItem(bustKey, PWA_CACHE_BUST);
          await deleteObsoleteCaches();
        }
      } catch {
        /* ignore */
      }

      try {
        await registerServiceWorker();
      } catch {
        // Registro best-effort; sin ruido en UI.
      }
    })();
  }, []);

  return null;
}
