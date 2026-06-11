"use client";

import { useEffect } from "react";

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

async function registerServiceWorker(): Promise<void> {
  // NOTA: eliminamos el window.location.reload() en controllerchange.
  // El reload forzado causaba ERR_FAILED ("can't load this") en mobile cuando
  // el SW se actualizaba mientras el usuario navegaba o hacía login.
  // Con skipWaiting:true en el SW, el nuevo SW ya toma control inmediatamente.
  // La siguiente navegación del usuario cargará el contenido actualizado.
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
