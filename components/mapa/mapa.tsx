"use client";

import { useEffect, useRef } from "react";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import * as maplibregl from "maplibre-gl";
import {
  capasDelFondo,
  estiloDelMapa,
  iconosDelFondo,
} from "@/components/mapa/capas-base";
import { coloresDelMapa } from "@/components/mapa/colores";
import { useModo } from "@/hooks/use-modo";
import { vibrarAlTocar } from "@/lib/vibracion";
import { registrarElMapaGuardado } from "@/lib/mapas/protocolo";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";
import type { Anotacion, Rectangulo } from "@/types/database";
import "maplibre-gl/dist/maplibre-gl.css";

/**
 * **El único mapa de la app.**
 *
 * Los tres fondos —sin mapa, mapa simple y satelital— son este mismo mapa con
 * distinto fondo. No son tres pantallas. De dónde sale el fondo lo decide un
 * solo archivo, y este componente no lo sabe.
 *
 * **No consulta internet por su cuenta.** Dibuja lo que le pasan y el fondo que
 * le den; si no hay fondo descargado, dibuja sobre el vacío, que es un modo
 * legítimo y no una falla.
 *
 * Se puede acercar con dos dedos, **pero además hay botones grandes**: con
 * guantes puestos un gesto de dos dedos no se acierta.
 */

const FUENTE_RUTA = "ruta";
const FUENTE_POSICION = "mi-posicion";
const FUENTE_ANOTACIONES = "anotaciones";
const FUENTE_RECTANGULOS = "rectangulos";

const VACIO: FeatureCollection = { type: "FeatureCollection", features: [] };

/**
 * La primera capa propia de la app.
 *
 * Las capas del fondo se insertan **antes** de esta, así el mapa queda abajo y
 * la ruta, el GPS y las anotaciones siempre encima.
 */
const PRIMERA_CAPA_DE_LA_APP = "rectangulos-relleno";

export type PosicionEnElMapa = {
  lat: number;
  lon: number;
};

type MapaProps = {
  /** La línea de la ruta. */
  recorrido?: FeatureCollection | null;
  /** Los puntos y trazos dibujados sobre el territorio. */
  anotaciones?: Anotacion[];
  /** Dónde está el usuario, si el GPS está andando. */
  miPosicion?: PosicionEnElMapa | null;
  /** A qué encuadrar al abrir. */
  encuadre?: Rectangulo | null;
  /** El pedazo de mapa que se está definiendo ahora. */
  rectangulo?: Rectangulo | null;
  /** Los pedazos que ya existen, para ver dónde cae el nuevo. */
  rectangulosExistentes?: Rectangulo[];
  /** `true` en la pantalla de navegación, que va a pantalla completa. */
  pantallaCompleta?: boolean;
  className?: string;
};

function comoPoligono(rectangulo: Rectangulo, nuevo: boolean): Feature<Polygon> {
  const { latNorte, latSur, lonEste, lonOeste } = rectangulo;

  return {
    type: "Feature",
    properties: { nuevo },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [lonOeste, latNorte],
          [lonEste, latNorte],
          [lonEste, latSur],
          [lonOeste, latSur],
          [lonOeste, latNorte],
        ],
      ],
    },
  };
}

function limitesDe(rectangulo: Rectangulo): maplibregl.LngLatBoundsLike {
  return [
    [rectangulo.lonOeste, rectangulo.latSur],
    [rectangulo.lonEste, rectangulo.latNorte],
  ];
}

/** Las anotaciones, pasadas a algo que el mapa sepa dibujar. */
function anotacionesComoCapa(anotaciones: Anotacion[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: anotaciones.map((anotacion) => ({
      type: "Feature" as const,
      properties: {
        // Un color elegido a mano es un dato del usuario y manda sobre el del modo.
        color: anotacion.color ?? null,
        titulo: [anotacion.icono, anotacion.comentario].filter(Boolean).join(" · "),
      },
      geometry: anotacion.geometria,
    })),
  };
}

function ponerDatos(
  mapa: maplibregl.Map,
  fuente: string,
  datos: FeatureCollection,
): void {
  const origen = mapa.getSource(fuente);
  if (origen && "setData" in origen) {
    (origen as maplibregl.GeoJSONSource).setData(datos);
  }
}

