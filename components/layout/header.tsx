"use client";

import Link from "next/link";
import { UserAvatar } from "@/components/ui/user-avatar";

type HeaderProps = {
  onMenuToggle: () => void;
  userName: string;
  userAvatarUrl?: string | null;
};

export function Header({ onMenuToggle, userName, userAvatarUrl }: HeaderProps) {
  return (
    <header className="z-30 shrink-0 border-b border-border bg-background">
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
        </div>

        <Link
          href="/perfiles"
          aria-label={`Mi perfil (${userName})`}
          className="shrink-0 rounded-full transition-opacity hover:opacity-90"
        >
          <UserAvatar src={userAvatarUrl} name={userName} size="sm" />
        </Link>
      </div>
    </header>
  );
}
