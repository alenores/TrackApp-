"use client";

import { useEffect, useRef, useState } from "react";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import * as maplibregl from "maplibre-gl";
import {
  capasDelFondo,
  estiloDelMapa,
  iconosDelFondo,
  QUIEN_HIZO_LA_FOTO,
  todasLasCapasDelFondo,
  type TipoDeFondo,
} from "@/components/mapa/capas-base";
import { coloresDelMapa } from "@/components/mapa/colores";
import { useModo } from "@/hooks/use-modo";
import type { Modo } from "@/lib/modo";
import { vibrarAlTocar } from "@/lib/vibracion";
import { prepararElMotorDelMapa } from "@/lib/mapas/motor";
import { registrarElMapaGuardado } from "@/lib/mapas/protocolo";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";
import { rectanguloQueAbarca } from "@/lib/datos/rectangulo";
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

/**
 * Pone el fondo del mapa **debajo** de todo lo de la app.
 *
 * **Si el fondo falla, la app sigue dibujando.** La línea de la ruta, el punto
 * del GPS y los recuadros no pueden depender de que el fondo se arme bien: son
 * lo que de verdad hace falta para no perderse, y el fondo es un lujo. Por eso
 * esto va aparte, envuelto, y devuelve el motivo en vez de tirar.
 */
function ponerElFondo(
  mapa: maplibregl.Map,
  modo: Modo,
  tipo: TipoDeFondo,
): string | null {
  try {
    for (const vieja of todasLasCapasDelFondo(modo)) {
      if (mapa.getLayer(vieja.id)) mapa.removeLayer(vieja.id);
    }

    const debajoDe = mapa.getLayer(PRIMERA_CAPA_DE_LA_APP)
      ? PRIMERA_CAPA_DE_LA_APP
      : undefined;

    for (const capa of capasDelFondo(modo, tipo)) mapa.addLayer(capa, debajoDe);

    mapa.setSprite(iconosDelFondo(modo));
    return null;
  } catch (error) {
    return error instanceof Error && error.message
      ? error.message
      : "el fondo del mapa no se pudo armar";
  }
}

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
  /**
   * `true` cuando el mapa es lo principal de la pantalla y hay lugar.
   *
   * En el celular queda igual de alto que siempre; en la computadora se estira
   * hasta ocupar casi toda la altura, que es donde se necesita ver.
   */
  grande?: boolean;
  /**
   * `true` mientras el usuario está marcando el rectángulo sobre el mapa.
   *
   * Arrastrar deja de mover el mapa y pasa a dibujar. Es para la computadora,
   * que es donde se arman las zonas y los sectores: sentado, con conexión y con
   * mouse. En el cerro esto no existe.
   */
  dibujando?: boolean;
  /** Se llama con el rectángulo mientras se lo marca y al soltarlo. */
  alDibujar?: (rectangulo: Rectangulo) => void;
  /**
   * `true` para traer el fondo en vivo.
   *
   * Va en las pantallas de administrar: zonas, sectores y rutas. **Esas se usan
   * sentado en la computadora, con conexión**, y no tienen ningún sentido sin
   * ella. La única pantalla que trabaja sin señal es la de navegar.
   */
  enVivo?: boolean;
  className?: string;
};

