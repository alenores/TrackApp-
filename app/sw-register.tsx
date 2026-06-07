"use client";

import { useEffect } from "react";

const PWA_CACHE_BUST = "2026-06-07-deploy-09e2d84-v2";

const OBSOLETE_CACHE_NAMES = [
  "supabase-api-cache",
  "brand-static-png-network-first",
  "others",
];

async function deleteObsoleteCaches(): Promise<void> {
  if (typeof caches === "undefined") return;
  await Promise.all(OBSOLETE_CACHE_NAMES.map((name) => caches.delete(name)));
}

async function registerServiceWorker(): Promise<void> {
  let refreshing = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

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
