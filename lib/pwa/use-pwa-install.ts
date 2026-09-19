"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDelNavegador } from "@/hooks/use-del-navegador";
import {
  type BeforeInstallPromptEvent,
  dismissInstallPrompt,
  isAndroidDevice,
  isInstallDismissed,
  isIosDevice,
  isMobileBrowser,
  isStandaloneMode,
} from "@/lib/pwa/standalone";

/**
 * El cartel que ofrece instalar la app en el celular.
 *
 * Casi todo acá **se deduce, no se guarda**: qué celular es, si la app ya está
 * instalada y si el usuario ya dijo que no son cosas que se leen del navegador.
 * Lo único que es estado de verdad es lo que pasó mientras la pantalla estaba
 * abierta: que el navegador ofreció instalar, que el usuario cerró el cartel o
 * que se cumplió la espera.
 */

const FALLBACK_DELAY_MS = 2500;

export type UsePwaInstallResult = {
  show: boolean;
  isIos: boolean;
  isAndroid: boolean;
  canInstall: boolean;
  needsManualInstall: boolean;
  installing: boolean;
  hintText: string;
  install: () => Promise<void>;
  dismiss: () => void;
};

export function usePwaInstall(): UsePwaInstallResult {
  const isIos = useDelNavegador(isIosDevice, false);
  const isAndroid = useDelNavegador(isAndroidDevice, false);
  const esMovil = useDelNavegador(isMobileBrowser, false);
  const yaEstaInstalada = useDelNavegador(isStandaloneMode, false);
  const yaDijoQueNo = useDelNavegador(isInstallDismissed, false);

  const [cerradoAhora, setCerradoAhora] = useState(false);
  const [instaladaAhora, setInstaladaAhora] = useState(false);
  const [pasoLaEspera, setPasoLaEspera] = useState(false);
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  const puedeOfrecerse =
    !yaEstaInstalada && !yaDijoQueNo && !cerradoAhora && !instaladaAhora;

  useEffect(() => {
    if (!puedeOfrecerse || isIos) return;

    const alPoderInstalar = (evento: Event) => {
      evento.preventDefault();
      setInstallEvent(evento as BeforeInstallPromptEvent);
    };

    const alQuedarInstalada = () => {
      dismissInstallPrompt();
      setInstaladaAhora(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", alPoderInstalar);
    window.addEventListener("appinstalled", alQuedarInstalada);

    // Algunos navegadores no avisan nunca que se puede instalar. Después de un
    // rato se ofrece igual, explicando cómo hacerlo a mano.
    const espera = window.setTimeout(
      () => setPasoLaEspera(true),
      FALLBACK_DELAY_MS,
    );

    return () => {
      window.removeEventListener("beforeinstallprompt", alPoderInstalar);
      window.removeEventListener("appinstalled", alQuedarInstalada);
      window.clearTimeout(espera);
    };
  }, [puedeOfrecerse, isIos]);

  const needsManualInstall =
    puedeOfrecerse &&
    installEvent === null &&
    (isIos || (pasoLaEspera && esMovil));

  const show = puedeOfrecerse && (installEvent !== null || needsManualInstall);

  const dismiss = useCallback(() => {
    dismissInstallPrompt();
    setCerradoAhora(true);
  }, []);

  const install = useCallback(async () => {
    if (!installEvent) return;

    setInstalling(true);

    try {
      await installEvent.prompt();
      const eleccion = await installEvent.userChoice;

      if (eleccion.outcome === "accepted") {
        dismissInstallPrompt();
        setInstaladaAhora(true);
      }
    } finally {
      setInstalling(false);
      setInstallEvent(null);
    }
  }, [installEvent]);

  const hintText = useMemo(() => {
    if (isIos) {
      return "Tocá Compartir y elegí “Agregar a pantalla de inicio” para tener el ícono de TrackApp en tu celular.";
    }

    if (needsManualInstall && isAndroid) {
      return "En Chrome, abrí el menú ⋮ y elegí “Instalar app” o “Agregar a inicio”.";
    }

    if (needsManualInstall) {
      return "Agregá TrackApp al inicio de tu celular para abrirla como app.";
    }

    return "Agregala al inicio del celular para abrirla como app y ver el ícono de la montaña.";
  }, [isAndroid, isIos, needsManualInstall]);

  return {
    show,
    isIos,
    isAndroid,
    canInstall: installEvent !== null,
    needsManualInstall,
    installing,
    hintText,
    install,
    dismiss,
  };
}
