"use client";

import { useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Feature, FeatureCollection, Point, Polygon } from "geojson";
import * as maplibregl from "maplibre-gl";
import {
  capasDelFondo,
  estiloDelMapa,
  FUENTE_GOOGLE,
  TOPE_DE_ACERCAMIENTO,
  iconosDelFondo,
  opcionesDelMapa,
  QUIEN_HIZO_LA_FOTO,
  todasLasCapasDelFondo,
  type TipoDeFondo,
} from "@/components/mapa/capas-base";
import { colorDeLasCurvas, colorDeLasPartes, colorDelEnvoltorio, coloresDelMapa, type ColoresDelMapa } from "@/components/mapa/colores";
import { NIVEL_DEL_MAPA_EN_GRANDE } from "@/lib/capas";
import { useCerrarConAtras } from "@/hooks/use-cerrar-con-atras";
import type { RectanguloEnElMapa } from "@/lib/mapas/rectangulos";
import { useModo } from "@/hooks/use-modo";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { BotonDeModo } from "@/components/ui/boton-de-modo";
import { BotonCerrar } from "@/components/ui/boton-redondo";
import type { Modo } from "@/lib/modo";
import { vibrarAlTocar } from "@/lib/vibracion";
import { prepararElMotorDelMapa } from "@/lib/mapas/motor";
import { PROTOCOLO_DE_GOOGLE_EN_VIVO, registrarElMapaGuardado } from "@/lib/mapas/protocolo";
import { registrarElRelieveGuardado } from "@/lib/mapas/relieve";
import { DESCRIPCION_DESDE, descripcionCorta } from "@/lib/anotaciones/descripcion-en-el-mapa";
import { abrirSesionDeGoogle, traerCreditosDeGoogle } from "@/lib/mapas/google-cliente";
import { detalleConCreditosDeGoogle, limiteDeGoogleSinRetroceso } from "@/lib/mapas/google-acercamiento";
import {
  ALTURAS,
  CAPAS_DE_RELIEVE,
  capasDeRelieve,
  CURVAS_FINAS,
  CURVAS_GRUESAS,
  FUENTE_DE_LAS_CURVAS,
  fuenteDeLasCurvas,
} from "@/components/mapa/capas-de-relieve";
import { AvisoDeMapaFaltante } from "@/components/mapa/aviso-de-mapa-faltante";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";
import { rectanguloQueAbarca } from "@/lib/datos/rectangulo";
import { accionDeLaCamara, type VistaDelMapa } from "@/lib/mapas/vista";
import { opacidadDelNombreDeZona, zonaEnElLugar } from "@/lib/mapas/general";
import type { Anotacion, Rectangulo } from "@/types/database";
import { puntosAPie, puntosSinPaso } from "@/lib/rutas/partes";
import { FichaDeAnotacion } from "@/components/navegacion/ficha-de-anotacion";
import { LugarAlCostado } from "@/components/ui/emergente";
import type { AnotacionEnPantalla } from "@/lib/anotaciones/en-pantalla";
import { iconoDeUbicarme } from "@/components/ui/iconos";

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
 * Las X de «sin paso» y los triangulitos de «a pie con equipo» siguen el
 * acercamiento, como los íconos de los puntos. De lejos se achican y las que
 * se pisan no se dibujan: si no, a tamaño fijo se amontonan.
 */
/** Un triangulito chico, pintable de día y de noche. */
function imagenDelTriangulo(): ImageData {
  const lado = 32;
  const lienzo = document.createElement("canvas");
  lienzo.width = lado;
  lienzo.height = lado;
  const ctx = lienzo.getContext("2d");
  if (!ctx) throw new Error("El mapa no pudo preparar el triangulito de a pie con equipo.");
  ctx.clearRect(0, 0, lado, lado);
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(lado / 2, 3);
  ctx.lineTo(lado - 4, lado - 4);
  ctx.lineTo(4, lado - 4);
  ctx.closePath();
  ctx.fill();
  return ctx.getImageData(0, 0, lado, lado);
}

function agregarCrucesSinPaso(
  mapa: maplibregl.Map,
  id: string,
  source: string,
  colores: Pick<ColoresDelMapa, "parteX" | "parteXHalo">,
) {
  mapa.addLayer({
    id,
    type: "symbol",
    source,
    layout: {
      "text-field": "×",
      "text-font": ["Noto Sans Regular"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 5, 0, 8, 7, 11, 14, 13, 18, 16, 24],
      "text-allow-overlap": false,
      "text-padding": 4,
    },
    paint: {
      "text-color": colores.parteX,
      "text-halo-color": colores.parteXHalo,
      "text-halo-width": ["interpolate", ["linear"], ["zoom"], 5, 0, 11, 1, 16, 2],
    },
  });
}

