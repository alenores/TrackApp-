"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHaySenal } from "@/hooks/use-hay-senal";

type NavItem = {
  href: string;
  label: string;
  necesitaSenal?: boolean;
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
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/mapa-libre",
    label: "Mapa libre",
    necesitaSenal: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path
          d="m15.5 8.5-2 5-5 2 2-5 5-2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/zonas",
    label: "Zonas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path
          d="M3 9l9-6 9 6v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 22V12h6v10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/mapas",
    label: "Mapas",
    necesitaSenal: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path
          d="M9 3 2 7v14l7-4 6 4 7-4V3l-7 4-6-4Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 3v14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 7v14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/perfiles",
    label: "Perfiles",
    necesitaSenal: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
        <path
          d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export function BarraInferior() {
  const haySenal = useHaySenal();
  const pathname = usePathname();

  const itemsVisibles = navItems.filter(
    (item) => haySenal || !item.necesitaSenal,
  );

  return (
    <nav
      aria-label="Navegación inferior mobile"
      className="fixed bottom-0 left-0 right-0 z-40 flex min-h-[56px] items-center justify-around border-t border-borde bg-superficie/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      {itemsVisibles.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex min-h-[56px] min-w-[56px] flex-1 flex-col items-center justify-center py-1 text-[11px] font-medium transition-colors",
              isActive
                ? "text-acento-borde font-semibold"
                : "text-texto-suave hover:text-texto",
            ].join(" ")}
          >
            <div
              className={[
                "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                isActive ? "bg-verde-fondo text-verde-texto" : "",
              ].join(" ")}
            >
              {item.icon}
            </div>
            <span className="mt-0.5 tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
