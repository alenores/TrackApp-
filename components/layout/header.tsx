"use client";

import { Button } from "@/components/ui/button";

type HeaderProps = {
  userEmail: string;
  onMenuToggle: () => void;
  onLogout: () => void;
  loggingOut: boolean;
};

export function Header({
  userEmail,
  onMenuToggle,
  onLogout,
  loggingOut,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex min-h-14 items-center gap-3 px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Abrir menú"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-foreground transition-colors hover:bg-surface-elevated lg:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold tracking-tight text-foreground">
            TrackApp
          </p>
          <p className="truncate text-xs text-muted">{userEmail}</p>
        </div>

        <Button
          variant="ghost"
          onClick={onLogout}
          disabled={loggingOut}
          className="min-h-11 px-3 text-sm"
        >
          {loggingOut ? "Saliendo…" : "Salir"}
        </Button>
      </div>
    </header>
  );
}
