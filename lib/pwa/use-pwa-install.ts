"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type BeforeInstallPromptEvent,
  dismissInstallPrompt,
  isAndroidDevice,
  isInstallDismissed,
  isIosDevice,
  isMobileBrowser,
  isStandaloneMode,
} from "@/lib/pwa/standalone";

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
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [needsManualInstall, setNeedsManualInstall] = useState(false);
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isStandaloneMode() || isInstallDismissed()) {
      return;
    }

    const ios = isIosDevice();
    const android = isAndroidDevice();

    setIsIos(ios);
    setIsAndroid(android);

    if (ios) {
      setNeedsManualInstall(true);
      setShow(true);
      return;
    }

    let promptReceived = false;

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      promptReceived = true;
      setInstallEvent(event as BeforeInstallPromptEvent);
      setNeedsManualInstall(false);
      setShow(true);
    };

    const handleAppInstalled = () => {
      dismissInstallPrompt();
      setShow(false);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    const fallbackTimer = window.setTimeout(() => {
      if (
        promptReceived ||
        isStandaloneMode() ||
        isInstallDismissed()
      ) {
        return;
      }

      if (isMobileBrowser()) {
        setNeedsManualInstall(true);
        setShow(true);
      }
    }, FALLBACK_DELAY_MS);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  const dismiss = useCallback(() => {
    dismissInstallPrompt();
    setShow(false);
  }, []);

  const install = useCallback(async () => {
    if (!installEvent) {
      return;
    }

    setInstalling(true);

    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;

      if (choice.outcome === "accepted") {
        dismissInstallPrompt();
        setShow(false);
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
