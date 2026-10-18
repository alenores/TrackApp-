"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DESTINOS_DEL_MENU, destinoActivo } from "@/components/armazon/destinos-del-menu";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";

/**
 * La barra del celular. Flota separada del borde, en el gris un paso más
 * elevado que las tarjetas, para que no se confunda con una. Las entradas de
 * los costados pesan igual; Navegación libre es la brújula del medio, siempre
 * verde, y asoma por encima de la barra. Con señal quedan cinco; sin señal
 * se van Salidas, Mapas y Perfiles, y la brújula sigue en el centro.
 */

const CENTRO = "/mapa-libre";

function Icono({ icono }: { icono: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icono}
    </svg>
  );
}

function DestinoLateral({
  href,
  etiqueta,
  icono,
  activo,
}: {
  href: string;
  etiqueta: string;
  icono: ReactNode;
  activo: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      aria-current={activo ? "page" : undefined}
      className={`${CLASE_DE_RESPUESTA_AL_TOQUE} group flex min-h-11 min-w-0 flex-1 flex-col items-center justify-end text-texto ${activo ? "font-semibold" : "font-medium"}`}
    >
      <span className={`flex h-7 w-12 items-center justify-center rounded-full ${activo ? "bg-verde-fondo text-verde-texto" : "text-texto-suave group-hover:text-texto"}`}>
        <Icono icono={icono} />
      </span>
      <span className="mt-0.5 flex h-7 max-w-full items-center text-center text-[11px] leading-tight tracking-tight">
        {etiqueta}
      </span>
    </Link>
  );
}

function Brujula({
  href,
  icono,
  activo,
}: {
  href: string;
  icono: ReactNode;
  activo: boolean;
}) {
  // El círculo mide lo mismo que un botón redondo (h-10). Asoma: el casillero
  // de abajo es el de los otros íconos, y el círculo se corre hacia arriba.
  const aro = activo
    ? "[box-shadow:0_0_0_3px_var(--superficie-alta),0_0_0_5px_var(--acento-tenue),var(--sombra-alta)]"
    : "[box-shadow:0_0_0_3px_var(--superficie-alta),var(--sombra-alta)]";

  return (
    <Link
      href={href}
      prefetch={false}
      aria-current={activo ? "page" : undefined}
      className={`${CLASE_DE_RESPUESTA_AL_TOQUE} relative z-10 flex w-[4.75rem] shrink-0 flex-col items-center justify-end text-texto ${activo ? "font-semibold" : "font-medium"}`}
    >
      <span className="relative flex h-7 w-full items-end justify-center">
        <span className={`absolute bottom-0 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-3 items-center justify-center rounded-full border border-acento-borde bg-acento text-acento-texto hover:bg-acento-hover ${aro}`}>
          <Icono icono={icono} />
        </span>
      </span>
      <span className="mt-0.5 flex h-7 items-center text-center text-[11px] leading-tight tracking-tight">
        Navegación<br />libre
      </span>
    </Link>
  );
}

export function BarraInferior() {
  const haySenal = useHaySenal();
  const pathname = usePathname();
  const visibles = DESTINOS_DEL_MENU.filter((item) => haySenal || !item.necesitaSenal);
  const indiceDelCentro = visibles.findIndex((item) => item.href === CENTRO);
  const izquierda = visibles.slice(0, Math.max(indiceDelCentro, 0));
  const centro = visibles[indiceDelCentro];
  const derecha = indiceDelCentro >= 0 ? visibles.slice(indiceDelCentro + 1) : [];

  return (
    <nav
      aria-label="Navegación inferior mobile"
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-40 lg:hidden"
    >
      <div className="flex items-end rounded-3xl border border-borde bg-superficie-alta px-1 py-1.5 shadow-[var(--sombra-alta)]">
        <div className="flex min-w-0 flex-1 items-end">
          {izquierda.map((item) => (
            <DestinoLateral
              key={item.href}
              href={item.href}
              etiqueta={item.etiqueta}
              icono={item.icono}
              activo={destinoActivo(item.href, pathname)}
            />
          ))}
        </div>
        {centro ? (
          <Brujula href={centro.href} icono={centro.icono} activo={destinoActivo(centro.href, pathname)} />
        ) : null}
        <div className="flex min-w-0 flex-1 items-end">
          {derecha.map((item) => (
            <DestinoLateral
              key={item.href}
              href={item.href}
              etiqueta={item.etiqueta}
              icono={item.icono}
              activo={destinoActivo(item.href, pathname)}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
