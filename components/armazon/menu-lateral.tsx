"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Boton } from "@/components/ui/boton";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { DESTINOS_DEL_MENU, destinoActivo } from "@/components/armazon/destinos-del-menu";

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
        {DESTINOS_DEL_MENU
          .filter((item) => haySenal || !item.necesitaSenal)
          .map((item) => {
          const isActive = destinoActivo(item.href, pathname);

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
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{item.icono}</svg>
              {item.etiqueta}
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
