"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Boton } from "@/components/ui/boton";
import { BotonDeModo } from "@/components/ui/boton-de-modo";
import { useHaySenal } from "@/hooks/use-hay-senal";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** `true` cuando la pantalla no sirve de nada sin señal. */
  necesitaSenal?: boolean;
};

const navItems: NavItem[] = [
  {
    // Los Circuitos son el inicio de la app desde que se retiró Rutas (decisión 049).
    href: "/",
    label: "Circuitos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path d="M3 18 8 8l5 5 8-9M3 18h5m5-5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/mapa-libre",
    label: "Navegación libre",
    necesitaSenal: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="m15.5 8.5-2 5-5 2 2-5 5-2Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/zonas",
    label: "Mapas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path d="M9 3 2 7v14l7-4 6 4 7-4V3l-7 4-6-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 3v14M15 7v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/salidas",
    label: "Salidas",
    // Salidas es solo con internet: sin señal no está.
    necesitaSenal: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path d="M6 21V4m0 0h10l-2 3.5 2 3.5H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/perfiles",
    label: "Perfiles",
    // Los datos de los demás no se guardan en el celular, y no tiene sentido
    // que se guarden: sin señal esta pantalla no tiene nada que mostrar.
    necesitaSenal: true,
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
  userName?: string;
  userAvatarUrl?: string | null;
  onNavigate?: () => void;
  onLogout?: () => void;
  loggingOut?: boolean;
};

export function MenuLateral({
  userName,
  userAvatarUrl,
  onNavigate,
  onLogout,
  loggingOut = false,
}: SidebarProps) {
  const haySenal = useHaySenal();
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="flex h-full min-h-0 flex-col gap-1 p-3"
    >
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-texto-suave">
        Menú
      </p>
      <div className="flex flex-col gap-1">
        {navItems
          .filter((item) => haySenal || !item.necesitaSenal)
          .map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/" || pathname.startsWith("/circuitos")
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={[
                "flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-medium transition-colors",
                isActive
                  ? "bg-verde-fondo text-verde-texto ring-1 ring-acento-borde"
                  : "text-texto-suave hover:bg-superficie-alta hover:text-texto",
              ].join(" ")}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </div>

      {(userName || onLogout) ? (
        <div className="mt-auto border-t border-borde pt-3 space-y-2">
          {userName ? (
            <div className="flex items-center gap-3 px-3 py-1">
              <Avatar src={userAvatarUrl} name={userName} size="sm" />
              <p className="min-w-0 truncate text-sm font-medium text-texto">
                {userName}
              </p>
            </div>
          ) : null}

          {onLogout ? (
            <Boton
              type="button"
              variante="fantasma"
              anchoCompleto
              disabled={loggingOut}
              onClick={onLogout}
              className="justify-start px-3 text-left text-rojo-texto hover:bg-rojo-fondo-fuerte hover:text-rojo-texto"
            >
              {loggingOut ? "Saliendo…" : "Salir"}
            </Boton>
          ) : null}
        </div>
      ) : null}
    </nav>
  );
}