/** Los triangulitos de «a pie con equipo»: misma idea que las X, más chicos. */
function agregarTriangulosAPie(
  mapa: maplibregl.Map,
  id: string,
  source: string,
  colores: Pick<ColoresDelMapa, "parteX" | "parteXHalo">,
) {
  mapa.addLayer({
    id,
    type: "symbol",
    source,
    layout: {
      "icon-image": "triangulo-a-pie",
      "icon-size": ["interpolate", ["linear"], ["zoom"], 6, 0, 9, 0.16, 12, 0.26, 15, 0.36],
      "icon-allow-overlap": false,
      "icon-padding": 1,
    },
    paint: {
      "icon-color": colores.parteX,
      "icon-halo-color": colores.parteXHalo,
      "icon-halo-width": ["interpolate", ["linear"], ["zoom"], 6, 0, 12, 0.6, 15, 1],
    },
  });
}

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
  /** Navegando, la foto lleva ríos, arroyos, senderos y huellas. */
  conLineas: boolean,
): string | null {
  try {
    for (const vieja of todasLasCapasDelFondo(modo)) {
      if (mapa.getLayer(vieja.id)) mapa.removeLayer(vieja.id);
    }

    // La sesión agrega esta fuente después de armar el mapa. Mientras tanto
    // no hay fondo que dibujar: intentar agregar la capa genera un error falso.
    if (tipo === "google" && !mapa.getSource(FUENTE_GOOGLE)) return null;

    const debajoDe = CAPAS_DE_LA_APP_DE_ABAJO_HACIA_ARRIBA.find((capa) => mapa.getLayer(capa));

    // El sombreado va con las líneas: solo cuando el mapa lee lo guardado.
    for (const capa of capasDelFondo(modo, tipo, conCurvas, conLineas, conLineas)) mapa.addLayer(capa, debajoDe);

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
  extremosDeParte?: {
    inicio: number[] | null;
    final: number[] | null;
    corte?: number[] | null;
    metrosInicio?: number | null;
    metrosFinal?: number | null;
  };
  /** Cortes que ya separan partes, mientras se está partiendo. */
  cortesMarcados?: { coordenada: number[]; metros: number }[] | null;
  /** Uno de esos cortes, elegido como inicio o final. No se dibuja otro punto. */
  corteElegido?: number[] | null;
  /** El lugar que se está señalando en el gráfico de alturas. */
  puntoSenalado?: number[] | null;
  /**
   * Otros Circuitos prendidos para ubicarse: más finos y tenues, por debajo
   * del que se navega, así nunca se confunden con él.
   */
  otrosCircuitos?: FeatureCollection | null;
  /**
   * Caminos que ya existen, finos y **por encima** de los demás, para
   * compararlos con otra línea sin que esa línea los tape (Caminos desde una
   * salida: el GPS va debajo y el Camino se sigue viendo).
   */
  caminosEncima?: FeatureCollection | null;
  /** Los puntos y trazos dibujados sobre el territorio. */
  anotaciones?: Anotacion[];
  /** Dónde está el usuario, si el GPS está andando. */
  miPosicion?: PosicionEnElMapa | null;
  /** A qué encuadrar al abrir. */
  encuadre?: Rectangulo | null;
  /**
   * Sube uno cada vez que hay que **viajar** hasta el encuadre, como al elegir
   * algo en Consultas o en Marcas. El mapa se acerca y se traslada de a poco,
   * para que se vea el camino. Sin esto, el encuadre es un salto: abrir el
   * mapa o cambiar filtros no tiene que animarse.
   */
  viaje?: number;
  /**
   * Centro y acercamiento a conservar, por ejemplo al volver de guardar un
   * Camino. Se aplica una sola vez y gana al encuadre de apertura: si no, el
   * mapa salta a la vista inicial aunque el usuario estuviera en otra zona.
   */
  vista?: VistaDelMapa | null;
  /** Avisa el lugar que se está mirando, para poder volver a él después. */
  alMoverVista?: (vista: VistaDelMapa) => void;
  /**
   * Cada vez que el mapa queda quieto, el pedazo de mundo que se está viendo.
   * Marcas lo usa para achicar la lista a lo que entra en pantalla.
   */
  alMirar?: (pedazo: Rectangulo) => void;
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
  /**
   * `true` para ocupar todo el lugar que le deja quien lo usa, como en la
   * lista y mapa de Consultas y Marcas. Sigue teniendo sus botones y el ver
   * en grande.
   */
  llenarElLugar?: boolean;
  /**
   * `true` adentro de `MapaConPanel`: en la computadora ocupa todo el alto que
   * le deja la pantalla, en vez de un alto calculado a ojo. En el celular,
   * el alto de siempre.
   */
  llenarElAltoEnLaComputadora?: boolean;
  /** Controles propios de quien usa el mapa, que viajan a pantalla completa. */
  controlesAdicionales?: ReactNode;
  /** Cierra un mapa que ya ocupa toda la pantalla, como el de una salida. */
  alCerrarPantallaCompleta?: () => void;
  /**
   * La navegación libre y la de un Circuito no llevan la cruz arriba a la
   * derecha: se toca sin querer y se cierra el mapa. Esas pantallas se salen
   * con el botón de abajo a la izquierda.
   */
  sinCruzArriba?: boolean;
  /** Cambiar este número fuerza al mapa a centrarse en la posición actual. */
  forzarCentradoEn?: number;
  /**
   * Píxeles tapados abajo, para que el centro caiga en el mapa que queda a
   * la vista. Lo usa el panel de marcar: si no, el GPS queda detrás del
   * formulario.
   */
  margenInferiorAlCentrar?: number;
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
  /** Se llama con el lugar tocado y la vista exacta de ese momento. */
  alMarcarPunto?: (lon: number, lat: number, vista: VistaDelMapa) => void;
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
   * `true` si a esta pantalla le falta mapa bajado. Arriba a la izquierda, junto
   * a Simple/Satelital, aparece un círculo ámbar con «!».
   */
  sinMapaDescargado?: boolean;
  /**
   * Lo que dice el cartel al tocar el círculo. Si no viene, «Sin mapa descargado».
   * En un Circuito es el aviso del tramo que falta, no esa frase genérica.
   */
  textoDelAvisoDeMapa?: string | null;
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

/** El pedazo de mundo que entra en el mapa ahora. */
function pedazoVisible(mapa: maplibregl.Map): Rectangulo | null {
  const limites = mapa.getBounds();
  const norte = limites.getNorth();
  const sur = limites.getSouth();
  const oeste = limites.getWest();
  const este = limites.getEast();
  if (![norte, sur, oeste, este].every(Number.isFinite) || norte <= sur) return null;
  const ancho = este - oeste;
  return {
    latNorte: norte,
    latSur: sur,
    lonOeste: ancho >= 360 ? -180 : oeste,
    lonEste: ancho >= 360 ? 180 : este,
  };
}

function limitesDe(rectangulo: Rectangulo): maplibregl.LngLatBoundsLike {
  return [
    [rectangulo.lonOeste, rectangulo.latSur],
    [rectangulo.lonEste, rectangulo.latNorte],
  ];
}

/** Las anotaciones, pasadas a algo que el mapa sepa dibujar. */
/** La capa con la descripción de los puntos (Ale, 2026-11-01). */
const DESCRIPCION_DE_PUNTOS = "anotaciones-punto-descripcion";

/** Los puntos con descripción, menos los que el usuario escondió tocándolos. */
function filtroDeDescripciones(escondidas: number[]): maplibregl.FilterSpecification {
  return [
    "all",
    ["==", ["geometry-type"], "Point"],
    ["has", "descripcion"],
    ["!=", ["get", "descripcion"], null],
    ["!", ["in", ["get", "id"], ["literal", escondidas]]],
  ];
}

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
        ...(anotacion.icono ? { icono: anotacion.icono } : {}),
        // El marco rojo de Atención: un aviso y nada más (decisión 078).
        atencion: anotacion.atencion,
        // Lo que se escribe debajo del ícono al acercarse (Ale, 2026-11-01).
        descripcion: descripcionCorta(anotacion.comentario),
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
  cortesMarcados = null,
  corteElegido = null,
  puntoSenalado = null,
  otrosCircuitos = null,
  caminosEncima = null,
  anotaciones = [],
  miPosicion = null,
  encuadre = null,
  viaje = 0,
  vista = null,
  alMoverVista,
  alMirar,
  encuadrarSoloAlAbrir = false,
  rectangulo = null,
  rectangulos = [],
  referencia = null,
  pantallaCompleta = false,
  principal = false,
  alturaExtendida = false,
  llenarElLugar = false,
  llenarElAltoEnLaComputadora = false,
  controlesAdicionales = null,
  alCerrarPantallaCompleta,
  sinCruzArriba = false,
  forzarCentradoEn,
  margenInferiorAlCentrar = 0,
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
  textoDelAvisoDeMapa = null,
  miniatura = false,
  className = "",
}: MapaProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<maplibregl.Map | null>(null);
  /** La vista del primer dibujo: el mapa nace ahí y no muestra Córdoba un instante. */
  const vistaAlAbrirRef = useRef(vista);
  /** La primera medida del lienzo ya respetó esa vista. */
  const yaMidioConVistaRef = useRef(false);
  const alMoverVistaRef = useRef(alMoverVista);
  const alMirarRef = useRef(alMirar);
  useEffect(() => { alMoverVistaRef.current = alMoverVista; }, [alMoverVista]);
  useEffect(() => { alMirarRef.current = alMirar; }, [alMirar]);
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
  /** Las descripciones que el usuario escondió. Vuelven al salir de este mapa. */
  const [descripcionesEscondidas, setDescripcionesEscondidas] = useState<number[]>([]);
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
  const [tipoElegido, setTipoDeFondo] = useState<TipoDeFondo>(consultaGoogle && enVivo ? "google" : fondoInicial);
  const [sesionGoogle, setSesionGoogle] = useState<string | null>(null);
  const [googleNoConfigurado, setGoogleNoConfigurado] = useState(false);
  const [creditosGoogle, setCreditosGoogle] = useState<string | null>(null);
  const [avisoDeCreditosGoogle, setAvisoDeCreditosGoogle] = useState<string | null>(null);
  const [avisoDeImagenGoogle, setAvisoDeImagenGoogle] = useState<string | null>(null);
  const [falloGoogle, setFalloGoogle] = useState<string | null>(null);
  const sesionGoogleActiva = consultaGoogle && enVivo && haySenal ? sesionGoogle : null;
  const opcionesDeFondo = opcionesDelMapa({
    enVivo, consultaGoogle, fondosDescargados: fondosDisponibles ?? [],
  });
  const falloVisibleDeGoogle = consultaGoogle && enVivo
    ? !haySenal
      ? "Sin conexión no se puede mostrar Google. Volvé a abrir esta consulta cuando tengas señal."
      : googleNoConfigurado
        ? "Google no está configurado en la app. Revisá su configuración para mostrar este mapa."
        : (falloGoogle ?? avisoDeImagenGoogle)
    : null;
  const preparandoGoogle = consultaGoogle && enVivo && haySenal && !sesionGoogle && !falloVisibleDeGoogle;
  /**
   * Las curvas sobre la foto se prenden y apagan (decisión 013). En el mapa
   * simple no hay botón: se ven siempre.
   */
  const [curvasSobreLaFoto, setCurvasSobreLaFoto] = useState(true);
  /** El que se ve: el elegido si está bajado; si no, el que haya. */
  const tipoDeFondo: TipoDeFondo = opcionesDeFondo.includes(tipoElegido)
    ? tipoElegido
    : (opcionesDeFondo[0] ?? "dibujo");
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
          const motivo = error instanceof Error ? error.message : String(error);
          setFalloGoogle(`No se pudo abrir Google: ${motivo}. Volvé a abrir esta pantalla para reintentar.`);
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
          // Pasa por el protocolo que, además de mostrarla, la guarda el tiempo
          // que Google permite (decisión 080).
          tiles: [`${PROTOCOLO_DE_GOOGLE_EN_VIVO}://{z}/{x}/{y}?sesion=${encodeURIComponent(sesionGoogleActiva)}`],
          tileSize: 256,
          maxzoom: 22,
        });
      }
      setAvisoDelFondo(ponerElFondo(mapa, modoRef.current, tipoDeFondoRef.current, curvasRef.current, !enVivoRef.current));
    });
  }, [sesionGoogleActiva]);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    if (tipoDeFondo !== "google") {
      // Si estaba más cerca que el tope, el mapa se aleja solo hasta el tope.
      mapa.setMaxZoom(TOPE_DE_ACERCAMIENTO[tipoDeFondo]);
      return;
    }
    if (!sesionGoogleActiva) {
      mapa.setMaxZoom(22);
      return;
    }
    let activo = true;
    let pedido = 0;
    const actualizar = () => {
      if (!listoRef.current) return;
      const actual = ++pedido;
      setCreditosGoogle(null);
      setAvisoDeCreditosGoogle(null);
      setAvisoDeImagenGoogle(null);
      const limites = mapa.getBounds();
      const normalizar = (valor: number) => ((valor + 180) % 360 + 360) % 360 - 180;
      const ancho = limites.getEast() - limites.getWest();
      const consulta = new URLSearchParams({
        sesion: sesionGoogleActiva,
        zoom: String(Math.max(0, Math.min(22, Math.floor(mapa.getZoom())))),
        north: String(Math.min(89.999, limites.getNorth())),
        south: String(Math.max(-89.999, limites.getSouth())),
        west: String(ancho >= 360 ? -179.999 : normalizar(limites.getWest())),
        east: String(ancho >= 360 ? 179.999 : normalizar(limites.getEast())),
      });
      void (async () => {
        try {
          const detalle = await detalleConCreditosDeGoogle(
            consulta, mapa.getCenter(), traerCreditosDeGoogle, () => activo && actual === pedido,
            (maximo) => {
              // El límite llega con la primera respuesta, aunque los créditos
              // requieran más pedidos. Nunca alejar por una respuesta tardía.
              mapa.setMaxZoom(limiteDeGoogleSinRetroceso(mapa.getMaxZoom(), mapa.getZoom(), maximo));
            },
          );
          if (!detalle) return;
          if (detalle.derechos) setCreditosGoogle(detalle.derechos);
          else setAvisoDeCreditosGoogle("Google no informó los créditos de esta vista. Mové el mapa para reintentar.");
        } catch (error) {
          if (activo && actual === pedido) {
            const motivo = error instanceof Error ? error.message : String(error);
            setAvisoDeCreditosGoogle(`Google no pudo informar los créditos: ${motivo}. Mové el mapa para reintentar.`);
          }
        }
      })();
    };
    mapa.on("moveend", actualizar);
    cuandoEsteListo(actualizar);
    return () => {
      activo = false;
      mapa.off("moveend", actualizar);
    };
  }, [sesionGoogleActiva, tipoDeFondo]);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !armado) return;
    const pedazo = pedazoVisible(mapa);
    if (pedazo) alMirarRef.current?.(pedazo);
  }, [armado]);

  // Armado del mapa. Una sola vez.
  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current) return;
    let esperaDeImagenGoogle: ReturnType<typeof setTimeout> | null = null;

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
      // Si hay que conservar un lugar, nace ahí: si no, se ve el salto.
      center: vistaAlAbrirRef.current
        ? [vistaAlAbrirRef.current.lon, vistaAlAbrirRef.current.lat]
        : [-64.5, -31.5],
      zoom: vistaAlAbrirRef.current?.zoom ?? 9,
      attributionControl: false,
      // Los controles propios de la librería son chicos: se usan los de la app.
      dragRotate: false,
    });

    mapa.touchZoomRotate.disableRotation();

    mapa.on("load", () => {
      const colores = coloresDelMapa();
      const conEnvoltorio = tipoDeFondoRef.current !== "dibujo" || modoRef.current === "noche";
      const envoltorio = colorDelEnvoltorio(conEnvoltorio, colores);

      mapa.addSource(FUENTE_RECTANGULOS, { type: "geojson", data: VACIO });
      mapa.addSource(FUENTE_RUTA, { type: "geojson", data: VACIO });
      mapa.addSource(FUENTE_CAMINOS, { type: "geojson", data: VACIO });
      mapa.addSource(FUENTE_CIRCUITO, { type: "geojson", data: VACIO });
      mapa.addSource(FUENTE_FINAL_CONSERVADO, { type: "geojson", data: VACIO });
      if (!mapa.hasImage("triangulo-a-pie")) {
        mapa.addImage("triangulo-a-pie", imagenDelTriangulo(), { sdf: true });
      }
      mapa.addSource("x-sin-paso-circuito", { type: "geojson", data: VACIO });
      mapa.addSource("triangulos-a-pie-circuito", { type: "geojson", data: VACIO });
      mapa.addSource("vertices-de-camino", { type: "geojson", data: VACIO });
      mapa.addSource("x-sin-paso-caminos", { type: "geojson", data: VACIO });
      mapa.addSource("triangulos-a-pie-caminos", { type: "geojson", data: VACIO });
      mapa.addSource("x-sin-paso", { type: "geojson", data: VACIO });
      mapa.addSource("triangulos-a-pie", { type: "geojson", data: VACIO });
      mapa.addSource("extremos-de-parte", { type: "geojson", data: VACIO, generateId: true });
      mapa.addSource("cortes-marcados", { type: "geojson", data: VACIO, generateId: true });
      mapa.addSource("punto-senalado", { type: "geojson", data: VACIO });
      mapa.addSource("otros-circuitos", { type: "geojson", data: VACIO });
      mapa.addSource("caminos-encima", { type: "geojson", data: VACIO });
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

      const colorDeParte = colorDeLasPartes(colores) as maplibregl.ExpressionSpecification;
      mapa.addLayer({
        id: "parte-elegida", type: "line", source: FUENTE_CAMINOS,
        filter: ["==", ["get", "elegida"], true],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": colores.marcaDeParte, "line-width": 10, "line-opacity": 0.95 },
      });
      mapa.addLayer({
        id: `${CAPAS_DE_CAMINOS[0]}-borde`, type: "line", source: FUENTE_CAMINOS,
        filter: ["==", ["get", "paso"], "otra_actividad"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": colores.caminoSecundarioBorde, "line-width": colores.caminoSecundarioBordeAncho, "line-opacity": 1 },
      });
      mapa.addLayer({
        id: CAPAS_DE_CAMINOS[0], type: "line", source: FUENTE_CAMINOS,
        filter: ["==", ["get", "paso"], "otra_actividad"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": colores.caminoSecundario, "line-width": colores.caminoSecundarioAncho, "line-opacity": 1 },
      });
      for (const [paso, capa, guiones] of [
        ["por_explorar", CAPAS_DE_CAMINOS[1], [2.4, 1.5]],
        ["transitable", CAPAS_DE_CAMINOS[2], null],
        ["a_pie", CAPAS_DE_CAMINOS[3], null],
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
          paint: { "line-color": envoltorio, "line-width": 8, "line-opacity": conEnvoltorio ? 0.95 : 0 },
        });
        mapa.addLayer({ id: capa, type: "line", source: FUENTE_CAMINOS, filter: filtro,
          layout: { "line-cap": "round", "line-join": "round" }, paint: estilo });
      }
      mapa.addLayer({
        id: "actividades-de-caminos", type: "symbol", source: FUENTE_CAMINOS, minzoom: 13,
        filter: ["has", "icono_actividades"],
        layout: { "symbol-placement": "line", "symbol-spacing": 320,
          "icon-image": ["get", "icono_actividades"], "icon-size": 0.75,
          "icon-rotation-alignment": "viewport", "icon-allow-overlap": false,
          "icon-padding": 12 },
      });
      agregarCrucesSinPaso(mapa, "camino-sin-paso-x", "x-sin-paso-caminos", colores);
      agregarTriangulosAPie(mapa, "camino-a-pie-triangulo", "triangulos-a-pie-caminos", colores);
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
        ["a_pie", CAPAS_DEL_CIRCUITO[3], null],
        ["sin_paso", CAPAS_DEL_CIRCUITO[4], null],
      ] as const) {
        const filtro: maplibregl.FilterSpecification = ["all", ["==", ["get", "clase"], "camino"], ["==", ["get", "paso"], paso]];
        const opacidad: maplibregl.ExpressionSpecification = ["case", ["==", ["get", "otra_actividad"], true], 0.72, 1];
        mapa.addLayer({ id: `${capa}-borde`, type: "line", source: FUENTE_CIRCUITO,
          filter: filtro, layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": envoltorio, "line-width": 10, "line-opacity": conEnvoltorio ? opacidad : 0 } });
        mapa.addLayer({ id: capa, type: "line", source: FUENTE_CIRCUITO,
          filter: filtro, layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": colorDeParte, "line-width": 7, "line-opacity": opacidad,
            ...(guiones ? { "line-dasharray": [...guiones] } : {}) } });
      }
      agregarCrucesSinPaso(mapa, "circuito-sin-paso-x", "x-sin-paso-circuito", colores);
      agregarTriangulosAPie(mapa, "circuito-a-pie-triangulo", "triangulos-a-pie-circuito", colores);
      mapa.addLayer({ id: "circuito-final-conservado", type: "circle", source: FUENTE_FINAL_CONSERVADO,
        paint: { "circle-color": colores.circuitoPropio, "circle-radius": 7,
          "circle-stroke-color": colores.circuitoBorde, "circle-stroke-width": 3 } });
      mapa.addLayer({ id: "circuito-final-conservado-nombre", type: "symbol", source: FUENTE_FINAL_CONSERVADO,
        layout: { "text-field": "Fin marcado", "text-font": ["Noto Sans Regular"],
          "text-size": 15, "text-offset": [0, 1.6], "text-allow-overlap": true },
        paint: { "text-color": colores.circuitoPropio, "text-halo-color": colores.circuitoBorde, "text-halo-width": 2 } });
      mapa.addLayer({ id: "caminos-encima-borde", type: "line", source: "caminos-encima",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": colores.caminoSecundarioBorde, "line-width": colores.caminoSecundarioBordeAncho } });
      mapa.addLayer({ id: "caminos-encima", type: "line", source: "caminos-encima",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": colores.caminoSecundario, "line-width": colores.caminoSecundarioAncho } });
      mapa.addLayer({
        id: "vertices-de-camino", type: "circle", source: "vertices-de-camino",
        paint: { "circle-radius": 7, "circle-color": colores.rectanguloNuevo,
          "circle-stroke-width": 3, "circle-stroke-color": colores.parteX },
      });
      for (const [paso, capa, guiones] of [
        ["por_explorar", CAPAS_DE_PARTES[0], [2.4, 1.5]],
        ["transitable", CAPAS_DE_PARTES[1], null],
        ["a_pie", CAPAS_DE_PARTES[2], null],
        ["sin_paso", CAPAS_DE_PARTES[3], null],
      ] as const) {
        const filtroDeParte: maplibregl.FilterSpecification = ["==", ["coalesce", ["get", "paso"], "por_explorar"], paso];
        mapa.addLayer({
          id: `${capa}-borde`,
          type: "line",
          source: FUENTE_RUTA,
          filter: filtroDeParte,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": envoltorio, "line-width": 8, "line-opacity": conEnvoltorio ? 0.95 : 0 },
        });
        mapa.addLayer({
          id: capa,
          type: "line",
          source: FUENTE_RUTA,
          filter: filtroDeParte,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": colorDeParte,
            "line-width": 5,
            "line-opacity": 0.98,
            ...(guiones ? { "line-dasharray": [...guiones] } : {}),
          },
        });
      }
      agregarCrucesSinPaso(mapa, "ruta-sin-paso-x", "x-sin-paso", colores);
      agregarTriangulosAPie(mapa, "ruta-a-pie-triangulo", "triangulos-a-pie", colores);
      mapa.addLayer({
        id: "cortes-marcados",
        type: "circle",
        source: "cortes-marcados",
        paint: {
          "circle-radius": ["case", ["any", ["boolean", ["feature-state", "encima"], false], ["==", ["get", "elegido"], true]], 11, 7],
          "circle-color": ["case", ["==", ["get", "elegido"], true], colores.marcaDeParte, colores.marcaDeCorte],
          "circle-stroke-width": ["case", ["any", ["boolean", ["feature-state", "encima"], false], ["==", ["get", "elegido"], true]], 4, 2],
          "circle-stroke-color": colores.parteXHalo,
        },
      });
      mapa.addLayer({
        id: "extremos-de-parte-punto",
        type: "circle",
        source: "extremos-de-parte",
        paint: {
          "circle-radius": ["case", ["boolean", ["feature-state", "encima"], false], 13, 9],
          "circle-color": colores.marcaDeParte,
          "circle-stroke-width": ["case", ["boolean", ["feature-state", "encima"], false], 5, 3],
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

      // Debajo del ícono y más grande que él: el rojo asoma alrededor del
      // dibujo. Crece con el zoom en la misma proporción que el ícono. Nunca
      // se esconde por chocar con otro: un aviso no desaparece antes que un dato.
      mapa.addLayer({
        id: "anotaciones-punto-atencion",
        type: "symbol",
        source: FUENTE_ANOTACIONES,
        filter: ["all", ["==", ["geometry-type"], "Point"], ["==", ["get", "atencion"], true]],
        layout: {
          "icon-image": "marco-de-atencion",
          "icon-size": ["interpolate", ["linear"], ["zoom"], 5, 0, 6, 0.2, 7, 0.35, 9, 0.65, 11, 1, 13, 1.2],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
        paint: {
          "icon-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0, 6, 0.1, 7, 0.25, 9, 0.6, 11, 1],
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
            "estacionamiento", "estacionamiento",
            "sitio", "sitio",
            // La misma carpa que los campings que trae el mapa.
            "campamento", "camp_site",
            "casa", "casa",
            "none"
          ],
          "icon-size": ["interpolate", ["linear"], ["zoom"], 5, 0, 6, 0.2, 7, 0.35, 9, 0.65, 11, 1, 13, 1.2],
          "icon-allow-overlap": false,
        },
        paint: {
          "icon-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0, 6, 0.1, 7, 0.25, 9, 0.6, 11, 1],
        },
      });

      // La descripción del punto, debajo del ícono, al acercarse. Tocarla la
      // esconde hasta salir de este mapa (Ale, 2026-11-01). Si choca con otro
      // texto, el mapa muestra uno: nunca tapa el ícono.
      mapa.addLayer({
        id: DESCRIPCION_DE_PUNTOS,
        type: "symbol",
        source: FUENTE_ANOTACIONES,
        minzoom: DESCRIPCION_DESDE,
        filter: filtroDeDescripciones([]),
        layout: {
          "text-field": ["get", "descripcion"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 15,
          "text-anchor": "top",
          "text-offset": [0, 1.4],
          "text-max-width": 12,
        },
        paint: {
          "text-color": colores.texto,
          "text-halo-color": colores.contorno,
          "text-halo-width": 2,
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
        ponerElFondo(mapa, modoRef.current, tipoDeFondoRef.current, curvasRef.current, !enVivoRef.current),
      );
    });

    // Un fondo que no carga no puede quedarse callado.
    mapa.on("error", (evento) => {
      const motivo = evento?.error?.message;
      if (motivo) {
        if (tipoDeFondoRef.current === "google") {
          // Una tesela demasiado cercana puede fallar antes de que llegue el
          // nivel máximo del área. Esperamos a que el mapa vuelva a ese nivel.
          if (!esperaDeImagenGoogle) {
            const nivelFallido = mapa.getZoom();
            esperaDeImagenGoogle = setTimeout(() => {
              esperaDeImagenGoogle = null;
              if (tipoDeFondoRef.current === "google" && mapa.getZoom() >= nivelFallido - 0.01) {
                const motivoVisible = motivo.replace(/sesion=[^&\s)]+/g, "sesion=[oculta]");
                setAvisoDeImagenGoogle(`Google no pudo mostrar este nivel: ${motivoVisible}. Alejate un poco o volvé a intentarlo.`);
              }
            }, 5_000);
          }
        } else setAvisoDelFondo(motivo);
      }
    });

    mapaRef.current = mapa;
    const avisarLaVista = () => {
      const avisar = alMoverVistaRef.current;
      if (avisar) {
        const centro = mapa.getCenter();
        avisar({ lon: centro.lng, lat: centro.lat, zoom: mapa.getZoom() });
      }
      const pedazo = pedazoVisible(mapa);
      if (pedazo) alMirarRef.current?.(pedazo);
    };
    mapa.on("moveend", avisarLaVista);
    mapa.on("resize", avisarLaVista);

    return () => {
      if (esperaDeImagenGoogle) clearTimeout(esperaDeImagenGoogle);
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
      setAvisoDelFondo(ponerElFondo(mapa, modo, tipoDeFondo, conCurvas, !enVivo));

      const colorDeParte = colorDeLasPartes(colores) as maplibregl.ExpressionSpecification;
      const conEnvoltorio = tipoDeFondo !== "dibujo" || modo === "noche";
      const envoltorio = colorDelEnvoltorio(conEnvoltorio, colores);
      const opacidadDelBorde = conEnvoltorio ? 0.95 : 0;
      const opacidadDelCircuito: maplibregl.ExpressionSpecification | number = conEnvoltorio
        ? ["case", ["==", ["get", "otra_actividad"], true], 0.72, 1]
        : 0;
      for (const capa of CAPAS_DE_PARTES) {
        mapa.setPaintProperty(capa, "line-color", colorDeParte);
        mapa.setPaintProperty(`${capa}-borde`, "line-color", envoltorio);
        mapa.setPaintProperty(`${capa}-borde`, "line-opacity", opacidadDelBorde);
      }
      mapa.setPaintProperty(`${CAPAS_DE_CAMINOS[0]}-borde`, "line-color", colores.caminoSecundarioBorde);
      mapa.setPaintProperty(`${CAPAS_DE_CAMINOS[0]}-borde`, "line-opacity", 1);
      for (const capa of CAPAS_DE_CAMINOS.slice(1)) {
        mapa.setPaintProperty(capa, "line-color", colorDeParte);
        mapa.setPaintProperty(`${capa}-borde`, "line-color", envoltorio);
        mapa.setPaintProperty(`${capa}-borde`, "line-opacity", opacidadDelBorde);
      }
      mapa.setPaintProperty(CAPAS_DEL_CIRCUITO[0], "line-color", colores.circuitoPropio);
      mapa.setPaintProperty("circuito-propio-borde", "line-color", colores.circuitoBorde);
      for (const capa of CAPAS_DEL_CIRCUITO.slice(1)) {
        mapa.setPaintProperty(capa, "line-color", colorDeParte);
        mapa.setPaintProperty(`${capa}-borde`, "line-color", envoltorio);
        mapa.setPaintProperty(`${capa}-borde`, "line-opacity", opacidadDelCircuito);
      }
      mapa.setPaintProperty("circuito-sin-paso-x", "text-color", colores.parteX);
      mapa.setPaintProperty("circuito-sin-paso-x", "text-halo-color", colores.parteXHalo);
      mapa.setPaintProperty("circuito-a-pie-triangulo", "icon-color", colores.parteX);
      mapa.setPaintProperty("circuito-a-pie-triangulo", "icon-halo-color", colores.parteXHalo);
      mapa.setPaintProperty("circuito-final-conservado", "circle-color", colores.circuitoPropio);
      mapa.setPaintProperty("circuito-final-conservado", "circle-stroke-color", colores.circuitoBorde);
      mapa.setPaintProperty("circuito-final-conservado-nombre", "text-color", colores.circuitoPropio);
      mapa.setPaintProperty("circuito-final-conservado-nombre", "text-halo-color", colores.circuitoBorde);
      mapa.setPaintProperty(CAPAS_DE_CAMINOS[0], "line-color", colores.caminoSecundario);
      mapa.setPaintProperty("camino-sin-paso-x", "text-color", colores.parteX);
      mapa.setPaintProperty("camino-sin-paso-x", "text-halo-color", colores.parteXHalo);
      mapa.setPaintProperty("camino-a-pie-triangulo", "icon-color", colores.parteX);
      mapa.setPaintProperty("camino-a-pie-triangulo", "icon-halo-color", colores.parteXHalo);
      mapa.setPaintProperty("vertices-de-camino", "circle-color", colores.rectanguloNuevo);
      mapa.setPaintProperty("vertices-de-camino", "circle-stroke-color", colores.parteX);
      mapa.setPaintProperty("ruta-sin-paso-x", "text-color", colores.parteX);
      mapa.setPaintProperty("ruta-sin-paso-x", "text-halo-color", colores.parteXHalo);
      mapa.setPaintProperty("ruta-a-pie-triangulo", "icon-color", colores.parteX);
      mapa.setPaintProperty("ruta-a-pie-triangulo", "icon-halo-color", colores.parteXHalo);
      mapa.setPaintProperty("parte-elegida", "line-color", colores.marcaDeParte);
      mapa.setPaintProperty("cortes-marcados", "circle-color", ["case", ["==", ["get", "elegido"], true], colores.marcaDeParte, colores.marcaDeCorte]);
      mapa.setPaintProperty("extremos-de-parte-punto", "circle-color", colores.marcaDeParte);
      mapa.setPaintProperty("extremos-de-parte-punto", "circle-stroke-color", colores.parteXHalo);
      mapa.setPaintProperty("extremos-de-parte-nombre", "text-color", colores.parteX);
      mapa.setPaintProperty("extremos-de-parte-nombre", "text-halo-color", colores.parteXHalo);
      mapa.setPaintProperty("otros-circuitos", "line-color", colores.circuitoPropio);
      mapa.setPaintProperty("caminos-encima-borde", "line-color", colores.caminoSecundarioBorde);
      mapa.setPaintProperty("caminos-encima", "line-color", colores.caminoSecundario);
      mapa.setPaintProperty("punto-senalado", "circle-color", colores.parteX);
      mapa.setPaintProperty("punto-senalado", "circle-stroke-color", colores.parteXHalo);
      mapa.setPaintProperty(DESCRIPCION_DE_PUNTOS, "text-color", colores.texto);
      mapa.setPaintProperty(DESCRIPCION_DE_PUNTOS, "text-halo-color", colores.contorno);
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
        const colorDeCurva = colorDeLasCurvas(tipoDeFondo === "satelital", colores);
        for (const capa of [CURVAS_FINAS, CURVAS_GRUESAS]) {
          mapa.setPaintProperty(capa, "line-color", colorDeCurva);
        }
        mapa.setPaintProperty(ALTURAS, "text-color", colorDeCurva);
        mapa.setPaintProperty(ALTURAS, "text-halo-color", colores.contorno);
      }
    };

    cuandoEsteListo(pintar);
  }, [modo, tipoDeFondo, conCurvas, enVivo]);

  // La línea de la ruta.
  const yaEncuadroRef = useRef(false);
  /** La vista ya puesta. Otra distinta sí se aplica; la misma no vuelve a saltar. */
  const vistaAplicadaRef = useRef<VistaDelMapa | null>(null);
  /** El último viaje que ya se animó. El primero (abrir) no viaja: salta. */
  const viajeVisto = useRef(viaje);
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    let vigente = true;
    const viajar = viaje !== viajeVisto.current;

    const poner = () => {
      if (!vigente) return;
      ponerDatos(mapa, FUENTE_RUTA, recorrido ?? VACIO);
      ponerDatos(mapa, "x-sin-paso", recorrido ? puntosSinPaso(recorrido) : VACIO);
      ponerDatos(mapa, "triangulos-a-pie", recorrido ? puntosAPie(recorrido) : VACIO);

      // `viaje` se anima aunque el mapa ya se haya encuadrado al abrir: si no,
      // buscar un lugar en un Camino nuevo no movería la vista.
      if (viajar) viajeVisto.current = viaje;
      const accion = accionDeLaCamara({
        hayVistaNueva: vista !== null && vistaAplicadaRef.current !== vista,
        hayEncuadre: encuadre !== null,
        viajar,
        encuadrarSoloAlAbrir,
        yaEncuadro: yaEncuadroRef.current,
      });
      if (accion === "vista" && vista) {
        mapa.jumpTo({ center: [vista.lon, vista.lat], zoom: vista.zoom });
        vistaAplicadaRef.current = vista;
        yaEncuadroRef.current = true;
      } else if (accion === "encuadre" && encuadre) {
        // Sin `maxDuration`: si el viaje calculado lo pasa, el mapa lo corta
        // de golpe en vez de acortarlo.
        mapa.fitBounds(limitesDe(encuadre), viajar
          ? { padding: 28, speed: 1.2, curve: 1.42 }
          : { padding: 28, animate: false });
        yaEncuadroRef.current = true;
      }
    };

    // Un cuadro de espera: si el efecto se descarta al toque y se vuelve a
    // correr, no arranca un viaje que el segundo pase pisaría con un salto.
    if (viajar) {
      const frame = requestAnimationFrame(() => {
        if (vigente) cuandoEsteListo(poner);
      });
      return () => {
        vigente = false;
        cancelAnimationFrame(frame);
      };
    }

    cuandoEsteListo(poner);
    return () => { vigente = false; };
  }, [recorrido, encuadre, encuadrarSoloAlAbrir, viaje, vista]);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    cuandoEsteListo(() => {
      ponerDatos(mapa, FUENTE_CAMINOS, caminos ?? VACIO);
      ponerDatos(mapa, "x-sin-paso-caminos", caminos ? puntosSinPaso(caminos) : VACIO);
      ponerDatos(mapa, "triangulos-a-pie-caminos", caminos ? puntosAPie(caminos) : VACIO);
    });
  }, [caminos]);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    cuandoEsteListo(() => {
      ponerDatos(mapa, FUENTE_CIRCUITO, circuito ?? VACIO);
      ponerDatos(mapa, "x-sin-paso-circuito", circuito ? puntosSinPaso(circuito) : VACIO);
      ponerDatos(mapa, "triangulos-a-pie-circuito", circuito ? puntosAPie(circuito) : VACIO);
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
        ["Inicio", extremosDeParte?.inicio, extremosDeParte?.metrosInicio],
        ["Final", extremosDeParte?.final, extremosDeParte?.metrosFinal],
        ["Desde acá", extremosDeParte?.corte, null],
      ] as const).filter(([, punto]) => punto && punto.length >= 2).map(([nombre, punto, metros]) => ({
        type: "Feature" as const,
        properties: { nombre, metros: metros ?? null },
        geometry: { type: "Point" as const, coordinates: punto! },
      })),
    }));
  }, [extremosDeParte]);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    cuandoEsteListo(() => ponerDatos(mapa, "cortes-marcados", {
      type: "FeatureCollection",
      features: (cortesMarcados ?? []).filter((corte) => corte?.coordenada?.length >= 2).map((corte) => ({
        type: "Feature" as const,
        properties: {
          metros: corte.metros,
          elegido: corteElegido !== null && Math.hypot(corte.coordenada[0] - corteElegido[0], corte.coordenada[1] - corteElegido[1]) < 1e-8,
        },
        geometry: { type: "Point" as const, coordinates: corte.coordenada },
      })),
    }));
  }, [cortesMarcados, corteElegido]);

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

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    cuandoEsteListo(() => ponerDatos(mapa, "caminos-encima", caminosEncima ?? VACIO));
  }, [caminosEncima]);

  // Las descripciones escondidas a mano.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    cuandoEsteListo(() => {
      if (mapa.getLayer(DESCRIPCION_DE_PUNTOS)) {
        mapa.setFilter(DESCRIPCION_DE_PUNTOS, filtroDeDescripciones(descripcionesEscondidas));
      }
    });
  }, [descripcionesEscondidas]);

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
      const centro = mapa.getCenter();
      alMarcarPunto(evento.lngLat.lng, evento.lngLat.lat, {
        lon: centro.lng, lat: centro.lat, zoom: mapa.getZoom(),
      });
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
      const capas = [...CAPAS_DE_CAMINOS, ...CAPAS_DEL_CIRCUITO.slice(1)].filter((capa) => mapa.getLayer(capa));
      if (capas.length === 0) return null;
      const { x, y } = evento.point;
      return mapa.queryRenderedFeatures([[x - 9, y - 9], [x + 9, y + 9]], { layers: capas })[0] ?? null;
    };
    let corteEncima: { source: string; id: number } | null = null;
    const marcarCorte = (evento: maplibregl.MapMouseEvent) => {
      const capas = ["cortes-marcados", "extremos-de-parte-punto"].filter((capa) => mapa.getLayer(capa));
      const margen = 14;
      const encontrados = capas.length > 0
        ? mapa.queryRenderedFeatures(
          [[evento.point.x - margen, evento.point.y - margen], [evento.point.x + margen, evento.point.y + margen]],
          { layers: capas },
        )
        : [];
      const encontrado = encontrados
        .filter((cada) => cada.geometry.type === "Point" && typeof cada.id === "number")
        .map((cada) => {
          const [lon, lat] = cada.geometry.type === "Point" ? cada.geometry.coordinates : [0, 0];
          const enPantalla = mapa.project([lon, lat]);
          return { cada, distancia: Math.hypot(enPantalla.x - evento.point.x, enPantalla.y - evento.point.y) };
        })
        .filter((cada) => cada.distancia <= margen)
        .sort((a, b) => a.distancia - b.distancia)[0]?.cada;
      if (corteEncima) mapa.setFeatureState(corteEncima, { encima: false });
      if (encontrado && typeof encontrado.id === "number") {
        corteEncima = { source: encontrado.source, id: encontrado.id };
        mapa.setFeatureState(corteEncima, { encima: true });
        return true;
      }
      corteEncima = null;
      return false;
    };
    const mover = (evento: maplibregl.MapMouseEvent) => {
      const sobreCorte = marcarCorte(evento);
      const sobrePunto = ["anotaciones-punto", DESCRIPCION_DE_PUNTOS].some((capa) =>
        mapa.getLayer(capa) ? mapa.queryRenderedFeatures(evento.point, { layers: [capa] }).length > 0 : false,
      );
      const sobreZona = alSenalarZona ? buscarZona(evento) !== null : false;
      const sobreRuta = alTocarRuta ? buscarRuta(evento) !== null : false;
      const caminoEncontrado = alTocarCamino || mostrarActividadesDeCaminoAlPasar || alMarcarPuntoDelCircuito
        ? buscarCamino(evento) : null;
      const sobreCamino = caminoEncontrado !== null;
      mapa.getCanvas().style.cursor = alMarcarPuntoDelCircuito ? "crosshair"
        : sobreCorte || sobrePunto || sobreZona || sobreRuta || sobreCamino ? "pointer" : "";
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
      // Tocar la descripción de un punto la esconde; tocar el ícono abre la ficha.
      const descripcion = mapa.getLayer(DESCRIPCION_DE_PUNTOS)
        ? mapa.queryRenderedFeatures(evento.point, { layers: [DESCRIPCION_DE_PUNTOS] })[0]
        : undefined;
      const idDeLaDescripcion = descripcion?.properties?.id;
      if (typeof idDeLaDescripcion === "number") {
        setDescripcionesEscondidas((actuales) =>
          actuales.includes(idDeLaDescripcion) ? actuales : [...actuales, idDeLaDescripcion],
        );
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
        const capasDeCorte = ["cortes-marcados", "extremos-de-parte-punto"].filter((capa) => mapa.getLayer(capa));
        const margenDelPunto = 14;
        const cortes = capasDeCorte.length > 0
          ? mapa.queryRenderedFeatures(
            [[evento.point.x - margenDelPunto, evento.point.y - margenDelPunto], [evento.point.x + margenDelPunto, evento.point.y + margenDelPunto]],
            { layers: capasDeCorte },
          )
          : [];
        const corte = cortes
          .filter((cada) => cada.geometry.type === "Point")
          .map((cada) => {
            const [lon, lat] = cada.geometry.type === "Point" ? cada.geometry.coordinates : [0, 0];
            const enPantalla = mapa.project([lon, lat]);
            return { cada, distancia: Math.hypot(enPantalla.x - evento.point.x, enPantalla.y - evento.point.y) };
          })
          .filter((cada) => cada.distancia <= margenDelPunto)
          .sort((a, b) => a.distancia - b.distancia)[0]?.cada;
        const parte = buscarCamino(evento);
        if (corte?.geometry.type === "Point") {
          const [lon, lat] = corte.geometry.coordinates;
          alTocarCamino(lon, lat, { ...(parte?.properties ?? {}), metros: corte.properties?.metros });
          alSenalarZona?.(null);
          return;
        }
        if (parte) {
          alTocarCamino(evento.lngLat.lng, evento.lngLat.lat, parte.properties ?? {});
          alSenalarZona?.(null);
          return;
        }
      }
      if (alSenalarZona) alSenalarZona(buscarZona(evento));
    };
    const salir = () => {
      if (corteEncima) mapa.setFeatureState(corteEncima, { encima: false });
      corteEncima = null;
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

  const margenAlCentrarRef = useRef(margenInferiorAlCentrar);
  useEffect(() => {
    margenAlCentrarRef.current = margenInferiorAlCentrar;
  }, [margenInferiorAlCentrar]);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    const alto = mapa.getContainer().clientHeight;
    const abajo = margenInferiorAlCentrar <= 0
      ? 0
      : Math.min(margenInferiorAlCentrar, Math.max(0, alto - 80));
    mapa.setPadding({ top: 0, bottom: abajo, left: 0, right: 0 });
  }, [margenInferiorAlCentrar]);

  useEffect(() => {
    if (!forzarCentradoEn) return;

    // Si el pedido llega antes de que el mapa termine de armarse —el GPS
    // puede responder primero—, se hace apenas esté listo. Si no, el encuadre
    // del armado lo pisaba y el mapa quedaba lejos de donde estás.
    cuandoEsteListo(() => {
      const mapa = mapaRef.current;
      const posicion = posicionParaCentrarRef.current;
      if (!mapa || !posicion) return;
      const alto = mapa.getContainer().clientHeight;
      const abajo = Math.min(margenAlCentrarRef.current, Math.max(0, alto - 80));
      mapa.flyTo({
        center: [posicion.lon, posicion.lat],
        zoom: mapa.getZoom() > 14 ? mapa.getZoom() : 14,
        padding: { top: 0, bottom: abajo, left: 0, right: 0 },
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
  const mostrarCruz =
    !sinCruzArriba && (enGrande || Boolean(pantallaCompleta && alCerrarPantallaCompleta));
  const lugarAlCostado = useContext(LugarAlCostado);

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

      // Al nacer con un lugar conservado, esta primera medida no puede
      // encuadrar: pisaría el acercamiento que el usuario dejó al guardar.
      if (vistaAlAbrirRef.current && !yaMidioConVistaRef.current) {
        yaMidioConVistaRef.current = true;
        return;
      }

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
    // En grande el costado queda tapado: las fichas van al medio.
    <LugarAlCostado.Provider value={enGrande ? null : lugarAlCostado}>
    <div
      style={enGrande ? { zIndex: NIVEL_DEL_MAPA_EN_GRANDE } : undefined}
      className={[
        "flex flex-col overflow-hidden bg-mapa-fondo",
        enGrande
          ? "fixed inset-0 h-dvh w-screen"
          : pantallaCompleta
            ? "relative h-full w-full"
            : llenarElLugar
              ? "relative h-full min-h-0 w-full rounded-xl border border-borde"
            : llenarElAltoEnLaComputadora
              ? "relative h-72 w-full rounded-xl border border-borde sm:h-96 lg:h-full"
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
      ) : falloVisibleDeGoogle ? (
        <p role="alert" className="absolute bottom-3 left-3 right-20 rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-2 text-sm leading-6 text-ambar-texto">
          {falloVisibleDeGoogle}
        </p>
      ) : preparandoGoogle ? (
        <p role="status" className="absolute bottom-3 left-3 right-20 rounded-xl border border-borde bg-superficie px-3 py-2 text-sm leading-6 text-texto">
          Preparando el mapa de Google…
        </p>
      ) : avisoDelFondo ? (
        <p className="absolute bottom-3 left-3 right-20 rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-2 text-sm leading-6 text-ambar-texto">
          El fondo del mapa no se pudo dibujar: {avisoDelFondo} Lo que ves —la
          ruta, tu posición y los recuadros— sigue siendo correcto.
        </p>
      ) : null}

      {fichaSobreElMapa ? (
        <div className="pointer-events-auto absolute left-3 right-3 top-14 z-10 max-w-xs">
          {fichaSobreElMapa}
        </div>
      ) : null}

      {/*
        Arriba a la izquierda y chatos, para no tapar el mapa: Simple o
        Satelital (solo los que hay: sin ninguno bajado no aparece), el
        círculo de las curvas al lado, y el «!» si falta un pedazo de mapa.
      */}
      {(!consultaGoogle && opcionesDeFondo.length > 0) || (!enVivo && tipoDeFondo === "satelital") || sinMapaDescargado ? (
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          <div className="flex items-center gap-1.5">
            {!consultaGoogle && opcionesDeFondo.length > 0 ? (
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

            {sinMapaDescargado ? (
              <AvisoDeMapaFaltante texto={textoDelAvisoDeMapa?.trim() || "Sin mapa descargado"} />
            ) : null}
          </div>
        </div>
      ) : null}

      {/*
        Quien hizo la foto. Su licencia obliga a decirlo. Si Google no se puede
        mostrar (sin señal, o falló), no hay foto que acreditar: el cartel de
        arriba ya dice qué pasó, y un «Cargando créditos» ahí diría algo falso.
      */}
      {tipoDeFondo === "google" && !falloVisibleDeGoogle ? (
        <div className="pointer-events-none absolute bottom-1 left-2 right-20 flex flex-nowrap items-end gap-1 text-credito-google text-texto-suave">
          <span className="shrink-0 rounded bg-superficie px-1 py-0.5">
            {/* Los dos archivos son los logotipos oficiales, sin modificaciones. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={modo === "sol" ? "/google-maps-sol.png" : "/google-maps-noche.png"} alt="Google Maps" className="h-3 w-auto" />
          </span>
          <span className="min-w-0 truncate whitespace-nowrap rounded bg-superficie px-1 py-0.5 text-texto">{creditosGoogle ?? avisoDeCreditosGoogle ?? "Cargando créditos de Google…"}</span>
        </div>
      ) : opcionesDeFondo.includes("satelital") && tipoDeFondo === "satelital" ? (
        <p className="pointer-events-none absolute bottom-1 left-2 text-[11px] leading-4 text-texto-suave">
          {QUIEN_HIZO_LA_FOTO}
        </p>
      ) : null}

      {/*
        Controles del margen superior derecho cuando el mapa está en pantalla completa o expandido.
      */}
      {pantallaCompleta || enGrande ? (
        <div className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] flex items-center gap-2">
          <BotonDeModo />
          {mostrarCruz ? (
            <BotonCerrar
              etiqueta="Cerrar el mapa grande"
              onClick={() => {
                anotarLoQueSeMira();
                if (enGrande) {
                  setAPantallaCompleta(false);
                } else if (alCerrarPantallaCompleta) {
                  alCerrarPantallaCompleta();
                }
              }}
            />
          ) : null}
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
            {iconoDeUbicarme(gpsPrendido)}
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
    </LugarAlCostado.Provider>
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
