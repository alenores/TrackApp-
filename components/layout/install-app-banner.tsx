"use client";

import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/lib/pwa/use-pwa-install";

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="inline-block h-5 w-5 align-[-0.125em] text-emerald-400"
      aria-hidden
    >
      <path
        d="M12 5v9M12 5l3.5 3.5M12 5 8.5 8.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 14H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MountainIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6 text-emerald-400"
      aria-hidden
    >
      <path
        d="m4 18 6-10 4 6 3-4 3 8H4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InstallAppBanner() {
  const {
    show,
    isIos,
    canInstall,
    needsManualInstall,
    installing,
    hintText,
    install,
    dismiss,
  } = usePwaInstall();

  if (!show) {
    return null;
  }

  return (
    <section
      aria-label="Instalar TrackApp"
      className="mb-4 rounded-2xl border border-emerald-800/40 bg-surface p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-800/40 bg-emerald-950/40"
          aria-hidden
        >
          <MountainIcon />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-base font-semibold text-foreground">
              Instalá TrackApp en tu celular
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">{hintText}</p>
          </div>

          {isIos ? (
            <ol className="space-y-2 text-sm text-foreground">
              <li className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-950/60 text-xs font-semibold text-emerald-300">
                  1
                </span>
                <span>
                  Tocá <ShareIcon /> Compartir en la barra del navegador
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-950/60 text-xs font-semibold text-emerald-300">
                  2
                </span>
                <span>Elegí “Agregar a pantalla de inicio”</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-950/60 text-xs font-semibold text-emerald-300">
                  3
                </span>
                <span>Abrí TrackApp desde el ícono en tu menú</span>
              </li>
            </ol>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {!isIos ? (
              <Button
                type="button"
                disabled={installing || (needsManualInstall && !canInstall)}
                onClick={() => void install()}
                className="min-h-10 px-4 py-2 text-sm"
              >
                {installing ? "Instalando…" : "Instalar app"}
              </Button>
            ) : null}
            <button
              type="button"
              onClick={dismiss}
              className="min-h-10 px-3 text-sm text-muted transition-colors hover:text-foreground"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
