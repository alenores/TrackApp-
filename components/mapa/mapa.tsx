"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Feature, FeatureCollection, Point, Polygon } from "geojson";
import * as maplibregl from "maplibre-gl";
import {
  capasDelFondo,
  estiloDelMapa,
  FUENTE_GOOGLE,
  iconosDelFondo,
  opcionesDelMapa,
  QUIEN_HIZO_LA_FOTO,
  todasLasCapasDelFondo,
  type TipoDeFondo,
} from "@/components/mapa/capas-base";
import { coloresDelMapa } from "@/components/mapa/colores";
import { NIVEL_DEL_MAPA_EN_GRANDE } from "@/lib/capas";
import { useCerrarConAtras } from "@/hooks/use-cerrar-con-atras";
import type { RectanguloEnElMapa } from "@/lib/mapas/rectangulos";
import { useModo } from "@/hooks/use-modo";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { BotonDeModo } from "@/components/ui/boton-de-modo";
import type { Modo } from "@/lib/modo";
import { vibrarAlTocar } from "@/lib/vibracion";
import { prepararElMotorDelMapa } from "@/lib/mapas/motor";
import { registrarElMapaGuardado } from "@/lib/mapas/protocolo";
import { registrarElRelieveGuardado } from "@/lib/mapas/relieve";
import { abrirSesionDeGoogle, traerCreditosDeGoogle } from "@/lib/mapas/google-cliente";
import {
  ALTURAS,
  CAPAS_DE_RELIEVE,
  capasDeRelieve,
  CURVAS_FINAS,
  CURVAS_GRUESAS,
  FUENTE_DE_LAS_CURVAS,
  fuenteDeLasCurvas,
} from "@/components/mapa/capas-de-relieve";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";
import { rectanguloQueAbarca } from "@/lib/datos/rectangulo";
import { opacidadDelNombreDeZona, zonaEnElLugar } from "@/lib/mapas/general";
import type { Anotacion, Rectangulo } from "@/types/database";
import { puntosSinPaso } from "@/lib/rutas/partes";
import { FichaDeAnotacion } from "@/components/navegacion/ficha-de-anotacion";
import type { AnotacionEnPantalla } from "@/lib/anotaciones/en-pantalla";

/** Toque o clic sobre el mapa: los dos traen dónde fue, en el mapa y en pantalla. */
type EventoDelPuntero = maplibregl.MapMouseEvent | maplibregl.MapTouchEvent;

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
 * Se puede acercar con dos dedos, y además hay botones de tamaño normal.
 */

