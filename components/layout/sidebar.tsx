"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    href: "/rutas",
    label: "Rutas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path
          d="M4 18 8 6l4 8 4-5 4 9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/perfil",
    label: "Mi perfil",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

type SidebarProps = {
  onNavigate?: () => void;
};

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="flex h-full flex-col gap-1 p-3">
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
        Menú
      </p>
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={[
              "flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-medium transition-colors",
              isActive
                ? "bg-emerald-950/60 text-emerald-200 ring-1 ring-emerald-800/50"
                : "text-slate-300 hover:bg-surface-elevated hover:text-foreground",
            ].join(" ")}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
