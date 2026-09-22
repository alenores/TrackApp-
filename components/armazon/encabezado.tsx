"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";

type HeaderProps = {
  onMenuToggle: () => void;
  userName: string;
  userAvatarUrl?: string | null;
};

export function Encabezado({ onMenuToggle, userName, userAvatarUrl }: HeaderProps) {
  return (
    <header className="z-30 shrink-0 border-b border-borde bg-fondo lg:hidden">
      <div className="flex min-h-14 items-center gap-3 px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Abrir menú"
          className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-borde bg-superficie text-texto transition-colors hover:bg-superficie-alta"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold tracking-tight text-texto">
            Cba Track App
          </p>
        </div>
      </div>
    </header>
  );
}
