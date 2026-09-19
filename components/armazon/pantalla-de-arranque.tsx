"use client";

import { useEffect } from "react";
import { TRACKAPP_APP_READY_EVENT } from "@/lib/pwa/app-lista";
import { ID_DE_LA_PANTALLA_DE_ARRANQUE } from "@/lib/pwa/pantalla-de-arranque";
import { estaInstalada } from "@/lib/pwa/instalada";

const SPLASH_OUT_CLASS = `${ID_DE_LA_PANTALLA_DE_ARRANQUE}--out`;
const SPLASH_FADE_MS = 300;

function removeSplashElement(splash: HTMLElement): void {
  splash.classList.add(SPLASH_OUT_CLASS);
  const cleanup = () => { splash.style.display = "none"; };
  splash.addEventListener("transitionend", cleanup, { once: true });
  window.setTimeout(cleanup, SPLASH_FADE_MS + 50);
}

export function PantallaDeArranque() {
  useEffect(() => {
    const splash = document.getElementById(ID_DE_LA_PANTALLA_DE_ARRANQUE);
    if (!splash) {
      return;
    }

    if (!estaInstalada()) {
      splash.style.display = "none";
      return;
    }

    let dismissed = false;

    const dismiss = () => {
      if (dismissed) {
        return;
      }
      dismissed = true;
      removeSplashElement(splash);
    };

    const onAppReady = () => dismiss();
    window.addEventListener(TRACKAPP_APP_READY_EVENT, onAppReady);

    const { pathname } = window.location;
    if (pathname === "/login" || pathname.startsWith("/offline")) {
      dismiss();
    }

    return () => {
      window.removeEventListener(TRACKAPP_APP_READY_EVENT, onAppReady);
    };
  }, []);

  return null;
}
