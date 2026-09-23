"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Feature, FeatureCollection, Point, Polygon } from "geojson";
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
import { NIVEL_DEL_MAPA_EN_GRANDE } from "@/lib/capas";
import { useCerrarConAtras } from "@/hooks/use-cerrar-con-atras";
import type { RectanguloEnElMapa } from "@/lib/mapas/rectangulos";
import { useModo } from "@/hooks/use-modo";
import { BotonDeModo } from "@/components/ui/boton-de-modo";
import type { Modo } from "@/lib/modo";
import { vibrarAlTocar } from "@/lib/vibracion";
import { prepararElMotorDelMapa } from "@/lib/mapas/motor";
import { registrarElMapaGuardado } from "@/lib/mapas/protocolo";
import { registrarElRelieveGuardado } from "@/lib/mapas/relieve";
import {
  ALTURAS,
  capasDeRelieve,
  CURVAS_FINAS,
  CURVAS_GRUESAS,
  FUENTE_DE_LAS_CURVAS,
  fuenteDeLasCurvas,
} from "@/components/mapa/capas-de-relieve";
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
/**
 * Las curvas de nivel van entre el fondo y lo de la app, cuando las hay. En el
 * mapa en vivo no las hay: se leen solo de lo guardado, y ahí no hay nada.
 */
