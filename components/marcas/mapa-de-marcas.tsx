"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { Boton } from "@/components/ui/boton";
import { Enlace } from "@/components/ui/enlace";
import { Tarjeta } from "@/components/ui/tarjeta";
import { MarcaDeApertura } from "@/components/ui/tarjeta-que-abre";
import { CORDOBA_COMPLETA } from "@/lib/mapas/general";
import type { VistaDelMapa } from "@/lib/mapas/vista";
import { rectangulosDeLineas, type VistaDeLineas } from "@/lib/mapas/lineas-del-territorio";
import type { Anotacion, ActividadRuta, Rectangulo, Sector, Zona } from "@/types/database";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import { dibujarCaminos } from "@/lib/caminos/dibujo";
import { FichaDeCamino } from "@/components/caminos/ficha-de-camino";

type Propiedades = {
  /** Las zonas que se ven: perímetro y nombre, según `lineas`. */
  zonas: Zona[];
  /** Los sectores que se suman cuando `lineas` lo pide. */
  sectores?: Sector[];
  /**
   * Qué líneas de territorio se dibujan. En Consultas abre en zonas; el
   * resto de los mapas que usan esta pieza sigue mostrando solo zonas.
   */
  lineas?: VistaDeLineas;
  /** Los puntos y trazos que se ven. */
  anotaciones: Anotacion[];
  /** Los Caminos que se ven, ya con su línea. */
  caminos?: CaminoGuardado[];
  /** Decide qué clasificación de los Caminos se destaca. */
  actividad: ActividadRuta;
  sectoresPorZona: Record<number, number>;
  /** A qué encuadrar. Sin esto, Córdoba entera. */
  encuadre?: Rectangulo | null;
  /**
   * El lugar exacto que hay que conservar, como al volver de guardar un
   * Camino. Mientras esté, no se usa el encuadre de apertura.
   */
  dondeEstaba?: VistaDelMapa | null;
  /** Sube uno para viajar hasta el encuadre, en vez de saltar. */
  viaje?: number;
  /** Cada vez que el mapa queda quieto, el pedazo que se está viendo. */
  alMirar?: (vista: Rectangulo) => void;
  /** `true` dentro de la lista y mapa, que le da todo su lugar. */
  llenarElLugar?: boolean;
  /**
   * Lo que dice el mapa cuando no hay nada elegido para mirar. Un mapa vacío
   * y mudo hace pensar que se rompió.
   */
  avisoSinNada?: string | null;
};

const SIN_CAMINOS: CaminoGuardado[] = [];

/**
 * **El mapa de las marcas**, el mismo en Consultas y en Marcas: muestra lo que
 * le pasan y abre la ficha de lo que se toca.
 *
 * Tocar un Camino abre su ficha; tocar un punto, la suya (la dibuja el mapa
 * compartido); tocar una zona, su ficha breve, que se abre tocándola entera.
 * La imagen de Google va debajo solo para consultar (decisión 050).
 *
 * Este mapa no lleva la ayuda de colores y líneas. En Consultas no va
 * (decisión 055).
 */
export function MapaDeMarcas({
  zonas,
  sectores = [],
  lineas = "zonas",
  anotaciones,
  caminos = SIN_CAMINOS,
  actividad,
  sectoresPorZona,
  encuadre = null,
  dondeEstaba = null,
  viaje = 0,
  alMirar,
  llenarElLugar = false,
  avisoSinNada = null,
}: Propiedades) {
  const [zonaId, setZonaId] = useState<number | null>(null);
  const [caminoTocado, setCaminoTocado] = useState<{ id: number; indice: number } | null>(null);
  const [puntoSenalado, setPuntoSenalado] = useState<number[] | null>(null);
  const zonaIdRef = useRef<number | null>(null);
  const rectangulos = useMemo(() => rectangulosDeLineas(zonas, sectores, lineas), [zonas, sectores, lineas]);
  const dibujo = useMemo(() => dibujarCaminos(caminos, actividad), [caminos, actividad]);
  const elegido = caminos.find((camino) => camino.id === caminoTocado?.id) ?? null;
  const zonaElegida = zonas.find((zona) => zona.id === zonaId) ?? null;
  const guardarZona = useCallback((id: number | null) => {
    zonaIdRef.current = id;
    setZonaId(id);
  }, []);
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
    <CargadorDeMapa
      enVivo
      consultaGoogle
      principal
      alturaExtendida={!llenarElLugar}
      llenarElLugar={llenarElLugar}
      encuadre={dondeEstaba ? null : (encuadre ?? CORDOBA_COMPLETA)}
      vista={dondeEstaba}
      viaje={viaje}
      alMirar={alMirar}
      rectangulos={rectangulos}
      anotaciones={anotaciones}
      caminos={dibujo}
      puntoSenalado={puntoSenalado}
      alTocarCamino={(_lon, _lat, propiedades) => {
        const id = Number(propiedades.camino_id);
        const indice = Number(propiedades.parte_indice);
        if (Number.isInteger(id) && Number.isInteger(indice)) {
          setCaminoTocado({ id, indice });
          guardarZona(null);
        }
      }}
      alSenalarZona={guardarZona}
      fichaSobreElMapa={elegido && caminoTocado ? (
        <FichaDeCamino
          camino={elegido}
          indice={caminoTocado.indice}
          actividad={actividad}
          alSenalarPunto={setPuntoSenalado}
          alCerrar={() => { setCaminoTocado(null); setPuntoSenalado(null); }}
        />
      ) : zonaElegida ? (
        <div data-ficha-zona className="relative">
          <Enlace href={`/zonas/${zonaElegida.id}`} className="block rounded-2xl"
            aria-label={`Abrir ${zonaElegida.nombre}`}>
            <Tarjeta interactiva className="relative space-y-3 pb-9 pr-16 shadow-[var(--sombra-alta)]">
              <h2 className="line-clamp-2 min-w-0 text-lg font-bold text-texto">{zonaElegida.nombre}</h2>
              <p className="text-base font-medium text-texto">
                {sectoresPorZona[zonaElegida.id] ?? 0} {sectoresPorZona[zonaElegida.id] === 1 ? "sector" : "sectores"}
              </p>
              {zonaElegida.descripcion ? (
                <p className="line-clamp-1 text-base leading-6 text-texto-suave sm:line-clamp-3">{zonaElegida.descripcion}</p>
              ) : null}
              <MarcaDeApertura />
            </Tarjeta>
          </Enlace>
          <Boton variante="fantasma" className="absolute right-2 top-2" aria-label="Cerrar la ficha de la zona"
            onClick={cerrarFicha}>Cerrar</Boton>
        </div>
      ) : avisoSinNada ? (
        <Tarjeta className="shadow-[var(--sombra-alta)]">
          <p role="status" className="text-base text-texto">{avisoSinNada}</p>
        </Tarjeta>
      ) : null}
    />
  );
}
