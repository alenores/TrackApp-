"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Boton } from "@/components/ui/boton";
import { BotonRedondo } from "@/components/ui/boton-redondo";
import { useCerrarConAtras } from "@/hooks/use-cerrar-con-atras";

export type AccionDelMenu = {
  etiqueta: string;
  alElegir: () => void;
  destructiva?: boolean;
  deshabilitada?: boolean;
};

/** Los mismos tres puntos y las mismas acciones en toda la app. */
export function MenuDeAcciones({
  etiqueta = "Opciones",
  acciones,
  className = "",
  sobreFoto = false,
  soloLosPuntos = false,
}: {
  etiqueta?: string;
  acciones: AccionDelMenu[];
  className?: string;
  sobreFoto?: boolean;
  /** En las tarjetas de Circuitos y Salidas: puntos verticales, sin círculo. */
  soloLosPuntos?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const id = useId();
  const cerrar = useCallback(() => setAbierto(false), []);
  useCerrarConAtras(abierto, cerrar);

  useEffect(() => {
    if (!abierto) return;
    const alTocarAfuera = (evento: PointerEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) cerrar();
    };
    document.addEventListener("pointerdown", alTocarAfuera);
    return () => document.removeEventListener("pointerdown", alTocarAfuera);
  }, [abierto, cerrar]);

  return <div ref={contenedor} className={`inline-flex ${className}`} onClick={(evento) => evento.stopPropagation()}>
    <div className="relative">
      <BotonRedondo etiqueta={etiqueta} aria-expanded={abierto} aria-controls={id}
        variante={soloLosPuntos ? "soloPuntos" : "secundario"}
        className={soloLosPuntos
          ? (sobreFoto ? "text-sobre-foto-texto" : "text-texto")
          : (sobreFoto ? "border-borde-fuerte bg-sobre-foto-degrade/80 text-sobre-foto-texto" : "")}
        onClick={() => setAbierto((valor) => !valor)}>
        {soloLosPuntos ? <>
          <circle cx="12" cy="5" r="1.8" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
          <circle cx="12" cy="19" r="1.8" fill="currentColor" stroke="none" />
        </> : <>
          <circle cx="5" cy="12" r="1.8" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
          <circle cx="19" cy="12" r="1.8" fill="currentColor" stroke="none" />
        </>}
      </BotonRedondo>
      {abierto ? <div id={id} role="menu" aria-label={etiqueta}
        className="absolute right-0 top-11 z-20 min-w-36 space-y-1 rounded-xl border border-borde bg-superficie p-1 shadow-[var(--sombra-alta)]">
        {acciones.map((accion) => <Boton key={accion.etiqueta} role="menuitem" anchoCompleto
          variante={accion.destructiva ? "destructivo" : "fantasma"} disabled={accion.deshabilitada}
          className="justify-start" onClick={() => { cerrar(); accion.alElegir(); }}>
          {accion.etiqueta}
        </Boton>)}
      </div> : null}
    </div>
  </div>;
}
