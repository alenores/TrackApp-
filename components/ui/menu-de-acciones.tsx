"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Boton } from "@/components/ui/boton";
import { BotonRedondo } from "@/components/ui/boton-redondo";
import { useCerrarConAtras } from "@/hooks/use-cerrar-con-atras";
import { NIVEL_DE_LAS_EMERGENTES } from "@/lib/capas";

export type AccionDelMenu = {
  etiqueta: string;
  alElegir: () => void;
  destructiva?: boolean;
  deshabilitada?: boolean;
};

/**
 * Los mismos tres puntos y las mismas acciones en toda la app: **verticales y
 * sin círculo**, en todos lados. Decisión de Ale del 2026-10-13.
 *
 * Las acciones se dibujan colgadas del final del documento, encima de todo:
 * adentro de una tarjeta que recorta lo que sobresale quedaban tapadas y no
 * se podían tocar (pasó en la lista de Marcas, 2026-10-13).
 */
export function MenuDeAcciones({
  etiqueta = "Opciones",
  acciones,
  className = "",
  sobreFoto = false,
}: {
  etiqueta?: string;
  acciones: AccionDelMenu[];
  className?: string;
  sobreFoto?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [lugar, setLugar] = useState<{ arriba: number; derecha: number } | null>(null);
  const id = useId();
  const cerrar = useCallback(() => setAbierto(false), []);
  useCerrarConAtras(abierto, cerrar);

  useEffect(() => {
    if (!abierto) return;
    const alTocarAfuera = (evento: PointerEvent) => {
      const tocado = evento.target as Node;
      if (!contenedor.current?.contains(tocado) && !menu.current?.contains(tocado)) cerrar();
    };
    // Si lo de atrás se desliza, el menú quedaría flotando lejos de sus puntos.
    const alDeslizar = (evento: Event) => {
      if (!menu.current?.contains(evento.target as Node)) cerrar();
    };
    document.addEventListener("pointerdown", alTocarAfuera);
    window.addEventListener("scroll", alDeslizar, true);
    window.addEventListener("resize", cerrar);
    return () => {
      document.removeEventListener("pointerdown", alTocarAfuera);
      window.removeEventListener("scroll", alDeslizar, true);
      window.removeEventListener("resize", cerrar);
    };
  }, [abierto, cerrar]);

  const alternar = (boton: HTMLElement) => {
    if (abierto) { cerrar(); return; }
    const caja = boton.getBoundingClientRect();
    setLugar({ arriba: caja.bottom + 4, derecha: window.innerWidth - caja.right });
    setAbierto(true);
  };

  return <div ref={contenedor} className={`inline-flex ${className}`} onClick={(evento) => evento.stopPropagation()}>
    <div className="relative">
      <BotonRedondo etiqueta={etiqueta} aria-expanded={abierto} aria-controls={id}
        variante="soloPuntos"
        className={sobreFoto ? "text-sobre-foto-texto" : "text-texto"}
        onClick={(evento) => alternar(evento.currentTarget)}>
        <circle cx="12" cy="5" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="12" cy="19" r="1.8" fill="currentColor" stroke="none" />
      </BotonRedondo>
      {abierto && lugar ? createPortal(<div ref={menu} id={id} role="menu" aria-label={etiqueta}
        onClick={(evento) => evento.stopPropagation()}
        style={{ top: lugar.arriba, right: lugar.derecha, zIndex: NIVEL_DE_LAS_EMERGENTES }}
        className="fixed min-w-36 space-y-1 rounded-xl border border-borde bg-superficie p-1 shadow-[var(--sombra-alta)]">
        {acciones.map((accion) => <Boton key={accion.etiqueta} role="menuitem" anchoCompleto
          variante={accion.destructiva ? "destructivo" : "fantasma"} disabled={accion.deshabilitada}
          className="justify-start" onClick={() => { cerrar(); accion.alElegir(); }}>
          {accion.etiqueta}
        </Boton>)}
      </div>, document.body) : null}
    </div>
  </div>;
}
