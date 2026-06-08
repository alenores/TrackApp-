"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "pwa-install-dismissed-v2";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

function isIosSafari(): boolean {
  const ua = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(ua);
  const isSafari =
    isIos && !ua.includes("crios") && !ua.includes("fxios") && !ua.includes("edg");
  return isSafari;
}

function isAndroid(): boolean {
  return /android/i.test(window.navigator.userAgent);
}

export function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [androidHint, setAndroidHint] = useState(false);
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isStandaloneMode()) {
      return;
    }

    if (window.localStorage.getItem(DISMISS_KEY) === "1") {
      return;
    }

    if (isIosSafari()) {
      setIosHint(true);
      setVisible(true);
      return;
    }

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setAndroidHint(false);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    const fallbackTimer = window.setTimeout(() => {
      if (!isStandaloneMode() && isAndroid()) {
        setAndroidHint(true);
        setVisible(true);
      }
    }, 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const handleInstall = async () => {
    if (!installEvent) return;

    setInstalling(true);

    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;

      if (choice.outcome === "accepted") {
        window.localStorage.setItem(DISMISS_KEY, "1");
        setVisible(false);
      }
    } finally {
      setInstalling(false);
      setInstallEvent(null);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+1.75rem)] z-[65] px-3 sm:px-4">
      <div className="mx-auto flex max-w-3xl items-start gap-3 rounded-2xl border border-emerald-800/50 bg-slate-900/95 p-4 shadow-xl shadow-black/40 backdrop-blur">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Instalá TrackApp
          </p>
          <p className="text-sm leading-6 text-slate-400">
            {iosHint
              ? "En Safari, tocá Compartir y elegí “Agregar a pantalla de inicio”."
              : androidHint && !installEvent
                ? "En Chrome, abrí el menú ⋮ y elegí “Instalar app” o “Agregar a inicio”."
                : "Agregala al inicio del celular para abrirla como app y ver el icono de la montaña."}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          {!iosHint ? (
            <Button
              type="button"
              disabled={installing || !installEvent}
              onClick={() => void handleInstall()}
              className="min-h-10 px-4 py-2 text-sm"
            >
              {installing ? "Instalando…" : "Instalar"}
            </Button>
          ) : null}
          <button
            type="button"
            onClick={dismiss}
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
