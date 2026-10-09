"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { Boton } from "@/components/ui/boton";
import { Enlace } from "@/components/ui/enlace";
import { Tarjeta } from "@/components/ui/tarjeta";
import {
  CORDOBA_COMPLETA,
  zonasEnElMapaGeneral,
} from "@/lib/mapas/general";
import type { Anotacion, Zona } from "@/types/database";
import type { CaminoSinLinea } from "@/lib/caminos/datos";
import { useCaminosGuardados } from "@/hooks/use-caminos-guardados";
import { useActividadPrincipal } from "@/hooks/use-actividad-principal";
import { dibujarCaminos } from "@/lib/caminos/dibujo";
import { SelectorDeActividadPrincipal } from "@/components/caminos/selector-de-actividad-principal";
import { FichaDeCamino } from "@/components/caminos/ficha-de-camino";
import { ReferenciaDePartes } from "@/components/rutas/referencia-de-partes";

type Propiedades = {
  zonas: Zona[];
  anotaciones: Anotacion[];
  caminos?: CaminoSinLinea[];
  sectoresPorZona: Record<number, number>;
};

/** Vista del territorio completo con zonas, Caminos y anotaciones. */
const SIN_CAMINOS: CaminoSinLinea[] = [];

export function MapaGeneralDeZonas({ zonas, anotaciones, caminos: caminosSinLinea = SIN_CAMINOS, sectoresPorZona }: Propiedades) {
  const [zonaId, setZonaId] = useState<number | null>(null);
  const [caminoTocado, setCaminoTocado] = useState<{ id: number; indice: number } | null>(null);
  const [puntoSenalado, setPuntoSenalado] = useState<number[] | null>(null);
  const [actividad, elegirActividad] = useActividadPrincipal();
  const { caminos, error: errorDeCaminos, cargando: cargandoCaminos } = useCaminosGuardados(caminosSinLinea);
  const zonaIdRef = useRef<number | null>(null);
  const rectangulos = useMemo(() => zonasEnElMapaGeneral(zonas), [zonas]);
  const dibujo = useMemo(() => dibujarCaminos(caminos, actividad), [caminos, actividad]);
  const elegido = caminos.find((camino) => camino.id === caminoTocado?.id) ?? null;
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
      <SelectorDeActividadPrincipal actividad={actividad} alCambiar={elegirActividad} />
      {cargandoCaminos && caminosSinLinea.length > 0 ? <p role="status" className="text-base text-texto">Abriendo los Caminos guardados…</p> : null}
      {errorDeCaminos ? <Tarjeta franja="ambar"><p role="alert" className="text-base text-texto">{errorDeCaminos}</p></Tarjeta> : null}
      <CargadorDeMapa
        enVivo
        consultaGoogle
        principal
        alturaExtendida
        encuadre={CORDOBA_COMPLETA}
        rectangulos={rectangulos}
        anotaciones={anotaciones}
        caminos={dibujo}
        puntoSenalado={puntoSenalado}
        referencia={<ReferenciaDePartes />}
        alTocarCamino={(_lon, _lat, propiedades) => {
          const id = Number(propiedades.camino_id);
          const indice = Number(propiedades.parte_indice);
          if (Number.isInteger(id) && Number.isInteger(indice)) {
            setCaminoTocado({ id, indice });
            guardarZona(null);
          }
        }}
        alSenalarZona={senalarZona}
        fichaSobreElMapa={elegido && caminoTocado ? (
          <FichaDeCamino
            camino={elegido}
            indice={caminoTocado.indice}
            actividad={actividad}
            alSenalarPunto={setPuntoSenalado}
            alCerrar={() => { setCaminoTocado(null); setPuntoSenalado(null); }}
          />
        ) : zonaElegida ? (
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