const CAPAS_DE_LA_APP_DE_ABAJO_HACIA_ARRIBA = [CURVAS_FINAS, "rectangulos-relleno"];

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

    const debajoDe = CAPAS_DE_LA_APP_DE_ABAJO_HACIA_ARRIBA.find((capa) => mapa.getLayer(capa));

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
  /**
   * Los rectángulos dibujados, cada uno con su clase.
   *
   * La clase decide el color y el trazo: la zona va gris y punteada porque es
   * una referencia; el sector bajado en verde y el que falta en ámbar, que es
   * lo que le importa a quien mira si puede salir.
   */
  rectangulos?: RectanguloEnElMapa[];
  /**
   * Lo que explica los colores del mapa.
   *
   * Va adentro del mapa y no al lado, así viaja con él cuando se abre en
   * grande: sin la referencia los recuadros son manchas.
   */
  referencia?: ReactNode;
  /** `true` en la pantalla de navegación, que va a pantalla completa. */
  pantallaCompleta?: boolean;
  /**
   * `true` cuando el mapa es lo principal de la pantalla y hay lugar.
   *
   * En el celular queda igual de alto que siempre; en la computadora se estira
   * hasta ocupar casi toda la altura, que es donde se necesita ver.
   */
  principal?: boolean;
  /** Controles propios de quien usa el mapa, que viajan a pantalla completa. */
  controlesAdicionales?: ReactNode;
  /** Función para cerrar cuando está en pantalla completa externa (ej. navegación). */
  alCerrarPantallaCompleta?: () => void;
  /** Cambiar este número fuerza al mapa a centrarse en la posición actual. */
  forzarCentradoEn?: number;
  /** Fondo inicial al abrir el mapa, por defecto dibujo. */
  fondoInicial?: TipoDeFondo;
  /** Se llama cuando el usuario cambia el tipo de fondo. */
  alCambiarFondo?: (fondo: TipoDeFondo) => void;
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
   * `true` mientras el usuario está eligiendo un punto sobre el mapa.
   *
   * Un toque y listo. Es para marcar dónde está un vado, un cruce o un
   * refugio, en la computadora.
   */
  marcandoPunto?: boolean;
  /** Se llama con el lugar tocado. */
  alMarcarPunto?: (lon: number, lat: number) => void;
  /** Se llama con el número de la anotación que el usuario tocó. */
  alTocarAnotacion?: (anotacionId: number) => void;
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
  clase: string,
): Feature<Polygon> {
  const { latNorte, latSur, lonEste, lonOeste } = rectangulo;

  return {
    type: "Feature",
    properties: { clase },
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

function comoPuntoEtiqueta(
  rectangulo: Rectangulo,
  etiqueta: string,
): Feature<Point> {
  const { latNorte, latSur, lonEste, lonOeste } = rectangulo;
  return {
    type: "Feature",
    properties: { etiqueta },
    geometry: {
      type: "Point",
      coordinates: [(lonOeste + lonEste) / 2, (latNorte + latSur) / 2],
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
        // El número, para poder abrir la anotación al tocarla en el mapa.
        id: anotacion.id,
        // Un color elegido a mano es un dato del usuario y manda sobre el del modo.
        color: anotacion.color ?? null,
        titulo: [anotacion.icono, anotacion.comentario]
          .filter(Boolean)
          .join(" · "),
        icono: anotacion.icono ?? "cruce",
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
  const source = mapa.getSource(fuente) as maplibregl.GeoJSONSource | undefined;
  if (source) source.setData(datos);
}

export function Mapa({
  recorrido = null,
  anotaciones = [],
  miPosicion = null,
  encuadre = null,
  rectangulo = null,
  rectangulos = [],
  referencia = null,
  pantallaCompleta = false,
  principal = false,
  controlesAdicionales = null,
  alCerrarPantallaCompleta,
  forzarCentradoEn,
  fondoInicial = "dibujo",
  alCambiarFondo,
  dibujando = false,
  alDibujar,
  marcandoPunto = false,
  alMarcarPunto,
  alTocarAnotacion,
  enVivo = false,
  className = "",
}: MapaProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<maplibregl.Map | null>(null);
  const marcadoresDeEtiquetasRef = useRef<maplibregl.Marker[]>([]);
  const listoRef = useRef(false);

  // ===========================================================================
  // ESTADOS Y EFECTOS
  // ===========================================================================

  const [gpsPrendido, setGpsPrendido] = useState(false);
  const [posicionPropia, setPosicionPropia] = useState<PosicionEnElMapa | null>(null);
  const vigilanciaRef = useRef<number | null>(null);
  
  const primeraVezRef = useRef(true);

  const posicionEfectiva = miPosicion || posicionPropia;

  // Apagar el GPS al cerrar el mapa
  useEffect(() => {
    return () => {
      if (vigilanciaRef.current !== null) {
        navigator.geolocation.clearWatch(vigilanciaRef.current);
      }
    };
  }, []);

  const alternarGps = useCallback(() => {
    if (gpsPrendido) {
      if (posicionPropia && mapaRef.current) {
        // Si ya está prendido, al tocar de nuevo simplemente se centra.
        mapaRef.current.flyTo({ center: [posicionPropia.lon, posicionPropia.lat], zoom: mapaRef.current.getZoom() > 14 ? mapaRef.current.getZoom() : 14 });
      }
    } else {
      if (!navigator.geolocation) return;
      setGpsPrendido(true);
      primeraVezRef.current = true;
      vigilanciaRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setPosicionPropia({ lat, lon });
          
          if (primeraVezRef.current && mapaRef.current) {
            primeraVezRef.current = false;
            mapaRef.current.flyTo({ center: [lon, lat], zoom: 14 });
          }
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error);
        },
        { enableHighAccuracy: true }
      );
    }
  }, [gpsPrendido, posicionPropia]);

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
  const [tipoDeFondo, setTipoDeFondo] = useState<TipoDeFondo>(fondoInicial);
  const [aPantallaCompleta, setAPantallaCompleta] = useState(false);
  /**
   * Qué pedazo de mundo se veía justo antes de cambiar de tamaño.
   *
   * Solo se usa cuando la pantalla no dijo a qué encuadrar: en las de armar
   * zonas y sectores, donde el usuario anda buscando el lugar a mano.
   */
  const loQueSeMirabaRef = useRef<maplibregl.LngLatBoundsLike | null>(null);

  const anotarLoQueSeMira = () => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    const limites = mapa.getBounds();
    loQueSeMirabaRef.current = [
      [limites.getWest(), limites.getSouth()],
      [limites.getEast(), limites.getNorth()],
    ];
  };

  const cerrarLoGrande = useCallback(() => {
    const mapa = mapaRef.current;
    if (mapa) {
      const limites = mapa.getBounds();
      loQueSeMirabaRef.current = [
        [limites.getWest(), limites.getSouth()],
        [limites.getEast(), limites.getNorth()],
      ];
    }
    setAPantallaCompleta(false);
  }, []);
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
  const encuadreRef = useRef<maplibregl.LngLatBoundsLike | null>(null);
  useEffect(() => {
    hayEncuadreRef.current = encuadre !== null;
    encuadreRef.current = encuadre ? limitesDe(encuadre) : null;
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
    registrarElRelieveGuardado();

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
      mapa.addSource("etiquetas", { type: "geojson", data: VACIO });
      mapa.addSource(FUENTE_RUTA, { type: "geojson", data: VACIO });
      mapa.addSource(FUENTE_ANOTACIONES, { type: "geojson", data: VACIO });
      mapa.addSource(FUENTE_POSICION, { type: "geojson", data: VACIO });
      mapa.addSource("punto-de-ajuste", { type: "geojson", data: VACIO });

      // Las curvas van primero: debajo de todo lo de la app, encima del fondo.
      // Solo cuando el mapa lee lo guardado: en vivo no hay relieve.
      if (!enVivoRef.current) {
        mapa.addSource(FUENTE_DE_LAS_CURVAS, fuenteDeLasCurvas());
        for (const capa of capasDeRelieve(colores)) mapa.addLayer(capa);
      }

      mapa.addLayer({
        id: "rectangulos-relleno",
        type: "fill",
        source: FUENTE_RECTANGULOS,
        // La zona y el sector no se rellenan: son referencias territoriales, y un relleno
        // taparía el terreno que justamente se quiere mirar.
        filter: ["all", ["!=", ["get", "clase"], "zona"], ["!=", ["get", "clase"], "sector"]],
        paint: {
          "fill-color": [
            "match",
            ["get", "clase"],
            "nuevo", colores.rectanguloNuevo,
            "sector_bajado", colores.rectanguloBajado,
            "sector_sin_bajar", colores.rectanguloSinBajar,
            colores.rectanguloExistente,
          ],
          "fill-opacity": 0.14,
        },
      });

      // El borde de la zona va punteado, y el punteado no se puede decidir por
      // rectángulo dentro de una misma capa. Por eso son dos.
      mapa.addLayer({
        id: "rectangulos-borde-zona",
        type: "line",
        source: FUENTE_RECTANGULOS,
        filter: ["==", ["get", "clase"], "zona"],
        paint: {
          "line-color": colores.rectanguloZona,
          "line-width": 2,
          "line-dasharray": [3, 2.2],
        },
      });

      mapa.addLayer({
        id: "rectangulos-borde",
        type: "line",
        source: FUENTE_RECTANGULOS,
        filter: ["!=", ["get", "clase"], "zona"],
        paint: {
          "line-color": [
            "match",
            ["get", "clase"],
            "nuevo", colores.rectanguloNuevo,
            "sector", colores.rectanguloNuevo, // Usamos el color llamativo (dato) para el sector
            "sector_bajado", colores.rectanguloBajado,
            "sector_sin_bajar", colores.rectanguloSinBajar,
            colores.rectanguloExistente,
          ],
          "line-width": ["case", ["==", ["get", "clase"], "nuevo"], 3, 2.4],
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
          "line-color": ["coalesce", ["get", "color"], colores.linea],
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
        id: "anotaciones-punto-icono",
        type: "symbol",
        source: FUENTE_ANOTACIONES,
        filter: ["all", ["==", ["geometry-type"], "Point"], ["has", "icono"]],
        layout: {
          "icon-image": [
            "match",
            ["get", "icono"],
            "refugio", "alpine_hut",
            "cumbre", "peak",
            "pueblo", "townspot",
            "fuente", "spring",
            "mirador", "viewpoint",
            "iglesia", "place_of_worship",
            "arroyo", "arroyo",
            "cascada", "cascada",
            "puente", "puente",
            "cartel", "cartel",
            "cruce", "cruce",
            "tranquera", "tranquera",
            "none"
          ],
          "icon-size": 1.2,
          "icon-allow-overlap": true,
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

      mapa.addLayer({
        id: "punto-de-ajuste",
        type: "circle",
        source: "punto-de-ajuste",
        paint: {
          "circle-radius": 6,
          "circle-color": colores.rectanguloNuevo,
          "circle-stroke-width": 2,
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
            "match",
            ["get", "clase"],
            "nuevo", colores.rectanguloNuevo,
            "sector_bajado", colores.rectanguloBajado,
            "sector_sin_bajar", colores.rectanguloSinBajar,
            colores.rectanguloExistente,
          ]);
      mapa.setPaintProperty("rectangulos-borde", "line-color", [
            "match",
            ["get", "clase"],
            "nuevo", colores.rectanguloNuevo,
            "sector", colores.rectanguloNuevo, // Mantenemos el color llamativo (dato) para el sector
            "sector_bajado", colores.rectanguloBajado,
            "sector_sin_bajar", colores.rectanguloSinBajar,
            colores.rectanguloExistente,
          ]);
      mapa.setPaintProperty(
        "rectangulos-borde-zona",
        "line-color",
        colores.rectanguloZona,
      );

      if (mapa.getLayer("rectangulos-texto")) {
        mapa.setPaintProperty("rectangulos-texto", "text-color", colores.rectanguloZona);
        mapa.setPaintProperty("rectangulos-texto", "text-halo-color", colores.contorno);
      }

      if (mapa.getLayer(ALTURAS)) {
        for (const capa of [CURVAS_FINAS, CURVAS_GRUESAS]) {
          mapa.setPaintProperty(capa, "line-color", colores.curva);
        }
        mapa.setPaintProperty(ALTURAS, "text-color", colores.curva);
        mapa.setPaintProperty(ALTURAS, "text-halo-color", colores.contorno);
      }
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

    let puntoFijo: maplibregl.LngLat | null = null;
    let arrastrando = false;

    const armarDesdeFijo = (hasta: maplibregl.LngLat): Rectangulo | null => {
      if (!puntoFijo) return null;
      return rectanguloQueAbarca([
        [puntoFijo.lng, puntoFijo.lat],
        [hasta.lng, hasta.lat],
      ]);
    };

    const imantar = (punto: maplibregl.LngLat, puntoPantalla: { x: number, y: number }): maplibregl.LngLat => {
      let nuevaLat = punto.lat;
      let nuevaLng = punto.lng;
      const UMBRAL_PX = 15;

      for (const capa of rectangulos) {
        const { latNorte, latSur, lonEste, lonOeste } = capa.rectangulo;

        // Snapping de Latitud (eje Y en pantalla)
        const pxNorte = mapa.project([punto.lng, latNorte]).y;
        if (Math.abs(puntoPantalla.y - pxNorte) < UMBRAL_PX) nuevaLat = latNorte;

        const pxSur = mapa.project([punto.lng, latSur]).y;
        if (Math.abs(puntoPantalla.y - pxSur) < UMBRAL_PX) nuevaLat = latSur;

        // Snapping de Longitud (eje X en pantalla)
        const pxEste = mapa.project([lonEste, punto.lat]).x;
        if (Math.abs(puntoPantalla.x - pxEste) < UMBRAL_PX) nuevaLng = lonEste;

        const pxOeste = mapa.project([lonOeste, punto.lat]).x;
        if (Math.abs(puntoPantalla.x - pxOeste) < UMBRAL_PX) nuevaLng = lonOeste;
      }

      return new maplibregl.LngLat(nuevaLng, nuevaLat);
    };

    const manejarPuntoDeAjuste = (ajustado: maplibregl.LngLat, original: maplibregl.LngLat) => {
      if (ajustado.lat !== original.lat || ajustado.lng !== original.lng) {
        ponerDatos(mapa, "punto-de-ajuste", {
          type: "FeatureCollection",
          features: [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [ajustado.lng, ajustado.lat] } }]
        });
      } else {
        ponerDatos(mapa, "punto-de-ajuste", VACIO);
      }
    };

    const empezar = (evento: { lngLat: maplibregl.LngLat, point: { x: number, y: number } }) => {
      arrastrando = true;
      const ajustado = imantar(evento.lngLat, evento.point);
      
      if (!puntoFijo) {
        puntoFijo = ajustado;
        manejarPuntoDeAjuste(puntoFijo, evento.lngLat);
      }
    };

    const mover = (evento: { lngLat: maplibregl.LngLat, point: { x: number, y: number } }) => {
      if (!puntoFijo) return;
      const ajustado = imantar(evento.lngLat, evento.point);
      manejarPuntoDeAjuste(ajustado, evento.lngLat);
      const armado = armarDesdeFijo(ajustado);
      if (armado) alDibujar(armado);
    };

    const soltar = (evento: { lngLat: maplibregl.LngLat, point: { x: number, y: number } }) => {
      if (!arrastrando) return;
      arrastrando = false;
      const ajustado = imantar(evento.lngLat, evento.point);
      
      // Si soltó exactamente donde empezó, es un click para fijar el primer punto.
      if (puntoFijo && Math.abs(ajustado.lat - puntoFijo.lat) < 0.00001 && Math.abs(ajustado.lng - puntoFijo.lng) < 0.00001) {
        // Feedback extra para el primer punto
        ponerDatos(mapa, "punto-de-ajuste", {
          type: "FeatureCollection",
          features: [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [puntoFijo.lng, puntoFijo.lat] } }]
        });
      } else {
        // Arrastró o es el segundo click. Terminamos.
        const armado = armarDesdeFijo(ajustado);
        if (armado) alDibujar(armado);
        puntoFijo = null;
        ponerDatos(mapa, "punto-de-ajuste", VACIO);
      }
    };

    mapa.on("mousedown", empezar as any);
    mapa.on("mousemove", mover as any);
    mapa.on("mouseup", soltar as any);
    mapa.on("touchstart", empezar as any);
    mapa.on("touchmove", mover as any);
    mapa.on("touchend", soltar as any);

    return () => {
      mapa.off("mousedown", empezar as any);
      mapa.off("mousemove", mover as any);
      mapa.off("mouseup", soltar as any);
      mapa.off("touchstart", empezar as any);
      mapa.off("touchmove", mover as any);
      mapa.off("touchend", soltar as any);
      mapa.dragPan.enable();
      mapa.doubleClickZoom.enable();
      mapa.getCanvas().style.cursor = "";
      dibujandoRef.current = false;
      ponerDatos(mapa, "punto-de-ajuste", VACIO);
    };
  }, [dibujando, alDibujar, rectangulos]);

  /**
   * Elegir un punto tocando el mapa.
   *
   * Un solo toque, sin arrastrar: marcar dónde está algo no necesita más, y
   * cualquier gesto de más es una forma de equivocarse.
   */
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !marcandoPunto || !alMarcarPunto) return;

    mapa.getCanvas().style.cursor = "crosshair";

    const tocar = (evento: { lngLat: maplibregl.LngLat }) => {
      alMarcarPunto(evento.lngLat.lng, evento.lngLat.lat);
    };

    mapa.on("click", tocar);

    return () => {
      mapa.off("click", tocar);
      mapa.getCanvas().style.cursor = "";
    };
  }, [marcandoPunto, alMarcarPunto]);

  /**
   * Abrir una anotación tocándola en el mapa.
   *
   * **No se busca el toque exacto sobre el puntito**, sino en un cuadrado
   * grande alrededor del dedo. El punto se dibuja chico para no tapar el mapa,
   * pero se toca caminando y con guantes: si hubiera que acertarle a siete
   * píxeles, nadie lo abriría nunca.
   */
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !alTocarAnotacion || marcandoPunto) return;

    const MITAD_DEL_DEDO = 22;

    const tocar = (evento: maplibregl.MapMouseEvent) => {
      if (!mapa.getLayer("anotaciones-punto")) return;

      const { x, y } = evento.point;
      const encontradas = mapa.queryRenderedFeatures(
        [
          [x - MITAD_DEL_DEDO, y - MITAD_DEL_DEDO],
          [x + MITAD_DEL_DEDO, y + MITAD_DEL_DEDO],
        ],
        { layers: ["anotaciones-punto"] },
      );

      const id = encontradas[0]?.properties?.id;
      if (typeof id === "number") alTocarAnotacion(id);
    };

    mapa.on("click", tocar);
    return () => {
      mapa.off("click", tocar);
    };
  }, [alTocarAnotacion, marcandoPunto]);

  // Los pedazos de mapa: el que se está definiendo y los que ya existen.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;

    const poner = () => {
      const features = [
        ...rectangulos.map((cada) => comoPoligono(cada.rectangulo, cada.clase)),
        ...(rectangulo ? [comoPoligono(rectangulo, "nuevo")] : []),
      ];
      
      ponerDatos(mapa, FUENTE_RECTANGULOS, {
        type: "FeatureCollection",
        features,
      });

      for (const m of marcadoresDeEtiquetasRef.current) {
        m.remove();
      }
      marcadoresDeEtiquetasRef.current = [];

      for (const cada of rectangulos) {
        if (cada.etiqueta) {
          const el = document.createElement("div");
          el.className = "text-base font-bold text-texto bg-superficie/80 px-2 rounded";
          el.textContent = cada.etiqueta as string;
          const { latNorte, latSur, lonEste, lonOeste } = cada.rectangulo;
          const lon = (lonOeste + lonEste) / 2;
          const lat = (latNorte + latSur) / 2;
          const m = new maplibregl.Marker({ element: el })
            .setLngLat([lon, lat])
            .addTo(mapa);
          marcadoresDeEtiquetasRef.current.push(m);
        }
      }

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
  }, [rectangulo, rectangulos]);

  // Dónde estoy.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;

    const poner = () =>
      ponerDatos(
        mapa,
        FUENTE_POSICION,
        posicionEfectiva
          ? {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "Point",
                    coordinates: [posicionEfectiva.lon, posicionEfectiva.lat],
                  },
                },
              ],
            }
          : VACIO,
      );

    cuandoEsteListo(poner);
  }, [miPosicion]);

  // Forzar centrado a pedido
  useEffect(() => {
    if (!forzarCentradoEn || !posicionEfectiva || !mapaRef.current) return;
    mapaRef.current.flyTo({ 
      center: [posicionEfectiva.lon, posicionEfectiva.lat], 
      zoom: mapaRef.current.getZoom() > 14 ? mapaRef.current.getZoom() : 14 
    });
  }, [forzarCentradoEn, posicionEfectiva]);

  /**
   * El mapa abierto en grande, tapando la pantalla.
   *
   * En el celular cualquier mapa es chico, y mirar si la ruta queda adentro de
   * un sector con un recuadro de siete centímetros no se puede. Cierra con la
   * cruz y también con el botón físico de atrás, como toda pantalla que tapa.
   */
  const enGrande = aPantallaCompleta && !pantallaCompleta;

  useCerrarConAtras(enGrande, cerrarLoGrande);

  /**
   * El mapa mide su lienzo al armarse: si cambia de tamaño hay que avisarle.
   *
   * Y hay que **volver a encuadrar lo que se estaba mirando**: con solo
   * avisarle del tamaño nuevo, el mapa conserva el acercamiento y lo que
   * ocupaba todo el recuadro chico queda como una estampilla en el medio de la
   * pantalla grande, que es justo lo contrario de para qué se agranda.
   */
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;

    const cuandoSeAcomode = window.setTimeout(() => {
      mapa.resize();

      // Se vuelve a encuadrar lo que hay que mirar, no lo que se estaba
      // mirando: un recuadro ancho y bajo metido en una pantalla alta deja la
      // ruta chiquita en el medio, que es lo contrario de agrandar.
      const aQueVolver = encuadreRef.current ?? loQueSeMirabaRef.current;
      if (aQueVolver) {
        mapa.fitBounds(aQueVolver, { padding: 36, animate: false });
      }
    }, 60);

    return () => window.clearTimeout(cuandoSeAcomode);
  }, [enGrande]);

  const acercar = (cuanto: number) => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    mapa.easeTo({ zoom: mapa.getZoom() + cuanto, duration: 180 });
  };

  return (
    <div
      style={enGrande ? { zIndex: NIVEL_DEL_MAPA_EN_GRANDE } : undefined}
      className={[
        "flex flex-col overflow-hidden bg-mapa-fondo",
        enGrande
          ? "fixed inset-0 h-dvh w-screen"
          : pantallaCompleta
            ? "relative h-full w-full"
            : principal
              ? "relative h-72 w-full rounded-xl border border-borde sm:h-96 lg:h-[calc(100vh-13rem)]"
              : // La referencia se come alto: si no se lo devolvemos, el mapa
                // queda una franja donde no se ve si la ruta cae adentro.
                referencia
                ? "relative h-[21rem] w-full rounded-xl border border-borde sm:h-[25rem]"
                : "relative h-64 w-full rounded-xl border border-borde sm:h-80",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative min-h-0 flex-1">
      <div ref={contenedorRef} className="h-full w-full" />

      {/*
        El fondo puede fallar y la app sigue andando, pero el usuario tiene que
        saberlo: si no, ve un mapa vacío y no sabe si es que no bajó nada o si
        se rompió algo.
      */}
      {!armado ? (
        <p className="absolute bottom-3 left-3 right-20 rounded-xl border border-borde bg-superficie px-3 py-2 text-sm leading-6 text-texto-suave">
          Armando el mapa…
        </p>
      ) : avisoDelFondo ? (
        <p className="absolute bottom-3 left-3 right-20 rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-2 text-sm leading-6 text-ambar-texto">
          El fondo del mapa no se pudo dibujar: {avisoDelFondo} Lo que ves —la
          ruta, tu posición y los recuadros— sigue siendo correcto.
        </p>
      ) : dibujado === 0 && !recorrido ? (
        <p className="absolute bottom-3 left-3 right-20 rounded-xl border border-borde bg-superficie px-3 py-2 text-sm leading-6 text-texto-suave">
          El mapa está armado pero no hay nada que dibujar todavía.
        </p>
      ) : null}

      {/*
        Dibujo o foto del terreno. Solo aparece con el mapa en vivo: la foto no
        se descarga nunca, así que sin internet no hay nada que elegir.
      */}
      {enVivo ? (
        <div className="absolute left-3 top-3 flex h-14 overflow-hidden rounded-full border border-borde-fuerte bg-superficie shadow-[var(--sombra-alta)]">
          {(
            [
              ["dibujo", "Básico"],
              ["satelital", "Satélite"],
            ] as const
          ).map(([cual, etiqueta]) => (
            <button
              key={cual}
              type="button"
              onClick={() => {
                setTipoDeFondo(cual);
                if (alCambiarFondo) alCambiarFondo(cual);
              }}
              aria-pressed={tipoDeFondo === cual}
              className={[
                "flex h-full items-center px-4 text-xs font-semibold transition-colors",
                tipoDeFondo === cual
                  ? "bg-texto text-fondo"
                  : "bg-superficie-baja text-texto-suave hover:bg-superficie-alta hover:text-texto",
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
        Controles del margen superior derecho cuando el mapa está en pantalla completa o expandido.
      */}
      {pantallaCompleta || enGrande ? (
        <div className="absolute right-3 top-3 flex items-center gap-2">
          {enGrande || (pantallaCompleta && alCerrarPantallaCompleta) ? (
            <button
              type="button"
              aria-label="Cerrar el mapa grande"
              onPointerDown={() => vibrarAlTocar()}
              onClick={() => {
                anotarLoQueSeMira();
                if (enGrande) {
                  setAPantallaCompleta(false);
                } else if (alCerrarPantallaCompleta) {
                  alCerrarPantallaCompleta();
                }
              }}
              className={[
                CLASE_DE_RESPUESTA_AL_TOQUE,
                "flex h-14 w-14 items-center justify-center rounded-full",
                "border border-borde-fuerte bg-superficie text-texto shadow-[var(--sombra-alta)]",
                "hover:bg-superficie-alta",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde",
              ].join(" ")}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          ) : null}
          <BotonDeModo paraNavegacion={pantallaCompleta} />
        </div>
      ) : null}

      {/*
        Abrir el mapa en grande y GPS. Van abajo a la derecha, al alcance del pulgar.
      */}
      {!pantallaCompleta ? (
        <div className="absolute bottom-3 right-3 flex flex-col gap-2">
          {controlesAdicionales}

          <BotonDelMapa
            etiqueta={gpsPrendido ? "Centrar" : "Ubicarme"}
            grande={false}
            alTocar={alternarGps}
          >
            {gpsPrendido ? (
              <>
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                <circle cx="12" cy="10" r="3" fill="currentColor" />
              </>
            ) : (
              <>
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                <circle cx="12" cy="10" r="3" />
              </>
            )}
          </BotonDelMapa>
          
          {!enGrande ? (
            <BotonDelMapa
              etiqueta="Ver el mapa en grande"
              grande={false}
              alTocar={() => {
                anotarLoQueSeMira();
                setAPantallaCompleta(true);
              }}
            >
              <path d="M9 4H4v5" />
              <path d="M15 4h5v5" />
              <path d="M15 20h5v-5" />
              <path d="M9 20H4v-5" />
            </BotonDelMapa>
          ) : null}
        </div>
      ) : null}
      </div>

      {/*
        La referencia de colores. Va adentro del mapa, así cuando se abre en
        grande viaja con él: sin ella los recuadros son manchas de colores.
      */}
      {referencia ? (
        <div className="shrink-0 border-t border-borde bg-superficie px-3 py-2">
          {referencia}
        </div>
      ) : null}
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
