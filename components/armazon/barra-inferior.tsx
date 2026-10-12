"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DESTINOS_DEL_MENU, destinoActivo } from "@/components/armazon/destinos-del-menu";
import { useHaySenal } from "@/hooks/use-hay-senal";

export function BarraInferior() {
  const haySenal = useHaySenal();
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación inferior mobile"
      className="fixed bottom-0 left-0 right-0 z-40 flex min-h-[56px] items-center justify-around border-t border-borde bg-superficie/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      {DESTINOS_DEL_MENU.filter((item) => haySenal || !item.necesitaSenal).map((item) => {
        const activo = destinoActivo(item.href, pathname);
        return <Link key={item.href} href={item.href}
          className={`flex min-h-[56px] min-w-[56px] flex-1 flex-col items-center justify-center py-1 text-[11px] font-medium transition-colors ${activo ? "font-semibold text-acento-borde" : "text-texto-suave hover:text-texto"}`}>
          <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${activo ? "bg-verde-fondo text-verde-texto" : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{item.icono}</svg>
          </span>
          <span className="mt-0.5 max-w-full text-center leading-tight tracking-tight">
            {item.etiqueta === "Navegación libre" ? <>Navegación<br />libre</> : item.etiqueta}
          </span>
        </Link>;
      })}
    </nav>
  );
}
