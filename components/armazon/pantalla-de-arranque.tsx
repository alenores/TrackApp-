"use client";

import { useEffect } from "react";
import { TRACKAPP_APP_READY_EVENT } from "@/lib/pwa/app-lista";
import {
  ID_DE_LA_PANTALLA_DE_ARRANQUE,
  TOPE_DE_ESPERA_MS,
} from "@/lib/pwa/pantalla-de-arranque";
import { estaInstalada } from "@/lib/pwa/instalada";

/**
 * La pantalla que tapa el arranque de la app instalada.
 *
 * **Tapa, así que se tiene que poder destapar siempre.** Antes solo se iba
 * cuando una pantalla avisaba que estaba lista, o cuando la dirección era la de
 * entrar o la de «sin señal». Si la pantalla no llegaba a dibujarse, no se iba
 * nunca: quedaba un rectángulo negro con el ícono en el medio y abajo, tapado,
 * el aviso que el usuario necesitaba leer.
 *
 * Pasó en el cerro el 2026-09-20: sin señal, al abrir el detalle de una zona
 * que no estaba guardada, la app mostraba «sin conexión» debajo de esta tapa y
 * el usuario no podía ver ni hacer nada.
 *
 * Ahora tiene tope: pase lo que pase, a los pocos segundos se destapa. Lo que
 * haya abajo —la pantalla, su cartel de carga o el aviso de sin señal— siempre
 * se puede leer.
 */

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

    // El tope. Ninguna falla puede dejar la app tapada: si la pantalla no llegó
    // a dibujarse, igual se destapa y el usuario ve lo que haya abajo.
    const tope = window.setTimeout(dismiss, TOPE_DE_ESPERA_MS);

    return () => {
      window.clearTimeout(tope);
      window.removeEventListener(TRACKAPP_APP_READY_EVENT, onAppReady);
    };
  }, []);

  return null;
}
