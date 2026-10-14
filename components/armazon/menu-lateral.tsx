"use client";

import { SelloDeVersion } from "@/components/armazon/sello-de-version";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Boton } from "@/components/ui/boton";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { DESTINOS_DEL_MENU, destinoActivo, subdestinoActivo } from "@/components/armazon/destinos-del-menu";

const CLASE_DE_ENTRADA = "flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-medium transition-colors";
const CLASE_ACTIVA = "bg-verde-fondo text-verde-texto ring-1 ring-acento-borde";
const CLASE_INACTIVA = "text-texto-suave hover:bg-superficie-alta hover:text-texto";

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
  // Lo que el usuario desplegó o plegó a mano. Sin tocar nada, está
  // desplegado el destino donde se está.
  const [desplegados, setDesplegados] = useState<Record<string, boolean>>({});

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
          const icono = <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{item.icono}</svg>;

          if (item.subdestinos) {
            const desplegado = desplegados[item.href] ?? isActive;
            const adentro = subdestinoActivo(item.subdestinos, pathname);
            return (
              <div key={item.href} className="flex flex-col gap-1">
                <button type="button" aria-expanded={desplegado}
                  onClick={() => setDesplegados((actuales) => ({ ...actuales, [item.href]: !desplegado }))}
                  className={[CLASE_DE_ENTRADA, "w-full text-left", isActive && !desplegado ? CLASE_ACTIVA : CLASE_INACTIVA].join(" ")}>
                  {icono}
                  <span className="flex-1">{item.etiqueta}</span>
                  <svg viewBox="0 0 24 24" fill="none" className={`h-4 w-4 transition-transform ${desplegado ? "rotate-180" : ""}`} aria-hidden
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </button>
                {desplegado ? (
                  <div className="ml-5 flex flex-col gap-1 border-l border-borde pl-3">
                    {item.subdestinos.map((sub) => (
                      <Link key={sub.href} href={sub.href} prefetch={false} onClick={onNavigate}
                        aria-current={adentro?.href === sub.href ? "page" : undefined}
                        className={[CLASE_DE_ENTRADA, adentro?.href === sub.href ? CLASE_ACTIVA : CLASE_INACTIVA].join(" ")}>
                        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{sub.icono}</svg>
                        {sub.etiqueta}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              prefetch={false}
              href={item.href}
              onClick={onNavigate}
              className={[CLASE_DE_ENTRADA, isActive ? CLASE_ACTIVA : CLASE_INACTIVA].join(" ")}
            >
              {icono}
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
          <SelloDeVersion className="hidden lg:block" />
        </div>
      ) : null}
    </nav>
  );
}
