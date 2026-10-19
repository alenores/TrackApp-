"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DESTINOS_DEL_MENU, destinoActivo } from "@/components/armazon/destinos-del-menu";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";

/**
 * La barra del celular. Flota separada del borde. Las entradas de los
 * costados llevan el ícono pegado a la palabra. Navegación libre es el
 * círculo verde del medio: queda fuera de la tarjeta, y la barra se abre
 * en una curva para que entre los dos se vea el fondo.
 */

const CENTRO = "/mapa-libre";

/**
 * Dónde está el centro del círculo, respecto del borde de arriba de la barra.
 * Con el centro 4 px adentro, asoma hacia arriba un 40 % del redondel.
 */
const CENTRO_Y = 4;
/** El círculo mide 40 px, como un botón redondo. El hueco le deja un aire fino alrededor. */
const RADIO_DEL_HUECO = 25;

function mascara(radio: number, centroY: number): string {
  return `radial-gradient(circle ${radio}px at 50% ${centroY}px, transparent ${radio - 1}px, #fff ${radio}px)`;
}

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
      className={`${CLASE_DE_RESPUESTA_AL_TOQUE} group flex h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 text-texto ${activo ? "font-semibold" : "font-medium"}`}
    >
      <span className={`flex h-6 w-10 items-center justify-center rounded-full ${activo ? "bg-verde-fondo text-verde-texto" : "text-texto-suave group-hover:text-texto"}`}>
        <Icono icono={icono} />
      </span>
      <span className="max-w-full truncate px-0.5 text-center text-[11px] leading-none tracking-tight">
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
  return (
    <Link
      href={href}
      prefetch={false}
      aria-label="Navegación libre"
      aria-current={activo ? "page" : undefined}
      style={{ top: CENTRO_Y }}
      className={`${CLASE_DE_RESPUESTA_AL_TOQUE} absolute left-1/2 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-acento-borde bg-acento text-acento-texto shadow-[var(--sombra-alta)] hover:bg-acento-hover ${activo ? "ring-2 ring-acento-tenue" : ""}`}
    >
      <Icono icono={icono} />
    </Link>
  );
}

/** La tarjeta, con el bocado del medio. El círculo va aparte, encima. */
function Tarjeta() {
  const borde = mascara(RADIO_DEL_HUECO + 1, CENTRO_Y);
  // El relleno está 1 px adentro, así que el centro del hueco baja ese mismo px.
  const relleno = mascara(RADIO_DEL_HUECO, CENTRO_Y - 1);
  // Sin esto el recorte se repite desde la esquina y el medio queda cerrado.
  const recorte = (imagen: string): CSSProperties => ({
    maskImage: imagen,
    WebkitMaskImage: imagen,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
  });

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 rounded-3xl bg-borde" style={recorte(borde)} />
      <div className="absolute inset-px rounded-[23px] bg-superficie-alta" style={recorte(relleno)} />
    </div>
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
      <div className="relative h-12">
        <Tarjeta />
        {centro ? (
          <Brujula href={centro.href} icono={centro.icono} activo={destinoActivo(centro.href, pathname)} />
        ) : null}
        <div className="relative flex h-full items-center">
          <div className="flex min-w-0 flex-1 items-center">
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
          <div className="w-16 shrink-0" />
          <div className="flex min-w-0 flex-1 items-center">
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
      </div>
    </nav>
  );
}