function comoPoligono(
  rectangulo: Rectangulo,
  nuevo: boolean,
): Feature<Polygon> {
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
        titulo: [anotacion.icono, anotacion.comentario]
          .filter(Boolean)
          .join(" · "),
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
  grande = false,
  dibujando = false,
  alDibujar,
  enVivo = false,
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
  /** Qué salió mal con el fondo, si algo salió mal. Se muestra: no se traga. */
  const [avisoDelFondo, setAvisoDelFondo] = useState<string | null>(null);
  /**
   * Si el mapa terminó de armarse.
   *
   * **Un mapa que no termina de armarse no se distingue de uno vacío**: los dos
   * son un rectángulo del color del fondo. Sin esto, el usuario no sabe si está
   * esperando o si se rompió algo, y quien tiene que arreglarlo tampoco.
   */
  const [armado, setArmado] = useState(false);
  /** Dibujo o foto del terreno. La foto solo existe con internet. */
  const [tipoDeFondo, setTipoDeFondo] = useState<TipoDeFondo>("dibujo");
  /** Cuántas cosas hay dibujadas encima del fondo. */
  const [dibujado, setDibujado] = useState(0);
  /** Se lee una sola vez, al armar el mapa: no cambia mientras está abierto. */
  const enVivoRef = useRef(enVivo);
  const tipoDeFondoRef = useRef<TipoDeFondo>("dibujo");
  useEffect(() => {
    tipoDeFondoRef.current = tipoDeFondo;
  }, [tipoDeFondo]);
  /** Mientras se dibuja, el mapa no se reencuadra: pelearía con el mouse. */
  const dibujandoRef = useRef(dibujando);
  /**
   * Si la pantalla dijo a qué encuadrar, el rectángulo no la contradice.
   *
   * Al editar un sector, encuadrar al sector lo deja llenando la pantalla y
   * deja la zona afuera: el usuario pierde la única referencia que le dice si
   * el sector está donde tiene que estar.
   */
  const hayEncuadreRef = useRef(encuadre !== null);
  useEffect(() => {
    hayEncuadreRef.current = encuadre !== null;
  }, [encuadre]);
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

    // Antes que nada, las dos cosas sin las cuales el mapa no dibuja nada:
    // decirle dónde está la parte de su motor que procesa los datos, y
    // enseñarle a leer los pedazos guardados en el celular.
    prepararElMotorDelMapa();
    registrarElMapaGuardado();

    const mapa = new maplibregl.Map({
      container: contenedorRef.current,
      style: estiloDelMapa(modoRef.current, enVivoRef.current),
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

      // Lo de la app ya está: de acá en adelante todo lo pendiente se dibuja,
      // pase lo que pase con el fondo.
      setArmado(true);
      listoRef.current = true;
      for (const dibujar of esperandoRef.current) dibujar();
      esperandoRef.current = [];

      setAvisoDelFondo(ponerElFondo(mapa, modoRef.current, tipoDeFondoRef.current));
    });

    // Un fondo que no carga no puede quedarse callado.
    mapa.on("error", (evento) => {
      const motivo = evento?.error?.message;
      if (motivo) setAvisoDelFondo(motivo);
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

      // El fondo se cambia capa por capa, no rearmando el estilo: rearmarlo se
      // lleva puestas las capas de la app y habría que volver a dibujarlas.
      setAvisoDelFondo(ponerElFondo(mapa, modo, tipoDeFondo));

      mapa.setPaintProperty("ruta-linea", "line-color", colores.linea);
      mapa.setPaintProperty("mi-posicion-punto", "circle-color", colores.gps);
      mapa.setPaintProperty(
        "mi-posicion-punto",
        "circle-stroke-color",
        colores.contorno,
      );
      mapa.setPaintProperty(
        "anotaciones-punto",
        "circle-stroke-color",
        colores.contorno,
      );
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
  }, [modo, tipoDeFondo]);

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

  /**
   * Marcar el rectángulo arrastrando sobre el mapa.
   *
   * **Mientras el modo está prendido, arrastrar deja de mover el mapa.** Es a
   * propósito: si hiciera las dos cosas a la vez, nunca se sabría cuál de las
   * dos va a pasar. Para mover el mapa se apaga el modo.
   *
   * Va avisando el rectángulo **mientras** se arrastra, no solo al soltar, así
   * se ve crecer y los números de tamaño y peso acompañan.
   */
  useEffect(() => {
    dibujandoRef.current = dibujando;

    const mapa = mapaRef.current;
    if (!mapa || !dibujando || !alDibujar) return;

    mapa.dragPan.disable();
    mapa.doubleClickZoom.disable();
    mapa.getCanvas().style.cursor = "crosshair";

    let desde: maplibregl.LngLat | null = null;

    const armar = (hasta: maplibregl.LngLat): Rectangulo | null => {
      if (!desde) return null;
      return rectanguloQueAbarca([
        [desde.lng, desde.lat],
        [hasta.lng, hasta.lat],
      ]);
    };

    const empezar = (evento: { lngLat: maplibregl.LngLat }) => {
      desde = evento.lngLat;
    };

    const mover = (evento: { lngLat: maplibregl.LngLat }) => {
      const armado = armar(evento.lngLat);
      if (armado) alDibujar(armado);
    };

    const soltar = (evento: { lngLat: maplibregl.LngLat }) => {
      const armado = armar(evento.lngLat);
      if (armado) alDibujar(armado);
      desde = null;
    };

    mapa.on("mousedown", empezar);
    mapa.on("mousemove", mover);
    mapa.on("mouseup", soltar);
    mapa.on("touchstart", empezar);
    mapa.on("touchmove", mover);
    mapa.on("touchend", soltar);

    return () => {
      mapa.off("mousedown", empezar);
      mapa.off("mousemove", mover);
      mapa.off("mouseup", soltar);
      mapa.off("touchstart", empezar);
      mapa.off("touchmove", mover);
      mapa.off("touchend", soltar);
      mapa.dragPan.enable();
      mapa.doubleClickZoom.enable();
      mapa.getCanvas().style.cursor = "";
      dibujandoRef.current = false;
    };
  }, [dibujando, alDibujar]);

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
      setDibujado(features.length);

      /**
       * El mapa se reencuadra **solo si hace falta**.
       *
       * Si el rectángulo ya se ve, la cámara no se toca: reencuadrar en cada
       * cambio le saca al usuario lo que estaba mirando. Al marcar sobre el
       * mapa eso sería peor todavía, porque al soltar perdería de vista la zona
       * entera y se quedaría sin la referencia que necesita.
       *
       * Si en cambio el rectángulo quedó fuera de la vista —pasa al pegar unas
       * coordenadas de otro lado— el mapa va hasta ahí, porque si no el usuario
       * no vería nada y creería que se rompió.
       */
      if (rectangulo && !hayEncuadreRef.current) {
        const centro = {
          lng: (rectangulo.lonOeste + rectangulo.lonEste) / 2,
          lat: (rectangulo.latNorte + rectangulo.latSur) / 2,
        };

        if (!mapa.getBounds().contains(centro)) {
          mapa.fitBounds(limitesDe(rectangulo), { padding: 36, animate: false });
        }
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
          : grande
            ? "h-72 w-full rounded-xl border border-borde sm:h-96 lg:h-[calc(100vh-13rem)]"
            : "h-64 w-full rounded-xl border border-borde sm:h-80",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div ref={contenedorRef} className="h-full w-full" />

      {/*
        El fondo puede fallar y la app sigue andando, pero el usuario tiene que
        saberlo: si no, ve un mapa vacío y no sabe si es que no bajó nada o si
        se rompió algo.
      */}
      {!armado ? (
        <p className="absolute inset-x-3 bottom-3 rounded-xl border border-borde bg-superficie px-3 py-2 text-sm leading-6 text-texto-suave">
          Armando el mapa…
        </p>
      ) : avisoDelFondo ? (
        <p className="absolute inset-x-3 bottom-3 rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-2 text-sm leading-6 text-ambar-texto">
          El fondo del mapa no se pudo dibujar: {avisoDelFondo} Lo que ves —la
          ruta, tu posición y los recuadros— sigue siendo correcto.
        </p>
      ) : dibujado === 0 && !recorrido ? (
        <p className="absolute inset-x-3 bottom-3 rounded-xl border border-borde bg-superficie px-3 py-2 text-sm leading-6 text-texto-suave">
          El mapa está armado pero no hay nada que dibujar todavía.
        </p>
      ) : null}

      {/*
        Dibujo o foto del terreno. Solo aparece con el mapa en vivo: la foto no
        se descarga nunca, así que sin internet no hay nada que elegir.
      */}
      {enVivo ? (
        <div className="absolute left-3 top-3 flex overflow-hidden rounded-xl border border-borde-fuerte bg-superficie shadow-[var(--sombra-alta)]">
          {(
            [
              ["dibujo", "Dibujo"],
              ["satelital", "Foto"],
            ] as const
          ).map(([cual, etiqueta]) => (
            <button
              key={cual}
              type="button"
              onClick={() => setTipoDeFondo(cual)}
              aria-pressed={tipoDeFondo === cual}
              className={[
                "min-h-14 px-4 text-base font-semibold transition-colors",
                tipoDeFondo === cual
                  ? "bg-acento text-acento-texto"
                  : "text-texto-suave hover:bg-superficie-alta hover:text-texto",
              ].join(" ")}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      ) : null}

      {/* Quien hizo la foto. Su licencia obliga a decirlo. */}
      {enVivo && tipoDeFondo === "satelital" ? (
        <p className="pointer-events-none absolute bottom-1 left-2 text-[11px] leading-4 text-texto-suave">
          {QUIEN_HIZO_LA_FOTO}
        </p>
      ) : null}

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
