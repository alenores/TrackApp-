"use client";

import { useEffect } from "react";
import { TRACKAPP_APP_READY_EVENT } from "@/lib/pwa/app-ready";
import { INLINE_SPLASH_ID } from "@/lib/pwa/inline-splash";
import { isStandaloneMode } from "@/lib/pwa/standalone";

const SPLASH_OUT_CLASS = `${INLINE_SPLASH_ID}--out`;
const SPLASH_FADE_MS = 300;

function removeSplashElement(splash: HTMLElement): void {
  splash.classList.add(SPLASH_OUT_CLASS);
  const cleanup = () => splash.remove();
  splash.addEventListener("transitionend", cleanup, { once: true });
  window.setTimeout(cleanup, SPLASH_FADE_MS + 50);
}

export function PwaSplash() {
  useEffect(() => {
    const splash = document.getElementById(INLINE_SPLASH_ID);
    if (!splash) {
      return;
    }

    if (!isStandaloneMode()) {
      splash.remove();
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