const FUENTE_RUTA = "ruta";
const CAPAS_DE_PARTES = ["ruta-por-explorar", "ruta-transitable", "ruta-a-pie", "ruta-sin-paso"];
const FUENTE_CAMINOS = "caminos";
const CAPAS_DE_CAMINOS = ["camino-otra-actividad", "camino-por-explorar", "camino-transitable", "camino-a-pie", "camino-sin-paso"];
const FUENTE_CIRCUITO = "circuito";
const FUENTE_FINAL_CONSERVADO = "final-conservado-del-circuito";
const CAPAS_DEL_CIRCUITO = ["circuito-propio", "circuito-camino-por-explorar", "circuito-camino-transitable", "circuito-camino-a-pie", "circuito-camino-sin-paso"];
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
  conCurvas: boolean,
): string | null {
  try {
    for (const vieja of todasLasCapasDelFondo(modo)) {
      if (mapa.getLayer(vieja.id)) mapa.removeLayer(vieja.id);
    }

    const debajoDe = CAPAS_DE_LA_APP_DE_ABAJO_HACIA_ARRIBA.find((capa) => mapa.getLayer(capa));

    for (const capa of capasDelFondo(modo, tipo, conCurvas)) mapa.addLayer(capa, debajoDe);

    // Las curvas: siempre en el simple; en el satelital, según el botón.
    for (const capa of CAPAS_DE_RELIEVE) {
      if (mapa.getLayer(capa)) {
        mapa.setLayoutProperty(capa, "visibility", conCurvas ? "visible" : "none");
      }
    }

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
  /** Los Caminos del mapa, separados de la ruta planificada. */
  caminos?: FeatureCollection | null;
  /** El Circuito conserva distintas las partes propias y las tomadas de Caminos. */
  circuito?: FeatureCollection | null;
  /** Final marcado que ya no toca al Camino corregido: se ve sin unirlo con una línea supuesta. */
  finalConservadoDelCircuito?: number[] | null;
  /** En PC, muestra junto al cursor las actividades de cada Camino. */
  mostrarActividadesDeCaminoAlPasar?: boolean;
  /** Un clic en cualquier lugar arma el Circuito; caminoId es nulo fuera de un Camino. */
  alMarcarPuntoDelCircuito?: (lon: number, lat: number, caminoId: number | null, actividadMostrada: string | null) => void;
  /** Vértices del Camino que se está corrigiendo en la computadora. */
  verticesDeCamino?: number[][] | null;
  alMoverVerticeDeCamino?: (indice: number, lon: number, lat: number) => void;
  alTocarVerticeDeCamino?: (indice: number) => void;
  /** Extremos elegidos en el editor de partes. */
  extremosDeParte?: { inicio: number[] | null; final: number[] | null };
  /** El lugar que se está señalando en el gráfico de alturas. */
  puntoSenalado?: number[] | null;
  /**
   * Otros Circuitos prendidos para ubicarse: más finos y tenues, por debajo
   * del que se navega, así nunca se confunden con él.
   */
  otrosCircuitos?: FeatureCollection | null;
  /** Los puntos y trazos dibujados sobre el territorio. */
  anotaciones?: Anotacion[];
  /** Dónde está el usuario, si el GPS está andando. */
  miPosicion?: PosicionEnElMapa | null;
  /** A qué encuadrar al abrir. */
  encuadre?: Rectangulo | null;
  /**
   * `true` para encuadrar una sola vez, al abrir.
   *
   * Sin esto el mapa vuelve al encuadre cada vez que cambian las líneas. En el
   * mapa libre eso haría perder lo que se está mirando al prender o apagar
   * una ruta.
   */
  encuadrarSoloAlAbrir?: boolean;
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
  /** Usa el doble de alto habitual en las vistas generales de territorio. */
  alturaExtendida?: boolean;
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
   * Qué mapas hay bajados para lo que muestra esta pantalla.
   *
   * El botón Simple/Satelital muestra solo esos: sin ninguno no aparece, y así
   * se ve de un vistazo que no hay mapa bajado; con uno solo muestra ese. En
   * vivo están siempre los dos.
   */
  fondosDisponibles?: TipoDeFondo[];
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
  /** Se llama al tocar una parte de una ruta. También sirve para elegirla al editar. */
  alTocarRuta?: (lon: number, lat: number, propiedades: Record<string, unknown>) => void;
  alTocarCamino?: (lon: number, lat: number, propiedades: Record<string, unknown>) => void;
  /** `false` cuando quien lo llama ya muestra la ficha compartida por su cuenta. */
  mostrarFichaAnotacion?: boolean;
  /** Abrir o cerrar la ficha de zona con un clic o toque en el mapa. */
  alSenalarZona?: (zonaId: number | null) => void;
  /** Ficha que aparece sobre el mapa, también cuando se abre en grande. */
  fichaSobreElMapa?: ReactNode;
  /**
   * `true` para traer el fondo en vivo.
   *
   * Va en las pantallas de administrar: zonas, sectores y rutas. **Esas se usan
   * sentado en la computadora, con conexión**, y no tienen ningún sentido sin
   * ella. La única pantalla que trabaja sin señal es la de navegar.
   */
  enVivo?: boolean;
  /** Solo consulta: ofrece imagen de Google con señal, nunca en edición ni navegación. */
  consultaGoogle?: boolean;
  /**
   * `true` si a esta pantalla le falta mapa bajado. Arriba a la izquierda, donde
   * va Simple/Satelital, aparece un cartel chico: «Sin mapa descargado».
   */
  sinMapaDescargado?: boolean;
  /**
   * `true` para el mapa chico de adentro de una emergente, como el de la zona
   * en «Rutas en el mapa»: sin botones propios (ubicarme, ver en grande) y con
   * el nombre de cada sector en su esquina, así no tapa el punto azul.
   */
  miniatura?: boolean;
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
  caminos = null,
  circuito = null,
  finalConservadoDelCircuito = null,
  mostrarActividadesDeCaminoAlPasar = false,
  alMarcarPuntoDelCircuito,
  verticesDeCamino = null,
  alMoverVerticeDeCamino,
  alTocarVerticeDeCamino,
  extremosDeParte,
  puntoSenalado = null,
  otrosCircuitos = null,
  anotaciones = [],
  miPosicion = null,
  encuadre = null,
  encuadrarSoloAlAbrir = false,
  rectangulo = null,
  rectangulos = [],
  referencia = null,
  pantallaCompleta = false,
  principal = false,
  alturaExtendida = false,
  controlesAdicionales = null,
  alCerrarPantallaCompleta,
  forzarCentradoEn,
  fondoInicial = "dibujo",
  alCambiarFondo,
  fondosDisponibles,
  dibujando = false,
  alDibujar,
  marcandoPunto = false,
  alMarcarPunto,
  alTocarAnotacion,
  alTocarRuta,
  alTocarCamino,
  mostrarFichaAnotacion = true,
  alSenalarZona,
  fichaSobreElMapa,
  enVivo = false,
  consultaGoogle = false,
  sinMapaDescargado = false,
  miniatura = false,
  className = "",
}: MapaProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<maplibregl.Map | null>(null);
  const verticesDeCaminoRef = useRef(verticesDeCamino);
  const moverVerticeRef = useRef(alMoverVerticeDeCamino);
  useEffect(() => { verticesDeCaminoRef.current = verticesDeCamino; }, [verticesDeCamino]);
  useEffect(() => { moverVerticeRef.current = alMoverVerticeDeCamino; }, [alMoverVerticeDeCamino]);
  const marcadoresDeEtiquetasRef = useRef<maplibregl.Marker[]>([]);
  const listoRef = useRef(false);

  // ===========================================================================
  // ESTADOS Y EFECTOS
  // ===========================================================================

  const [gpsPrendido, setGpsPrendido] = useState(false);
  const [caminoBajoCursor, setCaminoBajoCursor] = useState<{ id: number; texto: string; x: number; y: number } | null>(null);
  const [posicionPropia, setPosicionPropia] = useState<PosicionEnElMapa | null>(null);
  const [anotacionTocadaId, setAnotacionTocadaId] = useState<number | null>(null);
  const vigilanciaRef = useRef<number | null>(null);
  
  const primeraVezRef = useRef(true);

  const posicionEfectiva = miPosicion || posicionPropia;
  const cerrarFichaAnotacion = useCallback(() => setAnotacionTocadaId(null), []);
  const anotacionTocada = anotaciones.find((cada) => cada.id === anotacionTocadaId);
  const anotacionDeLaFicha: AnotacionEnPantalla | null = anotacionTocada
    ? {
        ...anotacionTocada,
        subida: (anotacionTocada as Partial<AnotacionEnPantalla>).subida ?? null,
        codigoDeLaMarca: (anotacionTocada as Partial<AnotacionEnPantalla>).codigoDeLaMarca ?? null,
      }
    : null;

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
  const haySenal = useHaySenal();
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
  /** Dibujo o foto del terreno: el que eligió el usuario. */
  const [tipoElegido, setTipoDeFondo] = useState<TipoDeFondo>(consultaGoogle && fondoInicial === "dibujo" ? "google" : fondoInicial);
  const [sesionGoogle, setSesionGoogle] = useState<string | null>(null);
  const [googleNoConfigurado, setGoogleNoConfigurado] = useState(false);
  const [creditosGoogle, setCreditosGoogle] = useState<string | null>(null);
  const [falloGoogle, setFalloGoogle] = useState<string | null>(null);
  const sesionGoogleActiva = consultaGoogle && enVivo && haySenal ? sesionGoogle : null;
  const opcionesDeFondo = opcionesDelMapa({
    enVivo, consultaGoogle, haySenal, sesionGoogle: Boolean(sesionGoogleActiva),
    falloGoogle: Boolean(falloGoogle), fondosDescargados: fondosDisponibles ?? [],
  });
  /**
   * Las curvas sobre la foto se prenden y apagan (decisión 013). En el mapa
   * simple no hay botón: se ven siempre.
   */
  const [curvasSobreLaFoto, setCurvasSobreLaFoto] = useState(true);
  /** El que se ve: el elegido si está bajado; si no, el que haya. */
  const tipoDeFondo: TipoDeFondo = opcionesDeFondo.includes(tipoElegido)
    ? tipoElegido
    : (consultaGoogle && tipoElegido === "google" && enVivo ? "satelital" : (opcionesDeFondo[0] ?? "dibujo"));
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
  }, [setAPantallaCompleta]);
  /** Cuántas cosas hay dibujadas encima del fondo. */
  const [dibujado, setDibujado] = useState(0);
  /** Se lee una sola vez, al armar el mapa: no cambia mientras está abierto. */
  const enVivoRef = useRef(enVivo);
  const tipoDeFondoRef = useRef<TipoDeFondo>("dibujo");
  useEffect(() => {
    tipoDeFondoRef.current = tipoDeFondo;
  }, [tipoDeFondo]);
  const conCurvas = tipoDeFondo !== "satelital" || curvasSobreLaFoto;
  const curvasRef = useRef(conCurvas);
  useEffect(() => {
    curvasRef.current = conCurvas;
  }, [conCurvas]);
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

  // La sesión se abre solo para consulta con señal. No participa del mapa offline.
  useEffect(() => {
    if (!consultaGoogle || !enVivo || !haySenal || sesionGoogle || googleNoConfigurado) return;
    let activo = true;
    void (async () => {
      try {
        const sesion = await abrirSesionDeGoogle();
        if (activo) {
          setSesionGoogle(sesion);
          setGoogleNoConfigurado(sesion === null);
          setFalloGoogle(null);
        }
      } catch (error) {
        if (activo) {
          setSesionGoogle(null);
          setFalloGoogle(error instanceof Error ? error.message : "Google no respondió. Usá el mapa Satelital.");
        }
      }
    })();
    return () => { activo = false; };
  }, [consultaGoogle, enVivo, haySenal, sesionGoogle, googleNoConfigurado]);

  useEffect(() => {
    if (!sesionGoogleActiva) return;
    const mapa = mapaRef.current;
    if (!mapa) return;
    cuandoEsteListo(() => {
      if (!mapa.getSource(FUENTE_GOOGLE)) {
        mapa.addSource(FUENTE_GOOGLE, {
          type: "raster",
          tiles: [`${window.location.origin}/api/mapa-google/tesela/{z}/{x}/{y}?sesion=${encodeURIComponent(sesionGoogleActiva)}`],
          tileSize: 256,
          maxzoom: 22,
        });
      }
      setAvisoDelFondo(ponerElFondo(mapa, modoRef.current, tipoDeFondoRef.current, curvasRef.current));
    });
  }, [sesionGoogleActiva]);

  useEffect(() => {
    if (!sesionGoogleActiva || tipoDeFondo !== "google") return;
    const mapa = mapaRef.current;
    if (!mapa) return;
    let activo = true;
    let pedido = 0;
    const actualizar = () => {
      if (!listoRef.current) return;
      const actual = ++pedido;
      const limites = mapa.getBounds();
      const normalizar = (valor: number) => ((valor + 180) % 360 + 360) % 360 - 180;
      const ancho = limites.getEast() - limites.getWest();
      const consulta = new URLSearchParams({
        sesion: sesionGoogleActiva,
        zoom: String(Math.max(0, Math.min(22, Math.round(mapa.getZoom())))),
        north: String(Math.min(89.999, limites.getNorth())),
        south: String(Math.max(-89.999, limites.getSouth())),
        west: String(ancho >= 360 ? -179.999 : normalizar(limites.getWest())),
        east: String(ancho >= 360 ? 179.999 : normalizar(limites.getEast())),
      });
      void (async () => {
        try {
          const derechos = await traerCreditosDeGoogle(consulta);
          if (activo && actual === pedido) setCreditosGoogle(derechos);
        } catch (error) {
          if (activo && actual === pedido) {
            setTipoDeFondo("satelital");
            setFalloGoogle(error instanceof Error ? error.message : "Google no informó los créditos de la imagen. Usá el mapa Satelital.");
          }
        }
      })();
    };
    mapa.on("moveend", actualizar);
    cuandoEsteListo(actualizar);
    return () => { activo = false; mapa.off("moveend", actualizar); };
  }, [sesionGoogleActiva, tipoDeFondo]);

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
      mapa.addSource(FUENTE_RUTA, { type: "geojson", data: VACIO });
      mapa.addSource(FUENTE_CAMINOS, { type: "geojson", data: VACIO });
      mapa.addSource(FUENTE_CIRCUITO, { type: "geojson", data: VACIO });
      mapa.addSource(FUENTE_FINAL_CONSERVADO, { type: "geojson", data: VACIO });
      mapa.addSource("x-sin-paso-circuito", { type: "geojson", data: VACIO });
      mapa.addSource("vertices-de-camino", { type: "geojson", data: VACIO });
      mapa.addSource("x-sin-paso-caminos", { type: "geojson", data: VACIO });
      mapa.addSource("x-sin-paso", { type: "geojson", data: VACIO });
      mapa.addSource("extremos-de-parte", { type: "geojson", data: VACIO });
      mapa.addSource("punto-senalado", { type: "geojson", data: VACIO });
      mapa.addSource("otros-circuitos", { type: "geojson", data: VACIO });
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
        filter: ["all", ["!=", ["get", "clase"], "zona"], ["!=", ["get", "clase"], "zona_general"], ["!=", ["get", "clase"], "sector"]],
        paint: {
          "fill-color": [
            "match",
            ["get", "clase"],
            "nuevo", colores.rectanguloNuevo,
            "sector_bajado", colores.rectanguloBajado,
            "sector_elegido", colores.rectanguloBajado,
            "sector_sin_bajar", colores.rectanguloSinBajar,
            colores.rectanguloExistente,
          ],
          "fill-opacity": ["case", ["==", ["get", "clase"], "sector_elegido"], 0.3, 0.14],
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
            "sector_elegido", colores.rectanguloBajado,
            "sector_sin_bajar", colores.rectanguloSinBajar,
            "zona_general", colores.rectanguloBajado,
            colores.rectanguloExistente,
          ],
          "line-width": ["match", ["get", "clase"], "nuevo", 3, "sector_elegido", 4, "zona_general", 2.4, 2.4],
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

      const colorDeParte: maplibregl.ExpressionSpecification = [
        "match", ["get", "complejidad"],
        "facil", colores.parteFacil,
        "media", colores.parteMedia,
        "dificil", colores.parteDificil,
        colores.parteSinClasificar,
      ];
      mapa.addLayer({
        id: CAPAS_DE_CAMINOS[0], type: "line", source: FUENTE_CAMINOS,
        filter: ["==", ["get", "paso"], "otra_actividad"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": colores.rectanguloZona, "line-width": 2, "line-opacity": 0.75 },
      });
      for (const [paso, capa, guiones] of [
        ["por_explorar", CAPAS_DE_CAMINOS[1], [2.4, 1.5]],
        ["transitable", CAPAS_DE_CAMINOS[2], null],
        ["a_pie", CAPAS_DE_CAMINOS[3], [0.45, 1.5]],
        ["sin_paso", CAPAS_DE_CAMINOS[4], null],
      ] as const) {
        const filtro: maplibregl.FilterSpecification = ["==", ["get", "paso"], paso];
        const estilo = {
          "line-color": colorDeParte,
          "line-width": 5,
          "line-opacity": 0.98,
          ...(guiones ? { "line-dasharray": [...guiones] } : {}),
        };
        mapa.addLayer({
          id: `${capa}-borde`, type: "line", source: FUENTE_CAMINOS, filter: filtro,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": colores.parteX, "line-width": 7, "line-opacity": 0.85,
            ...(guiones ? { "line-dasharray": [...guiones] } : {}) },
        });
        mapa.addLayer({ id: capa, type: "line", source: FUENTE_CAMINOS, filter: filtro,
          layout: { "line-cap": "round", "line-join": "round" }, paint: estilo });
      }
      mapa.addLayer({
        id: "camino-sin-paso-x", type: "symbol", source: "x-sin-paso-caminos",
        layout: { "text-field": "×", "text-font": ["Noto Sans Regular"], "text-size": 25, "text-allow-overlap": true },
        paint: { "text-color": colores.parteX, "text-halo-color": colores.parteXHalo, "text-halo-width": 2 },
      });
      mapa.addLayer({ id: "otros-circuitos", type: "line", source: "otros-circuitos",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": colores.circuitoPropio, "line-width": 4, "line-opacity": 0.55 } });
      const filtroPropio: maplibregl.FilterSpecification = ["==", ["get", "clase"], "propia"];
      mapa.addLayer({ id: "circuito-propio-borde", type: "line", source: FUENTE_CIRCUITO,
        filter: filtroPropio, layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": colores.circuitoBorde, "line-width": 10 } });
      mapa.addLayer({ id: CAPAS_DEL_CIRCUITO[0], type: "line", source: FUENTE_CIRCUITO,
        filter: filtroPropio, layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": colores.circuitoPropio, "line-width": 6 } });
      for (const [paso, capa, guiones] of [
        ["por_explorar", CAPAS_DEL_CIRCUITO[1], [2.4, 1.5]],
        ["transitable", CAPAS_DEL_CIRCUITO[2], null],
        ["a_pie", CAPAS_DEL_CIRCUITO[3], [0.45, 1.5]],
        ["sin_paso", CAPAS_DEL_CIRCUITO[4], null],
      ] as const) {
        const filtro: maplibregl.FilterSpecification = ["all", ["==", ["get", "clase"], "camino"], ["==", ["get", "paso"], paso]];
        const opacidad: maplibregl.ExpressionSpecification = ["case", ["==", ["get", "otra_actividad"], true], 0.72, 1];
        mapa.addLayer({ id: `${capa}-borde`, type: "line", source: FUENTE_CIRCUITO,
          filter: filtro, layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": colores.circuitoBorde, "line-width": 10, "line-opacity": opacidad,
            ...(guiones ? { "line-dasharray": [...guiones] } : {}) } });
        mapa.addLayer({ id: capa, type: "line", source: FUENTE_CIRCUITO,
          filter: filtro, layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": colorDeParte, "line-width": 7, "line-opacity": opacidad,
            ...(guiones ? { "line-dasharray": [...guiones] } : {}) } });
      }
      mapa.addLayer({ id: "circuito-sin-paso-x", type: "symbol", source: "x-sin-paso-circuito",
        layout: { "text-field": "×", "text-font": ["Noto Sans Regular"], "text-size": 25, "text-allow-overlap": true },
        paint: { "text-color": colores.parteX, "text-halo-color": colores.parteXHalo, "text-halo-width": 2 } });
      mapa.addLayer({ id: "circuito-final-conservado", type: "circle", source: FUENTE_FINAL_CONSERVADO,
        paint: { "circle-color": colores.circuitoPropio, "circle-radius": 7,
          "circle-stroke-color": colores.circuitoBorde, "circle-stroke-width": 3 } });
      mapa.addLayer({ id: "circuito-final-conservado-nombre", type: "symbol", source: FUENTE_FINAL_CONSERVADO,
        layout: { "text-field": "Fin marcado", "text-font": ["Noto Sans Regular"],
          "text-size": 15, "text-offset": [0, 1.6], "text-allow-overlap": true },
        paint: { "text-color": colores.circuitoPropio, "text-halo-color": colores.circuitoBorde, "text-halo-width": 2 } });
      mapa.addLayer({
        id: "vertices-de-camino", type: "circle", source: "vertices-de-camino",
        paint: { "circle-radius": 7, "circle-color": colores.rectanguloNuevo,
          "circle-stroke-width": 3, "circle-stroke-color": colores.parteX },
      });
      for (const [paso, capa, guiones] of [
        ["por_explorar", CAPAS_DE_PARTES[0], [2.4, 1.5]],
        ["transitable", CAPAS_DE_PARTES[1], null],
        ["a_pie", CAPAS_DE_PARTES[2], [0.45, 1.5]],
        ["sin_paso", CAPAS_DE_PARTES[3], null],
      ] as const) {
        mapa.addLayer({
          id: capa,
          type: "line",
          source: FUENTE_RUTA,
          filter: ["==", ["coalesce", ["get", "paso"], "por_explorar"], paso],
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": colorDeParte,
            "line-width": 5,
            "line-opacity": 0.98,
            ...(guiones ? { "line-dasharray": [...guiones] } : {}),
          },
        });
      }
      mapa.addLayer({
        id: "ruta-sin-paso-x",
        type: "symbol",
        source: "x-sin-paso",
        layout: {
          "text-field": "×",
          "text-font": ["Noto Sans Regular"],
          "text-size": 25,
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": colores.parteX,
          "text-halo-color": colores.parteXHalo,
          "text-halo-width": 2,
        },
      });
      mapa.addLayer({
        id: "extremos-de-parte-punto",
        type: "circle",
        source: "extremos-de-parte",
        paint: {
          "circle-radius": 9,
          "circle-color": colores.rectanguloNuevo,
          "circle-stroke-width": 3,
          "circle-stroke-color": colores.parteXHalo,
        },
      });
      mapa.addLayer({
        id: "punto-senalado",
        type: "circle",
        source: "punto-senalado",
        paint: {
          "circle-radius": 8,
          "circle-color": colores.parteX,
          "circle-stroke-width": 3,
          "circle-stroke-color": colores.parteXHalo,
        },
      });
      mapa.addLayer({
        id: "extremos-de-parte-nombre",
        type: "symbol",
        source: "extremos-de-parte",
        layout: {
          "text-field": ["get", "nombre"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 15,
          "text-offset": [0, -1.5],
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": colores.parteX,
          "text-halo-color": colores.parteXHalo,
          "text-halo-width": 2,
        },
      });

      mapa.addLayer({
        id: "anotaciones-punto",
        type: "circle",
        source: FUENTE_ANOTACIONES,
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 0, 6, 0.5, 7, 1, 9, 2.5, 11, 5, 13, 7],
          "circle-color": ["coalesce", ["get", "color"], colores.anotacion],
          "circle-stroke-width": 2,
          "circle-stroke-color": colores.contorno,
          "circle-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0, 6, 0.1, 7, 0.25, 9, 0.55, 11, 0.85, 13, 1],
          "circle-stroke-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0, 6, 0.1, 7, 0.25, 9, 0.55, 11, 0.85, 13, 1],
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
          "icon-size": ["interpolate", ["linear"], ["zoom"], 5, 0, 6, 0.2, 7, 0.35, 9, 0.65, 11, 1, 13, 1.2],
          "icon-allow-overlap": false,
        },
        paint: {
          "icon-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0, 6, 0.1, 7, 0.25, 9, 0.6, 11, 1],
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

      setAvisoDelFondo(
        ponerElFondo(mapa, modoRef.current, tipoDeFondoRef.current, curvasRef.current),
      );
    });

    // Un fondo que no carga no puede quedarse callado.
    mapa.on("error", (evento) => {
      const motivo = evento?.error?.message;
      if (motivo) {
        if (tipoDeFondoRef.current === "google") {
          setTipoDeFondo("satelital");
          setFalloGoogle(`Google no entregó la imagen: ${motivo}. Usá el mapa Satelital.`);
        } else setAvisoDelFondo(motivo);
      }
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
      if (!mapa.getLayer(CAPAS_DE_PARTES[0])) return;
      const colores = coloresDelMapa();

      // El fondo se cambia capa por capa, no rearmando el estilo: rearmarlo se
      // lleva puestas las capas de la app y habría que volver a dibujarlas.
      setAvisoDelFondo(ponerElFondo(mapa, modo, tipoDeFondo, conCurvas));

      for (const capa of CAPAS_DE_PARTES) {
        mapa.setPaintProperty(capa, "line-color", [
          "match", ["get", "complejidad"],
          "facil", colores.parteFacil,
          "media", colores.parteMedia,
          "dificil", colores.parteDificil,
          colores.parteSinClasificar,
        ]);
      }
      for (const capa of CAPAS_DE_CAMINOS.slice(1)) {
        mapa.setPaintProperty(capa, "line-color", [
          "match", ["get", "complejidad"],
          "facil", colores.parteFacil, "media", colores.parteMedia,
          "dificil", colores.parteDificil, colores.parteSinClasificar,
        ]);
        mapa.setPaintProperty(`${capa}-borde`, "line-color", colores.parteX);
      }
      mapa.setPaintProperty(CAPAS_DEL_CIRCUITO[0], "line-color", colores.circuitoPropio);
      mapa.setPaintProperty("circuito-propio-borde", "line-color", colores.circuitoBorde);
      for (const capa of CAPAS_DEL_CIRCUITO.slice(1)) {
        mapa.setPaintProperty(capa, "line-color", [
          "match", ["get", "complejidad"],
          "facil", colores.parteFacil, "media", colores.parteMedia,
          "dificil", colores.parteDificil, colores.parteSinClasificar,
        ]);
        mapa.setPaintProperty(`${capa}-borde`, "line-color", colores.circuitoBorde);
      }
      mapa.setPaintProperty("circuito-sin-paso-x", "text-color", colores.parteX);
      mapa.setPaintProperty("circuito-sin-paso-x", "text-halo-color", colores.parteXHalo);
      mapa.setPaintProperty("circuito-final-conservado", "circle-color", colores.circuitoPropio);
      mapa.setPaintProperty("circuito-final-conservado", "circle-stroke-color", colores.circuitoBorde);
      mapa.setPaintProperty("circuito-final-conservado-nombre", "text-color", colores.circuitoPropio);
      mapa.setPaintProperty("circuito-final-conservado-nombre", "text-halo-color", colores.circuitoBorde);
      mapa.setPaintProperty(CAPAS_DE_CAMINOS[0], "line-color", colores.rectanguloZona);
      mapa.setPaintProperty("camino-sin-paso-x", "text-color", colores.parteX);
      mapa.setPaintProperty("camino-sin-paso-x", "text-halo-color", colores.parteXHalo);
      mapa.setPaintProperty("vertices-de-camino", "circle-color", colores.rectanguloNuevo);
      mapa.setPaintProperty("vertices-de-camino", "circle-stroke-color", colores.parteX);
      mapa.setPaintProperty("ruta-sin-paso-x", "text-color", colores.parteX);
      mapa.setPaintProperty("ruta-sin-paso-x", "text-halo-color", colores.parteXHalo);
      mapa.setPaintProperty("extremos-de-parte-punto", "circle-color", colores.rectanguloNuevo);
      mapa.setPaintProperty("extremos-de-parte-punto", "circle-stroke-color", colores.parteXHalo);
      mapa.setPaintProperty("extremos-de-parte-nombre", "text-color", colores.parteX);
      mapa.setPaintProperty("extremos-de-parte-nombre", "text-halo-color", colores.parteXHalo);
      mapa.setPaintProperty("otros-circuitos", "line-color", colores.circuitoPropio);
      mapa.setPaintProperty("punto-senalado", "circle-color", colores.parteX);
      mapa.setPaintProperty("punto-senalado", "circle-stroke-color", colores.parteXHalo);
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
            "sector_elegido", colores.rectanguloBajado,
            "sector_sin_bajar", colores.rectanguloSinBajar,
            colores.rectanguloExistente,
          ]);
      mapa.setPaintProperty("rectangulos-borde", "line-color", [
            "match",
            ["get", "clase"],
            "nuevo", colores.rectanguloNuevo,
            "sector", colores.rectanguloNuevo, // Mantenemos el color llamativo (dato) para el sector
            "sector_bajado", colores.rectanguloBajado,
            "sector_elegido", colores.rectanguloBajado,
            "sector_sin_bajar", colores.rectanguloSinBajar,
            "zona_general", colores.rectanguloBajado,
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
  }, [modo, tipoDeFondo, conCurvas]);

  // La línea de la ruta.
  const yaEncuadroRef = useRef(false);
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;

    const poner = () => {
      ponerDatos(mapa, FUENTE_RUTA, recorrido ?? VACIO);
      ponerDatos(mapa, "x-sin-paso", recorrido ? puntosSinPaso(recorrido) : VACIO);

      if (encuadre && !(encuadrarSoloAlAbrir && yaEncuadroRef.current)) {
        mapa.fitBounds(limitesDe(encuadre), { padding: 28, animate: false });
        yaEncuadroRef.current = true;
      }
    };

    cuandoEsteListo(poner);
  }, [recorrido, encuadre, encuadrarSoloAlAbrir]);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    cuandoEsteListo(() => {
      ponerDatos(mapa, FUENTE_CAMINOS, caminos ?? VACIO);
      ponerDatos(mapa, "x-sin-paso-caminos", caminos ? puntosSinPaso(caminos) : VACIO);
    });
  }, [caminos]);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    cuandoEsteListo(() => {
      ponerDatos(mapa, FUENTE_CIRCUITO, circuito ?? VACIO);
      ponerDatos(mapa, "x-sin-paso-circuito", circuito ? puntosSinPaso(circuito) : VACIO);
    });
  }, [circuito]);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    cuandoEsteListo(() => ponerDatos(mapa, FUENTE_FINAL_CONSERVADO, finalConservadoDelCircuito ? {
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: {},
        geometry: { type: "Point", coordinates: finalConservadoDelCircuito } }],
    } : VACIO));
  }, [finalConservadoDelCircuito]);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    cuandoEsteListo(() => ponerDatos(mapa, "vertices-de-camino", {
      type: "FeatureCollection",
      features: (verticesDeCamino ?? []).map((punto, indice) => ({
        type: "Feature" as const,
        properties: { indice },
        geometry: { type: "Point" as const, coordinates: [punto[0], punto[1]] },
      })),
    }));
  }, [verticesDeCamino]);

  const editandoVertices = verticesDeCamino !== null && alMoverVerticeDeCamino !== undefined;
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !editandoVertices) return;
    let arrastrando: number | null = null;
    const empezar = (evento: EventoDelPuntero) => {
      const encontrados = mapa.queryRenderedFeatures(evento.point, { layers: ["vertices-de-camino"] });
      const indice = Number(encontrados[0]?.properties?.indice);
      if (!Number.isInteger(indice) || indice < 0 || indice >= (verticesDeCaminoRef.current?.length ?? 0)) return;
      arrastrando = indice;
      mapa.dragPan.disable();
      evento.preventDefault();
    };
    const mover = (evento: EventoDelPuntero) => {
      if (arrastrando === null) return;
      moverVerticeRef.current?.(arrastrando, evento.lngLat.lng, evento.lngLat.lat);
    };
    const terminar = () => {
      arrastrando = null;
      mapa.dragPan.enable();
    };
    mapa.on("mousedown", empezar);
    mapa.on("touchstart", empezar);
    mapa.on("mousemove", mover);
    mapa.on("touchmove", mover);
    mapa.on("mouseup", terminar);
    mapa.on("touchend", terminar);
    return () => {
      mapa.off("mousedown", empezar); mapa.off("touchstart", empezar);
      mapa.off("mousemove", mover); mapa.off("touchmove", mover);
      mapa.off("mouseup", terminar); mapa.off("touchend", terminar);
      mapa.dragPan.enable();
    };
  }, [editandoVertices]);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    cuandoEsteListo(() => ponerDatos(mapa, "extremos-de-parte", {
      type: "FeatureCollection",
      features: ([
        ["Inicio", extremosDeParte?.inicio],
        ["Final", extremosDeParte?.final],
      ] as const).filter(([, punto]) => punto && punto.length >= 2).map(([nombre, punto]) => ({
        type: "Feature" as const,
        properties: { nombre },
        geometry: { type: "Point" as const, coordinates: punto! },
      })),
    }));
  }, [extremosDeParte]);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    cuandoEsteListo(() => ponerDatos(mapa, "punto-senalado", puntoSenalado && puntoSenalado.length >= 2 ? {
      type: "FeatureCollection",
      features: [{ type: "Feature" as const, properties: {}, geometry: { type: "Point" as const, coordinates: puntoSenalado } }],
    } : VACIO));
  }, [puntoSenalado]);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    cuandoEsteListo(() => ponerDatos(mapa, "otros-circuitos", otrosCircuitos ?? VACIO));
  }, [otrosCircuitos]);

  // Los puntos y trazos.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;

    const poner = () =>
      ponerDatos(mapa, FUENTE_ANOTACIONES, anotacionesComoCapa(anotaciones));

    cuandoEsteListo(poner);
  }, [anotaciones]);

  // Ref para tener siempre los rectángulos actualizados sin reiniciar el useEffect del dibujo
  const rectangulosParaDibujo = useRef(rectangulos);
  useEffect(() => {
    rectangulosParaDibujo.current = rectangulos;
  }, [rectangulos]);

  const rectanguloActualRef = useRef(rectangulo);
  useEffect(() => {
    rectanguloActualRef.current = rectangulo;
  }, [rectangulo]);

  /**
   * Marcar el rectángulo arrastrando sobre el mapa o con dos clics.
   */
  useEffect(() => {
    dibujandoRef.current = dibujando;

    const mapa = mapaRef.current;
    if (!mapa || !dibujando || !alDibujar) return;

    mapa.getCanvas().style.cursor = "crosshair";

    let puntoFijo: maplibregl.LngLat | null = null;
    let ajustandoBordes: { n?: boolean, s?: boolean, e?: boolean, o?: boolean } | null = null;
    let rectanguloBase: Rectangulo | null = null;
    let arrastroBorde = false;

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

      for (const capa of rectangulosParaDibujo.current) {
        const { latNorte, latSur, lonEste, lonOeste } = capa.rectangulo;

        const pxNorte = mapa.project([punto.lng, latNorte]).y;
        if (Math.abs(puntoPantalla.y - pxNorte) < UMBRAL_PX) nuevaLat = latNorte;

        const pxSur = mapa.project([punto.lng, latSur]).y;
        if (Math.abs(puntoPantalla.y - pxSur) < UMBRAL_PX) nuevaLat = latSur;

        const pxEste = mapa.project([lonEste, punto.lat]).x;
        if (Math.abs(puntoPantalla.x - pxEste) < UMBRAL_PX) nuevaLng = lonEste;

        const pxOeste = mapa.project([lonOeste, punto.lat]).x;
        if (Math.abs(puntoPantalla.x - pxOeste) < UMBRAL_PX) nuevaLng = lonOeste;
      }

      return new maplibregl.LngLat(nuevaLng, nuevaLat);
    };

    const dibujarPuntosExtra = (ajustado?: maplibregl.LngLat, original?: maplibregl.LngLat) => {
      const puntos = [];
      if (puntoFijo) {
        puntos.push({ type: "Feature" as const, properties: {}, geometry: { type: "Point" as const, coordinates: [puntoFijo.lng, puntoFijo.lat] } });
      }
      if (ajustado && original && (ajustado.lat !== original.lat || ajustado.lng !== original.lng)) {
        if (!puntoFijo || ajustado.lat !== puntoFijo.lat || ajustado.lng !== puntoFijo.lng) {
          puntos.push({ type: "Feature" as const, properties: {}, geometry: { type: "Point" as const, coordinates: [ajustado.lng, ajustado.lat] } });
        }
      }
      ponerDatos(mapa, "punto-de-ajuste", { type: "FeatureCollection", features: puntos });
    };

    const mousedown = (evento: EventoDelPuntero) => {
      const actual = rectanguloActualRef.current;
      if (!actual || puntoFijo) return; // Si no hay área, o si ya se está dibujando una nueva, no hacemos nada

      const { latNorte, latSur, lonEste, lonOeste } = actual;
      const pxN = mapa.project([evento.lngLat.lng, latNorte]).y;
      const pxS = mapa.project([evento.lngLat.lng, latSur]).y;
      const pxE = mapa.project([lonEste, evento.lngLat.lat]).x;
      const pxO = mapa.project([lonOeste, evento.lngLat.lat]).x;

      const y = evento.point.y;
      const x = evento.point.x;
      const UMBRAL = 15;

      const n = Math.abs(y - pxN) < UMBRAL;
      const s = Math.abs(y - pxS) < UMBRAL;
      const e = Math.abs(x - pxE) < UMBRAL;
      const o = Math.abs(x - pxO) < UMBRAL;

      // Si tocó muy cerca de algún borde o esquina, empezamos a ajustar
      if (n || s || e || o) {
        ajustandoBordes = { n, s, e, o };
        rectanguloBase = { ...actual };
        arrastroBorde = false;
        mapa.dragPan.disable();
      }
    };

    const mouseup = () => {
      if (ajustandoBordes) {
        setTimeout(() => {
          // El timeout es para que el click que dispara MapLibre alcance a ver arrastroBorde antes de limpiarse
          arrastroBorde = false;
        }, 100);
        ajustandoBordes = null;
        rectanguloBase = null;
        mapa.dragPan.enable();
      }
    };

    const manejarClic = (evento: EventoDelPuntero) => {
      if (arrastroBorde) return; // Si soltó de un arrastre de borde, ignorar este click

      const ajustado = imantar(evento.lngLat, evento.point);
      
      if (!puntoFijo) {
        // Primer clic para empezar zona nueva
        puntoFijo = ajustado;
        dibujarPuntosExtra(ajustado, evento.lngLat);
      } else {
        // Segundo clic
        const armado = armarDesdeFijo(ajustado);
        if (armado) alDibujar(armado);
        puntoFijo = null;
        dibujarPuntosExtra();
      }
    };

    const mover = (evento: EventoDelPuntero) => {
      // 1. Está ajustando los bordes de la zona ya marcada
      if (ajustandoBordes && rectanguloBase) {
        arrastroBorde = true;
        const ajustado = imantar(evento.lngLat, evento.point);
        const r = { ...rectanguloBase };
        if (ajustandoBordes.n) r.latNorte = ajustado.lat;
        if (ajustandoBordes.s) r.latSur = ajustado.lat;
        if (ajustandoBordes.e) r.lonEste = ajustado.lng;
        if (ajustandoBordes.o) r.lonOeste = ajustado.lng;
        
        // Lo pasamos por rectanguloQueAbarca para que acomode Norte/Sur si se cruzan
        const validR = rectanguloQueAbarca([
           [r.lonOeste, r.latSur],
           [r.lonEste, r.latNorte]
        ]);
        if (validR) alDibujar(validR);
        dibujarPuntosExtra(ajustado, evento.lngLat);
        return;
      }

      // 2. Está dibujando de cero con el primer clic ya hecho
      if (puntoFijo) {
        const ajustado = imantar(evento.lngLat, evento.point);
        dibujarPuntosExtra(ajustado, evento.lngLat);
        const armado = armarDesdeFijo(ajustado);
        if (armado) alDibujar(armado);
        return;
      }

      // 3. Paseo libre por el mapa, mostramos imán si pasa por un borde
      const ajustado = imantar(evento.lngLat, evento.point);
      dibujarPuntosExtra(ajustado, evento.lngLat);
      
      // Cursor extra: mostrar si está sobre un borde arrastrable
      const actual = rectanguloActualRef.current;
      if (actual && !puntoFijo) {
        const { latNorte, latSur, lonEste, lonOeste } = actual;
        const pxN = mapa.project([evento.lngLat.lng, latNorte]).y;
        const pxS = mapa.project([evento.lngLat.lng, latSur]).y;
        const pxE = mapa.project([lonEste, evento.lngLat.lat]).x;
        const pxO = mapa.project([lonOeste, evento.lngLat.lat]).x;
        const y = evento.point.y;
        const x = evento.point.x;
        const n = Math.abs(y - pxN) < 15;
        const s = Math.abs(y - pxS) < 15;
        const e = Math.abs(x - pxE) < 15;
        const o = Math.abs(x - pxO) < 15;

        if ((n || s) && (e || o)) mapa.getCanvas().style.cursor = "crosshair"; // Esquina
        else if (n || s) mapa.getCanvas().style.cursor = "ns-resize"; // Borde horizontal
        else if (e || o) mapa.getCanvas().style.cursor = "ew-resize"; // Borde vertical
        else mapa.getCanvas().style.cursor = "crosshair"; // Nada
      } else {
        mapa.getCanvas().style.cursor = "crosshair";
      }
    };

    mapa.on("mousedown", mousedown);
    mapa.on("mouseup", mouseup);
    mapa.on("touchstart", mousedown);
    mapa.on("touchend", mouseup);

    mapa.on("click", manejarClic);
    mapa.on("mousemove", mover);
    mapa.on("touchmove", mover);

    return () => {
      mapa.off("mousedown", mousedown);
      mapa.off("mouseup", mouseup);
      mapa.off("touchstart", mousedown);
      mapa.off("touchend", mouseup);
      mapa.off("click", manejarClic);
      mapa.off("mousemove", mover);
      mapa.off("touchmove", mover);
      mapa.getCanvas().style.cursor = "";
      mapa.dragPan.enable();
      dibujandoRef.current = false;
      ponerDatos(mapa, "punto-de-ajuste", VACIO);
    };
  }, [dibujando, alDibujar]);

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

  /** Puntos: clic/toque abre sus datos; el cursor avisa en computadora. */
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || marcandoPunto) return;

    const MITAD_DEL_DEDO = 22;
    const capasAnotacion = () => ["anotaciones-punto", "anotaciones-trazo"].filter((capa) =>
      Boolean(mapa.getLayer(capa)),
    );
    const buscarAnotacion = (evento: maplibregl.MapMouseEvent) => {
      const capas = capasAnotacion();
      if (capas.length === 0) return null;
      const { x, y } = evento.point;
      const encontradas = mapa.queryRenderedFeatures(
        [[x - MITAD_DEL_DEDO, y - MITAD_DEL_DEDO], [x + MITAD_DEL_DEDO, y + MITAD_DEL_DEDO]],
        { layers: capas },
      );
      encontradas.sort(
        (a, b) =>
          Number(a.layer.id !== "anotaciones-punto") - Number(b.layer.id !== "anotaciones-punto"),
      );
      const id = encontradas[0]?.properties?.id;
      return typeof id === "number" ? id : null;
    };
    const buscarZona = (evento: maplibregl.MapMouseEvent) => {
      const zonas = rectangulosParaDibujo.current.filter(
        (cada) => cada.clase === "zona_general" && typeof cada.id === "number",
      );
      return zonaEnElLugar(zonas, evento.lngLat.lng, evento.lngLat.lat)?.id ?? null;
    };
    const buscarRuta = (evento: maplibregl.MapMouseEvent) => {
      const capas = CAPAS_DE_PARTES.filter((capa) => mapa.getLayer(capa));
      if (capas.length === 0) return null;
      const { x, y } = evento.point;
      return mapa.queryRenderedFeatures([[x - 9, y - 9], [x + 9, y + 9]], { layers: capas })[0] ?? null;
    };
    const buscarCamino = (evento: maplibregl.MapMouseEvent) => {
      const capas = CAPAS_DE_CAMINOS.filter((capa) => mapa.getLayer(capa));
      if (capas.length === 0) return null;
      const { x, y } = evento.point;
      return mapa.queryRenderedFeatures([[x - 9, y - 9], [x + 9, y + 9]], { layers: capas })[0] ?? null;
    };
    const mover = (evento: maplibregl.MapMouseEvent) => {
      const sobrePunto = mapa.getLayer("anotaciones-punto")
        ? mapa.queryRenderedFeatures(evento.point, { layers: ["anotaciones-punto"] }).length > 0
        : false;
      const sobreZona = alSenalarZona ? buscarZona(evento) !== null : false;
      const sobreRuta = alTocarRuta ? buscarRuta(evento) !== null : false;
      const caminoEncontrado = alTocarCamino || mostrarActividadesDeCaminoAlPasar || alMarcarPuntoDelCircuito
        ? buscarCamino(evento) : null;
      const sobreCamino = caminoEncontrado !== null;
      mapa.getCanvas().style.cursor = alMarcarPuntoDelCircuito ? "crosshair"
        : sobrePunto || sobreZona || sobreRuta || sobreCamino ? "pointer" : "";
      if (mostrarActividadesDeCaminoAlPasar && caminoEncontrado) {
        const id = Number(caminoEncontrado.properties?.camino_id);
        const nombre = String(caminoEncontrado.properties?.nombre ?? "Camino");
        const actividades = String(caminoEncontrado.properties?.actividades_texto ?? "Actividad sin indicar");
        if (Number.isInteger(id)) {
          const x = Math.max(8, Math.min(evento.point.x + 12, mapa.getCanvas().clientWidth - 260));
          const y = Math.max(8, Math.min(evento.point.y + 12, mapa.getCanvas().clientHeight - 70));
          setCaminoBajoCursor((actual) => actual?.id === id ? actual : { id, texto: `${nombre} · ${actividades}`, x, y });
        }
      } else if (mostrarActividadesDeCaminoAlPasar) setCaminoBajoCursor(null);
    };
    const tocar = (evento: maplibregl.MapMouseEvent) => {
      if (alTocarVerticeDeCamino && mapa.getLayer("vertices-de-camino")) {
        const vertices = mapa.queryRenderedFeatures(evento.point, { layers: ["vertices-de-camino"] });
        const indice = Number(vertices[0]?.properties?.indice);
        if (Number.isInteger(indice)) {
          alTocarVerticeDeCamino(indice);
          return;
        }
      }
      if (alMarcarPuntoDelCircuito) {
        const encontrado = buscarCamino(evento);
        const id = Number(encontrado?.properties?.camino_id);
        alMarcarPuntoDelCircuito(evento.lngLat.lng, evento.lngLat.lat,
          Number.isInteger(id) && id > 0 ? id : null,
          typeof encontrado?.properties?.actividad_mostrada === "string" ? encontrado.properties.actividad_mostrada : null);
        return;
      }
      const id = buscarAnotacion(evento);
      if (id !== null) {
        setAnotacionTocadaId(id);
        alTocarAnotacion?.(id);
        alSenalarZona?.(null);
        return;
      }
      if (alTocarRuta) {
        const parte = buscarRuta(evento);
        if (parte) {
          alTocarRuta(evento.lngLat.lng, evento.lngLat.lat, parte.properties ?? {});
          alSenalarZona?.(null);
          return;
        }
      }
      if (alTocarCamino) {
        const parte = buscarCamino(evento);
        if (parte) {
          alTocarCamino(evento.lngLat.lng, evento.lngLat.lat, parte.properties ?? {});
          alSenalarZona?.(null);
          return;
        }
      }
      if (alSenalarZona) alSenalarZona(buscarZona(evento));
    };
    const salir = () => {
      mapa.getCanvas().style.cursor = "";
      setCaminoBajoCursor(null);
    };

    mapa.on("mousemove", mover);
    mapa.on("mouseout", salir);
    mapa.on("click", tocar);
    return () => {
      mapa.off("mousemove", mover);
      mapa.off("mouseout", salir);
      mapa.off("click", tocar);
      mapa.getCanvas().style.cursor = "";
    };
  }, [alSenalarZona, alTocarAnotacion, alTocarRuta, alTocarCamino, alTocarVerticeDeCamino, alMarcarPuntoDelCircuito, mostrarActividadesDeCaminoAlPasar, marcandoPunto]);

  // Los pedazos de mapa: el que se está definiendo y los que ya existen.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;

    const actualizarEscalaDeEtiquetas = () => {
      const zoom = mapa.getZoom();
      const clasesDeTamano = zoom < 7
        ? ["text-xs", "px-1", "py-0"]
        : zoom < 9
          ? ["text-sm", "px-1", "py-0.5"]
          : zoom < 11
            ? ["text-base", "px-2", "py-0.5"]
            : ["text-lg", "px-2", "py-1"];
      for (const marcador of marcadoresDeEtiquetasRef.current) {
        const titulo = marcador.getElement().querySelector<HTMLElement>("[data-etiqueta-zona-general]");
        if (!titulo) continue;
        titulo.classList.remove(
          "text-xs", "text-sm", "text-base", "text-lg",
          "px-1", "px-2", "py-0", "py-0.5", "py-1",
        );
        titulo.classList.add(...clasesDeTamano);
        titulo.style.opacity = String(opacidadDelNombreDeZona(zoom));
      }
    };
    mapa.on("zoom", actualizarEscalaDeEtiquetas);

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
          el.className = cada.clase === "zona_general"
            ? "pointer-events-none"
            : miniatura
              ? "text-xs font-bold text-texto bg-superficie/80 px-1 rounded"
              : "text-base font-bold text-texto bg-superficie/80 px-2 rounded";
          if (cada.clase === "zona_general") {
            const titulo = document.createElement("span");
            titulo.dataset.etiquetaZonaGeneral = "true";
            titulo.className = "inline-block rounded bg-superficie/90 px-1 py-0 text-xs font-bold text-verde-texto transition-[font-size,opacity]";
            titulo.textContent = cada.etiqueta;
            el.appendChild(titulo);
          } else {
            el.textContent = cada.etiqueta as string;
          }
          const { latNorte, latSur, lonEste, lonOeste } = cada.rectangulo;
          // En la miniatura va en la esquina de arriba a la izquierda: en el
          // medio tapaba el punto azul de quien está parado en ese sector.
          const m = miniatura
            ? new maplibregl.Marker({ element: el, anchor: "top-left", offset: [3, 3] }).setLngLat([
                lonOeste,
                latNorte,
              ])
            : new maplibregl.Marker({ element: el }).setLngLat([
                (lonOeste + lonEste) / 2,
                (latNorte + latSur) / 2,
              ]);
          m.addTo(mapa);
          marcadoresDeEtiquetasRef.current.push(m);
        }
      }
      actualizarEscalaDeEtiquetas();

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
    return () => {
      mapa.off("zoom", actualizarEscalaDeEtiquetas);
    };
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

  /**
   * Centrar en mi posición, **solo cuando se pide**.
   *
   * Se centra una vez por pedido (el botón del GPS) y nada más. Antes el
   * centrado escuchaba también cada novedad del GPS, que llega cada uno o dos
   * segundos: el que deslizaba el mapa para mirar otra zona era llevado de
   * vuelta solo. El punto azul se mueve; el mapa queda donde el usuario lo dejó.
   */
  const posicionParaCentrarRef = useRef(posicionEfectiva);
  useEffect(() => {
    posicionParaCentrarRef.current = posicionEfectiva;
  }, [posicionEfectiva]);

  useEffect(() => {
    if (!forzarCentradoEn) return;

    // Si el pedido llega antes de que el mapa termine de armarse —el GPS
    // puede responder primero—, se hace apenas esté listo. Si no, el encuadre
    // del armado lo pisaba y el mapa quedaba lejos de donde estás.
    cuandoEsteListo(() => {
      const mapa = mapaRef.current;
      const posicion = posicionParaCentrarRef.current;
      if (!mapa || !posicion) return;
      mapa.flyTo({
        center: [posicion.lon, posicion.lat],
        zoom: mapa.getZoom() > 14 ? mapa.getZoom() : 14,
      });
    });
  }, [forzarCentradoEn]);

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
              ? alturaExtendida
                ? "relative h-144 w-full rounded-xl border border-borde sm:h-192 lg:h-[calc(100vh-13rem)]"
                : "relative h-72 w-full rounded-xl border border-borde sm:h-96 lg:h-[calc(100vh-13rem)]"
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
      {mostrarActividadesDeCaminoAlPasar && caminoBajoCursor ? (
        <div className="pointer-events-none absolute z-10 max-w-64 rounded-lg border border-borde bg-superficie px-3 py-2 text-base font-medium text-texto shadow-lg"
          style={{ left: caminoBajoCursor.x, top: caminoBajoCursor.y }}>
          {caminoBajoCursor.texto}
        </div>
      ) : null}

      {/*
        El fondo puede fallar y la app sigue andando, pero el usuario tiene que
        saberlo: si no, ve un mapa vacío y no sabe si es que no bajó nada o si
        se rompió algo.
      */}
      {!armado ? (
        <p className="absolute bottom-3 left-3 right-20 rounded-xl border border-borde bg-superficie px-3 py-2 text-sm leading-6 text-texto-suave">
          Armando el mapa…
        </p>
      ) : falloGoogle ? (
        <p role="alert" className="absolute bottom-3 left-3 right-20 rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-2 text-sm leading-6 text-ambar-texto">
          {falloGoogle}
        </p>
      ) : avisoDelFondo ? (
        <p className="absolute bottom-3 left-3 right-20 rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-2 text-sm leading-6 text-ambar-texto">
          El fondo del mapa no se pudo dibujar: {avisoDelFondo} Lo que ves —la
          ruta, tu posición y los recuadros— sigue siendo correcto.
        </p>
      ) : dibujado === 0 && !recorrido?.features.length && !caminos?.features.length && !circuito?.features.length
        && !verticesDeCamino?.length && anotaciones.length === 0 ? (
        <p className="absolute bottom-3 left-3 right-20 rounded-xl border border-borde bg-superficie px-3 py-2 text-sm leading-6 text-texto-suave">
          El mapa está armado pero no hay nada que dibujar todavía.
        </p>
      ) : null}

      {fichaSobreElMapa ? (
        <div className="pointer-events-auto absolute left-3 right-3 top-14 z-10 max-w-xs">
          {fichaSobreElMapa}
        </div>
      ) : null}

      {/*
        Arriba a la izquierda y chatos, para no tapar el mapa: Simple o
        Satelital (solo los que hay: sin ninguno bajado no aparece) con el
        círculo de las curvas al lado, y debajo el cartel de que falta mapa.
      */}
      {opcionesDeFondo.length > 0 || (!enVivo && tipoDeFondo === "satelital") || sinMapaDescargado ? (
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          <div className="flex items-center gap-1.5">
            {consultaGoogle ? (
              <span className="pointer-events-auto flex h-7 items-center rounded-full border border-borde-fuerte bg-superficie px-3 text-xs font-semibold text-texto shadow-[var(--sombra-alta)]">
                {tipoDeFondo === "google" ? "Imagen: Google · datos: TrackApp" : "Consulta · Satelital"}
              </span>
            ) : opcionesDeFondo.length > 0 ? (
              <div className="pointer-events-auto flex h-7 overflow-hidden rounded-full border border-borde-fuerte bg-superficie shadow-[var(--sombra-alta)]">
                {(
                  [
                    ["dibujo", "Simple"],
                    ["satelital", "Satelital"],
                  ] as const
                )
                  .filter(([cual]) => opcionesDeFondo.includes(cual))
                  .map(([cual, etiqueta]) => (
                    <button
                      key={cual}
                      type="button"
                      onClick={() => {
                        setTipoDeFondo(cual);
                        if (alCambiarFondo) alCambiarFondo(cual);
                      }}
                      aria-pressed={tipoDeFondo === cual}
                      className={[
                        "flex h-full items-center px-3 text-xs font-semibold transition-colors",
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

            {/*
              Curvas sobre la foto: un toque las prende o las apaga, como sol y
              noche. Apagado se ve deshabilitado. Solo con la foto guardada: en
              vivo no hay curvas.
            */}
            {!enVivo && tipoDeFondo === "satelital" ? (
              <button
                type="button"
                onPointerDown={() => vibrarAlTocar()}
                onClick={() => setCurvasSobreLaFoto((antes) => !antes)}
                aria-pressed={curvasSobreLaFoto}
                aria-label={curvasSobreLaFoto ? "Sacar las curvas de nivel" : "Mostrar las curvas de nivel"}
                title={curvasSobreLaFoto ? "Sacar las curvas de nivel" : "Mostrar las curvas de nivel"}
                className={[
                  CLASE_DE_RESPUESTA_AL_TOQUE,
                  "pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border shadow-[var(--sombra-alta)] transition-colors",
                  curvasSobreLaFoto
                    ? "border-borde-fuerte bg-texto text-fondo"
                    : "border-borde bg-superficie text-texto-suave opacity-60",
                ].join(" ")}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M3 17c3-1 5 1 8 0s5-3 10-2" />
                  <path d="M5 12.5c2.5-1.5 4.5 0 7-1s3.5-3 7-2.5" />
                  <path d="M8 8c2-1.5 3.5-.5 5.5-1.2S16 5 18 5" />
                </svg>
              </button>
            ) : null}
          </div>

          {sinMapaDescargado ? (
            <p
              role="status"
              className="rounded-full border border-ambar-borde bg-ambar-fondo px-3 py-1 text-xs font-semibold text-ambar-texto shadow-[var(--sombra-alta)]"
            >
              Sin mapa descargado
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Quien hizo la foto. Su licencia obliga a decirlo. */}
      {tipoDeFondo === "google" ? (
        <div className="pointer-events-none absolute bottom-1 left-2 right-20 flex flex-wrap items-end gap-3 text-xs leading-4 text-texto-suave">
          <span className="rounded bg-superficie px-3 pb-2 pt-3">
            {/* Los dos archivos son los logotipos oficiales, sin modificaciones. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={modo === "sol" ? "/google-maps-sol.png" : "/google-maps-noche.png"} alt="Google Maps" className="h-4 w-auto" />
          </span>
          <span className="rounded bg-superficie px-1 text-texto">{creditosGoogle ?? "Cargando créditos de Google…"}</span>
        </div>
      ) : opcionesDeFondo.includes("satelital") && tipoDeFondo === "satelital" ? (
        <p className="pointer-events-none absolute bottom-1 left-2 text-[11px] leading-4 text-texto-suave">
          {QUIEN_HIZO_LA_FOTO}
        </p>
      ) : null}

      {consultaGoogle && haySenal && !sesionGoogle && !falloGoogle && !googleNoConfigurado ? (
        <p role="status" className="pointer-events-none absolute bottom-6 left-2 rounded bg-superficie px-2 py-1 text-sm text-texto">
          Preparando imagen de Google…
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
                "flex h-10 w-10 items-center justify-center rounded-full",
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
          <BotonDeModo />
        </div>
      ) : null}

      {/*
        Abrir el mapa en grande y GPS. Van abajo a la derecha, al alcance del pulgar.
      */}
      {!pantallaCompleta && !miniatura ? (
        <div className="absolute bottom-3 right-3 flex flex-col gap-2">
          {controlesAdicionales}

          <BotonDelMapa
            etiqueta={gpsPrendido ? "Centrar" : "Ubicarme"}
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
      {mostrarFichaAnotacion ? (
        <FichaDeAnotacion
          anotacion={anotacionDeLaFicha}
          alCerrar={cerrarFichaAnotacion}
          miPerfilId={null}
          mostrarAutor={false}
          fotoRemotaAlFaltar
        />
      ) : null}
    </div>
  );
}

function BotonDelMapa({
  etiqueta,
  alTocar,
  children,
}: {
  etiqueta: string;
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
        "h-10 w-10",
      ].join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
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
