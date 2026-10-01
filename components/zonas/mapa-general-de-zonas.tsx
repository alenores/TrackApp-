"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { Boton } from "@/components/ui/boton";
import { Enlace } from "@/components/ui/enlace";
import { Tarjeta } from "@/components/ui/tarjeta";
import {
  CORDOBA_COMPLETA,
  puntosDelMapaGeneral,
  zonasEnElMapaGeneral,
} from "@/lib/mapas/general";
import type { Anotacion, Zona } from "@/types/database";

type Propiedades = {
  zonas: Zona[];
  anotaciones: Anotacion[];
  sectoresPorZona: Record<number, number>;
};

/** Vista del territorio completo: solo perímetros de zonas y anotaciones. */
export function MapaGeneralDeZonas({ zonas, anotaciones, sectoresPorZona }: Propiedades) {
  const [zonaId, setZonaId] = useState<number | null>(null);
  const zonaIdRef = useRef<number | null>(null);
  const rectangulos = useMemo(() => zonasEnElMapaGeneral(zonas), [zonas]);
  const puntos = useMemo(() => puntosDelMapaGeneral(anotaciones), [anotaciones]);
  const zonaElegida = zonas.find((zona) => zona.id === zonaId) ?? null;
  const guardarZona = useCallback((id: number | null) => {
    zonaIdRef.current = id;
    setZonaId(id);
  }, []);
  const senalarZona = guardarZona;
  const cerrarFicha = useCallback(() => {
    guardarZona(null);
  }, [guardarZona]);

  useEffect(() => {
    const cerrarAlTocarAfuera = (evento: PointerEvent) => {
      if (zonaIdRef.current === null) return;
      if ((evento.target as Element | null)?.closest("[data-ficha-zona]")) return;
      cerrarFicha();
    };
    document.addEventListener("pointerdown", cerrarAlTocarAfuera, true);
    return () => document.removeEventListener("pointerdown", cerrarAlTocarAfuera, true);
  }, [cerrarFicha]);

  return (
    <div className="space-y-3">
      <CargadorDeMapa
        enVivo
        principal
        alturaExtendida
        encuadre={CORDOBA_COMPLETA}
        rectangulos={rectangulos}
        anotaciones={puntos}
        alSenalarZona={senalarZona}
        fichaSobreElMapa={zonaElegida ? (
          <div data-ficha-zona>
              <Tarjeta className="space-y-3 shadow-[var(--sombra-alta)]">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 min-w-0 text-lg font-bold text-texto">{zonaElegida.nombre}</h2>
                  <Boton variante="fantasma" aria-label="Cerrar la ficha de la zona" onClick={cerrarFicha}>
                    Cerrar
                  </Boton>
                </div>
                <p className="text-base font-medium text-texto">
                  {sectoresPorZona[zonaElegida.id] ?? 0} {sectoresPorZona[zonaElegida.id] === 1 ? "sector" : "sectores"}
                </p>
                {zonaElegida.descripcion ? (
                  <p className="line-clamp-1 text-base leading-6 text-texto-suave sm:line-clamp-3">{zonaElegida.descripcion}</p>
                ) : null}
                <Enlace href={`/zonas/${zonaElegida.id}`} variante="principal">Ver zona</Enlace>
              </Tarjeta>
          </div>
        ) : null}
      />
      {zonas.length === 0 ? (
        <Tarjeta>
          <p className="text-base text-texto-suave">Todavía no hay zonas dibujadas en Córdoba.</p>
        </Tarjeta>
      ) : null}
    </div>
  );
}