export function Mapa({
  recorrido = null,
  anotaciones = [],
  miPosicion = null,
  encuadre = null,
  rectangulo = null,
  rectangulosExistentes = [],
  pantallaCompleta = false,
  className = "",
}: MapaProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<maplibregl.Map | null>(null);
  const listoRef = useRef(false);
  /** Lo que se quiso dibujar antes de que el mapa terminara de armarse. */
  const esperandoRef = useRef<Array<() => void>>([]);
  const { modo } = useModo();
  /**
   * El modo actual, para el armado del mapa.
   *
   * El armado corre una sola vez y no puede depender del modo: rearmar el mapa
   * entero cada vez que el usuario toca sol/noche perdería la posición y lo
   * dibujado. Se lee de acá, y el cambio de modo lo maneja su propio efecto.
   */
  const modoRef = useRef(modo);
  useEffect(() => {
    modoRef.current = modo;
  }, [modo]);

  /**
   * Dibuja ahora si el mapa ya está armado, o cuando termine de armarse.
   *
   * Las pantallas piden dibujar apenas tienen los datos, y eso puede pasar
   * antes de que el mapa esté listo. Sin esto, la primera ruta no se ve.
   */
  const cuandoEsteListo = (dibujar: () => void) => {
    if (listoRef.current) dibujar();
    else esperandoRef.current.push(dibujar);
  };

  // Armado del mapa. Una sola vez.
  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current) return;

    // Antes que nada: enseñarle al mapa a leer los pedazos del celular.
    registrarElMapaGuardado();

    const mapa = new maplibregl.Map({
      container: contenedorRef.current,
      style: estiloDelMapa(modoRef.current),
      // Córdoba, para que sin fondo el mapa igual arranque en algún lado.
      center: [-64.5, -31.5],
      zoom: 9,
      attributionControl: false,
      // Los controles propios de la librería son chicos: se usan los de la app.
      dragRotate: false,
    });

    mapa.touchZoomRotate.disableRotation();

    mapa.on("load", () => {
      const colores = coloresDelMapa();

      // El fondo va primero: todo lo de la app se dibuja encima.
      for (const capa of capasDelFondo(modoRef.current)) mapa.addLayer(capa);

      mapa.addSource(FUENTE_RECTANGULOS, { type: "geojson", data: VACIO });
      mapa.addSource(FUENTE_RUTA, { type: "geojson", data: VACIO });
      mapa.addSource(FUENTE_ANOTACIONES, { type: "geojson", data: VACIO });
      mapa.addSource(FUENTE_POSICION, { type: "geojson", data: VACIO });

      mapa.addLayer({
        id: "rectangulos-relleno",
        type: "fill",
        source: FUENTE_RECTANGULOS,
        paint: {
          "fill-color": [
            "case",
            ["get", "nuevo"],
            colores.rectanguloNuevo,
            colores.rectanguloExistente,
          ],
          "fill-opacity": 0.14,
        },
      });

      mapa.addLayer({
        id: "rectangulos-borde",
        type: "line",
        source: FUENTE_RECTANGULOS,
        paint: {
          "line-color": [
            "case",
            ["get", "nuevo"],
            colores.rectanguloNuevo,
            colores.rectanguloExistente,
          ],
          "line-width": ["case", ["get", "nuevo"], 3, 2],
        },
      });

      mapa.addLayer({
        id: "anotaciones-trazo",
        type: "line",
        source: FUENTE_ANOTACIONES,
        filter: ["==", ["geometry-type"], "LineString"],
        paint: {
          "line-color": ["coalesce", ["get", "color"], colores.anotacion],
          "line-width": 3,
          "line-opacity": 0.95,
        },
      });

      mapa.addLayer({
        id: "ruta-linea",
        type: "line",
        source: FUENTE_RUTA,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": colores.linea,
          "line-width": 5,
          "line-opacity": 0.95,
        },
      });

      mapa.addLayer({
        id: "anotaciones-punto",
        type: "circle",
        source: FUENTE_ANOTACIONES,
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": 7,
          "circle-color": ["coalesce", ["get", "color"], colores.anotacion],
          "circle-stroke-width": 2,
          "circle-stroke-color": colores.contorno,
        },
      });

      mapa.addLayer({
        id: "mi-posicion-punto",
        type: "circle",
        source: FUENTE_POSICION,
        paint: {
          "circle-radius": 10,
          "circle-color": colores.gps,
          "circle-stroke-width": 3,
          "circle-stroke-color": colores.contorno,
        },
      });

      listoRef.current = true;
      for (const dibujar of esperandoRef.current) dibujar();
      esperandoRef.current = [];
    });

    mapaRef.current = mapa;

    return () => {
      listoRef.current = false;
      esperandoRef.current = [];
      mapa.remove();
      mapaRef.current = null;
    };
  }, []);

  // Los colores se vuelven a leer al cambiar de modo sol a modo noche.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;

    const pintar = () => {
      if (!mapa.getLayer("ruta-linea")) return;
      const colores = coloresDelMapa();

      /**
       * El fondo se cambia capa por capa, no rearmando el estilo.
       *
       * Rearmar el estilo se lleva puestas las capas de la app —la ruta, el
       * GPS, las anotaciones— y habría que volver a dibujarlas todas. Sacar y
       * poner las del fondo deja intacto todo lo demás.
       */
      for (const vieja of capasDelFondo(modo === "sol" ? "noche" : "sol")) {
        if (mapa.getLayer(vieja.id)) mapa.removeLayer(vieja.id);
      }
      for (const nueva of capasDelFondo(modo)) {
        if (!mapa.getLayer(nueva.id)) mapa.addLayer(nueva, PRIMERA_CAPA_DE_LA_APP);
      }
      mapa.setSprite(iconosDelFondo(modo));

      mapa.setPaintProperty("ruta-linea", "line-color", colores.linea);
      mapa.setPaintProperty("mi-posicion-punto", "circle-color", colores.gps);
      mapa.setPaintProperty("mi-posicion-punto", "circle-stroke-color", colores.contorno);
      mapa.setPaintProperty("anotaciones-punto", "circle-stroke-color", colores.contorno);
      mapa.setPaintProperty("anotaciones-punto", "circle-color", [
        "coalesce",
        ["get", "color"],
        colores.anotacion,
      ]);
      mapa.setPaintProperty("anotaciones-trazo", "line-color", [
        "coalesce",
        ["get", "color"],
        colores.anotacion,
      ]);
      mapa.setPaintProperty("rectangulos-relleno", "fill-color", [
        "case",
        ["get", "nuevo"],
        colores.rectanguloNuevo,
        colores.rectanguloExistente,
      ]);
      mapa.setPaintProperty("rectangulos-borde", "line-color", [
        "case",
        ["get", "nuevo"],
        colores.rectanguloNuevo,
        colores.rectanguloExistente,
      ]);
    };

    cuandoEsteListo(pintar);
  }, [modo]);

  // La línea de la ruta.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;

    const poner = () => {
      ponerDatos(mapa, FUENTE_RUTA, recorrido ?? VACIO);

      if (encuadre) {
        mapa.fitBounds(limitesDe(encuadre), { padding: 28, animate: false });
      }
    };

    cuandoEsteListo(poner);
  }, [recorrido, encuadre]);

  // Los puntos y trazos.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;

    const poner = () =>
      ponerDatos(mapa, FUENTE_ANOTACIONES, anotacionesComoCapa(anotaciones));

    cuandoEsteListo(poner);
  }, [anotaciones]);

  // Los pedazos de mapa: el que se está definiendo y los que ya existen.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;

    const poner = () => {
      const features = [
        ...rectangulosExistentes.map((cada) => comoPoligono(cada, false)),
        ...(rectangulo ? [comoPoligono(rectangulo, true)] : []),
      ];

      ponerDatos(mapa, FUENTE_RECTANGULOS, {
        type: "FeatureCollection",
        features,
      });

      if (rectangulo) {
        mapa.fitBounds(limitesDe(rectangulo), { padding: 36, animate: false });
      }
    };

    cuandoEsteListo(poner);
  }, [rectangulo, rectangulosExistentes]);

  // Dónde estoy.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;

    const poner = () =>
      ponerDatos(
        mapa,
        FUENTE_POSICION,
        miPosicion
          ? {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "Point",
                    coordinates: [miPosicion.lon, miPosicion.lat],
                  },
                },
              ],
            }
          : VACIO,
      );

    cuandoEsteListo(poner);
  }, [miPosicion]);

  const acercar = (cuanto: number) => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    mapa.easeTo({ zoom: mapa.getZoom() + cuanto, duration: 180 });
  };

  return (
    <div
      className={[
        "relative overflow-hidden bg-mapa-fondo",
        pantallaCompleta
          ? "h-full w-full"
          : "h-64 w-full rounded-xl border border-borde sm:h-80",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div ref={contenedorRef} className="h-full w-full" />

      {/*
        El acercar de dos dedos es un gesto fino: con guantes no se acierta.
        Por eso están estos, y son grandes.
      */}
      <div className="absolute right-3 top-3 flex flex-col gap-2">
        <BotonDelMapa
          etiqueta="Acercar el mapa"
          grande={pantallaCompleta}
          alTocar={() => acercar(1)}
        >
          <path d="M12 5v14M5 12h14" />
        </BotonDelMapa>
        <BotonDelMapa
          etiqueta="Alejar el mapa"
          grande={pantallaCompleta}
          alTocar={() => acercar(-1)}
        >
          <path d="M5 12h14" />
        </BotonDelMapa>
      </div>
    </div>
  );
}

function BotonDelMapa({
  etiqueta,
  grande,
  alTocar,
  children,
}: {
  etiqueta: string;
  grande: boolean;
  alTocar: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      onPointerDown={() => vibrarAlTocar()}
      onClick={alTocar}
      className={[
        CLASE_DE_RESPUESTA_AL_TOQUE,
        "flex items-center justify-center rounded-full",
        "border border-borde-fuerte bg-superficie text-texto shadow-[var(--sombra-alta)]",
        "hover:bg-superficie-alta",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde",
        grande ? "h-16 w-16" : "h-14 w-14",
      ].join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        className={grande ? "h-7 w-7" : "h-6 w-6"}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        aria-hidden
      >
        {children}
      </svg>
    </button>
  );
}
