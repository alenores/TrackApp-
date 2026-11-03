"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { FeatureCollection, LineString, Position } from "geojson";
import { clasificarParteDelCamino, crearCaminoNuevo, leerCaminos } from "@/app/actions/caminos";
import { crearAnotacionesEnTanda } from "@/app/actions/territorio";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { EncabezadoDeMapas } from "@/components/mapas/pantalla-de-mapas";
import { ElegirActividades } from "@/components/rutas/elegir-actividades";
import { MuestraDeComplejidad, MuestraDeLinea, nombreDeComplejidad, nombreDelPaso } from "@/components/rutas/referencia-de-partes";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import { Casilla } from "@/components/ui/casilla";
import { IconoDeClase } from "@/components/marcas/icono-de-clase";
import { useDialogos } from "@/components/ui/dialogos";
import { MapaConPanel } from "@/components/ui/mapa-con-panel";
import { Opciones } from "@/components/ui/opciones";
import { Tarjeta } from "@/components/ui/tarjeta";
import { TRAZO_DE_AGREGAR_PUNTO, TRAZO_DE_MOVER_PUNTOS, TRAZO_DE_QUITAR_PUNTO } from "@/components/ui/iconos";
import { COLORES_DE_TRAZO, TRAZO, type ColorDeTrazo } from "@/lib/anotaciones/colores-de-trazo";
import { type ComplejidadDeParte, type CondicionDePaso } from "@/lib/caminos/partes";
import {
  achicarLinea,
  ANCHO_DEL_PASILLO_M,
  cartelAlSalir,
  cortarLinea,
  hayQueConfirmarSalida,
  largoDeParte,
  pegarPunta,
  porDondeVa,
  proponerPartes,
  puntaCercana,
  unirLineas,
  type CaminoParaComparar,
  type PuntaCercana,
} from "@/lib/caminos/desde-salida";
import { agregarOExtenderPuntoEnLinea, agregarPuntoEnLinea, quitarPuntoDeLinea } from "@/lib/caminos/edicion-de-puntos";
import { unaVezPorApertura } from "@/lib/datos/una-vez-por-apertura";
import { rectanguloQueAbarca } from "@/lib/datos/rectangulo";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { usePantallaAncha } from "@/hooks/use-pantalla-ancha";
import { ponerAlDiaDespuesDeGuardar } from "@/lib/offline/puesta-al-dia";
import type { ActividadRuta, Rectangulo } from "@/types/database";

/**
 * Borrador compartido: líneas traídas (salida o archivo) contra Caminos que ya
 * existen. Verde = coincide; color de salidas = nuevo. Cortar, unir al
 * siguiente, descartar y crear de a un Camino. Los puntos y trazos que ya
 * existen se ven de referencia. La app propone; nada se guarda hasta Guardar.
 */

type Destino = "pendiente" | "descartada";
type Pieza = {
  clave: number;
  coordenadas: Position[];
  destino: Destino;
  nombre: string;
  /** Nombre que venía del archivo (Google Earth); se ofrece al crear Camino o trazo. */
  nombreSugerido: string;
  guardadoComo: number | null;
  /** Trazo ya sumado (solo cuando la pantalla lo permite). */
  guardadoComoTrazo: boolean;
};
type Herramienta = "elegir" | "cortar" | "mover" | "agregar" | "quitar";

/** Una línea del borrador, con el nombre que traía el archivo si lo había. */
export type LineaDelBorrador = {
  coordenadas: Position[];
  nombreSugerido?: string | null;
};

let proximaClave = 1;
function piezaNueva(coordenadas: Position[], nombreSugerido = ""): Pieza {
  return {
    clave: proximaClave++,
    coordenadas,
    destino: "pendiente",
    nombre: "",
    nombreSugerido,
    guardadoComo: null,
    guardadoComoTrazo: false,
  };
}

function km(metros: number): string {
  return `${(metros / 1000).toFixed(metros < 10_000 ? 2 : 1).replace(".", ",")} km`;
}

function armarPiezas(lineas: LineaDelBorrador[], caminos: CaminoParaComparar[]): Pieza[] {
  return lineas.flatMap((linea) => {
    const sugerido = linea.nombreSugerido?.trim() ?? "";
    return proponerPartes(achicarLinea(linea.coordenadas), caminos).map((parte) =>
      piezaNueva(parte.coordenadas, sugerido));
  });
}

type Creacion = {
  clave: number;
  nombre: string;
  actividades: ActividadRuta[];
  /** Obligatoria al guardar. Desde archivo viene «por explorar»; desde salida, sin elegir. */
  paso: CondicionDePaso | null;
  /** Opcional: sin elegir = sin clasificar. «Sin paso» no lleva complejidad. */
  complejidad: ComplejidadDeParte | null;
  pegarInicio: boolean;
  pegarFinal: boolean;
};

type CreacionDeTrazo = {
  clave: number;
  nombre: string;
  color: ColorDeTrazo;
};

type Carga =
  | { estado: "cargando" }
  | { estado: "fallo"; motivo: string }
  | { estado: "listo"; original: LineaDelBorrador[] };

export function BorradorDeLineas({
  subtitulo,
  textoDeCarga,
  textoDeAyuda,
  textoEmpezarDeNuevo,
  tituloEmpezarDeNuevo,
  mensajeEmpezarDeNuevo,
  botonEmpezarDeNuevo,
  lineas,
  alVolver,
  consultaGoogle = false,
  permitirTrazo = false,
  /** Condición al abrir «Crear Camino»: `por_explorar` desde archivo; `null` desde una salida (hay que elegirla). */
  condicionInicial = "por_explorar" as CondicionDePaso | null,
  panelAlFinal = null,
}: {
  subtitulo: string;
  textoDeCarga: string;
  textoDeAyuda: string;
  textoEmpezarDeNuevo: string;
  tituloEmpezarDeNuevo: string;
  mensajeEmpezarDeNuevo: string;
  botonEmpezarDeNuevo: string;
  lineas: LineaDelBorrador[];
  alVolver: () => void;
  consultaGoogle?: boolean;
  /** En Traer de afuera: una parte nueva también puede sumarse como trazo. */
  permitirTrazo?: boolean;
  condicionInicial?: CondicionDePaso | null;
  panelAlFinal?: ReactNode;
}) {
  const { confirmar } = useDialogos();
  const { paquete } = useDatosDeLaApp();
  const enPc = usePantallaAncha();
  const anotacionesDeReferencia = useMemo(() => paquete?.anotaciones ?? [], [paquete]);
  const [carga, setCarga] = useState<Carga>({ estado: "cargando" });
  const [intento, setIntento] = useState(0);
  const [piezas, setPiezas] = useState<Pieza[]>([]);
  const [caminos, setCaminos] = useState<CaminoParaComparar[]>([]);
  const [elegida, setElegida] = useState<number | null>(null);
  const [creacion, setCreacion] = useState<Creacion | null>(null);
  const [creacionDeTrazo, setCreacionDeTrazo] = useState<CreacionDeTrazo | null>(null);
  const [herramienta, setHerramienta] = useState<Herramienta>("elegir");
  // En PC no hay mover/agregar/quitar: si quedó una de esas, vuelve a elegir.
  useEffect(() => {
    if (enPc && (herramienta === "mover" || herramienta === "agregar" || herramienta === "quitar")) {
      setHerramienta("elegir");
    }
  }, [enPc, herramienta]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [avisoDelCamino, setAvisoDelCamino] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [tocado, setTocado] = useState(false);
  const [encuadreDeParte, setEncuadreDeParte] = useState<Rectangulo | null>(null);
  const [viaje, setViaje] = useState(0);
  const tarjetasDeParte = useRef(new Map<number, HTMLElement>());
  const claveAMostrar = creacion?.clave ?? creacionDeTrazo?.clave ?? elegida;

  useEffect(() => {
    if (claveAMostrar === null) return;
    const tarjeta = tarjetasDeParte.current.get(claveAMostrar);
    if (!tarjeta) return;
    tarjeta.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [claveAMostrar]);

  const guardarRefDeParte = (clave: number, nodo: HTMLElement | null) => {
    if (nodo) tarjetasDeParte.current.set(clave, nodo);
    else tarjetasDeParte.current.delete(clave);
  };

  useEffect(() => {
    let vigente = true;
    void (async () => {
      try {
        const lista = await unaVezPorApertura("caminos-para-circuitos", leerCaminos);
        if (!vigente) return;
        if (!lista.ok) {
          setCarga({ estado: "fallo", motivo: `No se pudieron traer los Caminos para comparar: ${lista.error}` });
          return;
        }
        const original = lineas
          .map((cada) => ({
            coordenadas: cada.coordenadas,
            nombreSugerido: cada.nombreSugerido?.trim() || null,
          }))
          .filter((cada) => cada.coordenadas.length >= 2);
        if (original.length === 0) {
          setCarga({ estado: "fallo", motivo: "No hay ninguna línea usable para comparar." });
          return;
        }
        const paraComparar = lista.datos.caminos.map((camino) => ({
          id: camino.id,
          nombre: camino.nombre,
          coordenadas: camino.coordenadas,
        }));
        setCaminos(paraComparar);
        setPiezas(armarPiezas(original, paraComparar));
        setCarga({ estado: "listo", original });
      } catch (causa) {
        if (vigente) {
          setCarga({
            estado: "fallo",
            motivo: `${causa instanceof Error ? causa.message : String(causa)}. Revisá la señal y volvé a intentar.`,
          });
        }
      }
    })();
    return () => { vigente = false; };
  }, [lineas, intento]);

  const analisis = useMemo(() => new Map(piezas.map((pieza) => [pieza.clave, {
    va: porDondeVa(pieza.coordenadas, caminos),
    inicio: puntaCercana(pieza.coordenadas, "inicio", caminos),
    final: puntaCercana(pieza.coordenadas, "final", caminos),
    largo: largoDeParte(pieza.coordenadas),
  }])), [piezas, caminos]);

  const lineaDe = (pieza: Pieza): Position[] => {
    if (creacion?.clave !== pieza.clave) return pieza.coordenadas;
    const datos = analisis.get(pieza.clave);
    let linea = pieza.coordenadas;
    if (creacion.pegarInicio && datos?.inicio) linea = pegarPunta(linea, "inicio", datos.inicio.coordenada);
    if (creacion.pegarFinal && datos?.final) linea = pegarPunta(linea, "final", datos.final.coordenada);
    return linea;
  };

  const enUso = creacion?.clave ?? creacionDeTrazo?.clave ?? elegida;
  const piezaEnUso = piezas.find((pieza) => pieza.clave === enUso) ?? null;
  const creandoAlgo = Boolean(creacion || creacionDeTrazo);
  /**
   * En PC, con una parte en uso (y sin cortar), los puntos se editan con el
   * mouse: arrastrar, clic izquierdo agregar/alargar, clic derecho quitar.
   * En celular siguen las tres herramientas (Ale, 2026-11-03).
   */
  const editandoPuntosEnPc = enPc && piezaEnUso !== null
    && piezaEnUso.guardadoComo === null && !piezaEnUso.guardadoComoTrazo
    && herramienta !== "cortar";
  const editandoLinea = editandoPuntosEnPc
    || herramienta === "mover" || herramienta === "agregar" || herramienta === "quitar";

  const dibujo = useMemo((): FeatureCollection<LineString> => ({
    type: "FeatureCollection",
    features: piezas.flatMap((pieza, indice) => {
      if (pieza.destino === "descartada" || pieza.guardadoComoTrazo) return [];
      const datos = analisis.get(pieza.clave);
      const sobre = Boolean(datos?.va);
      const largo = km(datos?.largo ?? 0);
      const detalle = pieza.guardadoComo !== null
        ? `Guardada como «${pieza.nombre}»`
        : datos?.va
          ? `Va sobre «${datos.va.sobre.nombre}»`
          : "No coincide con ningún Camino";
      return [{
        type: "Feature" as const,
        properties: {
          borrador: pieza.clave,
          paso: "transitable",
          ...(sobre ? { complejidad: "facil" } : { complejidad: null, lineaDeSalida: true }),
          elegida: pieza.clave === enUso,
          hayEleccion: enUso !== null,
          etiqueta_al_pasar: `Parte ${indice + 1} · ${largo} · ${detalle}`,
        },
        geometry: { type: "LineString" as const, coordinates: lineaDe(pieza) },
      }];
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [piezas, analisis, enUso, creacion]);

  const caminosExistentes = useMemo((): FeatureCollection<LineString> => ({
    type: "FeatureCollection",
    features: caminos.map((camino) => ({
      type: "Feature" as const,
      properties: { camino_id: camino.id, nombre: camino.nombre },
      geometry: { type: "LineString" as const, coordinates: camino.coordenadas },
    })),
  }), [caminos]);

  const encuadreInicial = useMemo(() => carga.estado === "listo"
    ? rectanguloQueAbarca(carga.original.flatMap((linea) =>
      linea.coordenadas.map((punto): [number, number] => [punto[0], punto[1]])))
    : null, [carga]);
  const encuadre = encuadreDeParte ?? encuadreInicial;

  const enfocarParte = (pieza: Pieza) => {
    const caja = rectanguloQueAbarca(
      lineaDe(pieza).map((punto): [number, number] => [punto[0], punto[1]]),
    );
    if (!caja) return;
    setEncuadreDeParte(caja);
    setViaje((vez) => vez + 1);
  };

  const elegirParte = (pieza: Pieza) => {
    setElegida(pieza.clave);
    setAviso(null);
    enfocarParte(pieza);
  };

  const cambiarPieza = (clave: number, cambio: Partial<Pieza>) => {
    setPiezas((actuales) => actuales.map((pieza) => pieza.clave === clave ? { ...pieza, ...cambio } : pieza));
    setTocado(true);
  };
  const cambiarCreacion = (cambio: Partial<Creacion>) => {
    setCreacion((actual) => actual ? { ...actual, ...cambio } : actual);
    setAvisoDelCamino(null);
  };

  const tocarElMapa = (lon: number, lat: number, propiedades: Record<string, unknown>) => {
    const clave = Number(propiedades.borrador);
    if (!Number.isInteger(clave)) return;
    const pieza = piezas.find((cada) => cada.clave === clave);
    if (!pieza || pieza.guardadoComo !== null || pieza.guardadoComoTrazo) return;
    if (creandoAlgo && clave !== enUso) {
      setAviso(creacion
        ? "Estás creando un Camino: terminalo con Guardar o cancelalo para trabajar con otra parte."
        : "Estás sumando un trazo: terminalo o cancelalo para trabajar con otra parte.");
      return;
    }
    if (herramienta === "cortar") {
      const corte = cortarLinea(pieza.coordenadas, lon, lat);
      if (!corte.ok) { setAviso(corte.error); return; }
      const [antes, despues] = corte.datos.map((coords) => piezaNueva(coords, pieza.nombreSugerido));
      setPiezas((actuales) => actuales.flatMap((cada) => cada.clave === clave ? [antes, despues] : [cada]));
      if (creacion) {
        setCreacion({ ...creacion, clave: despues.clave, pegarInicio: false });
        setAviso("Se cortó: el Camino que estás creando sigue con la parte nueva; el otro pedazo quedó aparte.");
      } else if (creacionDeTrazo) {
        setCreacionDeTrazo({ ...creacionDeTrazo, clave: despues.clave });
        setAviso("Se cortó: el trazo sigue con la parte nueva; el otro pedazo quedó aparte.");
      } else {
        setElegida(despues.clave);
        setAviso("Se cortó en dos. Quedó elegida la parte nueva.");
      }
      setTocado(true);
      return;
    }
    if (herramienta === "agregar" && clave === enUso) {
      const resultado = agregarPuntoEnLinea(pieza.coordenadas, lon, lat);
      if (!resultado.ok) { setAviso(resultado.error); return; }
      cambiarPieza(clave, { coordenadas: resultado.datos });
      setAviso(null);
      return;
    }
    // PC: clic izquierdo sobre la línea (o más allá del extremo) agrega o alarga.
    if (editandoPuntosEnPc && clave === enUso) {
      const resultado = agregarOExtenderPuntoEnLinea(pieza.coordenadas, lon, lat);
      if (!resultado.ok) { setAviso(resultado.error); return; }
      cambiarPieza(clave, { coordenadas: resultado.datos });
      setAviso(resultado.datos.length > pieza.coordenadas.length
        ? "Se sumó un punto. Si quedó más allá del extremo, el Camino se alargó en recta."
        : null);
      return;
    }
    setElegida(clave);
    setAviso(null);
  };

  const quitarPunto = (indice: number) => {
    if (!piezaEnUso) return;
    const resultado = quitarPuntoDeLinea(piezaEnUso.coordenadas, indice);
    if (!resultado.ok) { setAviso(resultado.error); return; }
    cambiarPieza(piezaEnUso.clave, { coordenadas: resultado.datos });
  };

  const moverPunto = (indice: number, lon: number, lat: number) => {
    if (!piezaEnUso) return;
    cambiarPieza(piezaEnUso.clave, {
      coordenadas: piezaEnUso.coordenadas.map((punto, i) => i === indice ? [lon, lat] : [punto[0], punto[1]]),
    });
  };

  const empezarCamino = (pieza: Pieza) => {
    setCreacion({
      clave: pieza.clave,
      nombre: pieza.nombreSugerido,
      actividades: [],
      paso: condicionInicial,
      complejidad: null,
      pegarInicio: false,
      pegarFinal: false,
    });
    setCreacionDeTrazo(null);
    setElegida(pieza.clave);
    setAviso(null);
    setAvisoDelCamino(null);
    setTocado(true);
  };

  const descartarParte = async (clave: number) => {
    if (!(await confirmar({
      titulo: "¿Descartar esta parte?",
      mensaje: "Deja de verse en el mapa. Después la podés volver a usar.",
      textoDeAceptar: "Descartar",
      textoDeCancelar: "Seguir con ella",
      destructivo: true,
    }))) return;
    cambiarPieza(clave, { destino: "descartada" });
  };

  /** Une esta parte con la de abajo en la lista. No mira coincidencias: solo pega. */
  const unirConLaSiguiente = (indice: number) => {
    const esta = piezas[indice];
    const siguiente = piezas[indice + 1];
    if (!esta || !siguiente) return;
    if (esta.guardadoComo !== null || esta.guardadoComoTrazo || siguiente.guardadoComo !== null || siguiente.guardadoComoTrazo) {
      setAviso("No se puede unir: alguna de las dos partes ya está guardada.");
      return;
    }
    const unidas = unirLineas(esta.coordenadas, siguiente.coordenadas);
    if (!unidas.ok) { setAviso(unidas.error); return; }
    const junta = piezaNueva(unidas.datos, esta.nombreSugerido || siguiente.nombreSugerido);
    // Si alguna estaba descartada, al unir vuelve a usarse.
    junta.destino = "pendiente";
    setPiezas((actuales) => [
      ...actuales.slice(0, indice),
      junta,
      ...actuales.slice(indice + 2),
    ]);
    if (creacion && (creacion.clave === esta.clave || creacion.clave === siguiente.clave)) {
      setCreacion({ ...creacion, clave: junta.clave, pegarInicio: false, pegarFinal: false });
    }
    if (creacionDeTrazo && (creacionDeTrazo.clave === esta.clave || creacionDeTrazo.clave === siguiente.clave)) {
      setCreacionDeTrazo({ ...creacionDeTrazo, clave: junta.clave });
    }
    if (elegida === esta.clave || elegida === siguiente.clave) setElegida(junta.clave);
    setAviso("Se unieron las dos partes.");
    setTocado(true);
  };

  const empezarTrazo = (pieza: Pieza) => {
    setCreacionDeTrazo({ clave: pieza.clave, nombre: pieza.nombreSugerido, color: "huella" });
    setCreacion(null);
    setElegida(pieza.clave);
    setAviso(null);
    setAvisoDelCamino(null);
    setTocado(true);
  };

  const cancelarCamino = async () => {
    if (!creacion) return;
    if (!(await confirmar({
      titulo: "¿Cancelar este Camino?",
      mensaje: "Se pierden el nombre, las actividades, la clasificación y las puntas pegadas. La parte vuelve a quedar como estaba.",
      textoDeAceptar: "Cancelar el Camino",
      textoDeCancelar: "Seguir creándolo",
      destructivo: true,
    }))) return;
    setCreacion(null);
    setAvisoDelCamino(null);
  };

  const cancelarTrazo = async () => {
    if (!creacionDeTrazo) return;
    if (!(await confirmar({
      titulo: "¿Cancelar este trazo?",
      mensaje: "La parte vuelve a quedar como estaba, sin sumarse.",
      textoDeAceptar: "Cancelar el trazo",
      textoDeCancelar: "Seguir",
      destructivo: true,
    }))) return;
    setCreacionDeTrazo(null);
    setAvisoDelCamino(null);
  };

  const volver = async () => {
    const hayGuardados = piezas.some((pieza) => pieza.guardadoComo !== null || pieza.guardadoComoTrazo);
    const hayPartesPendientes = piezas.some((pieza) =>
      pieza.destino === "pendiente" && pieza.guardadoComo === null && !pieza.guardadoComoTrazo);
    if (!hayQueConfirmarSalida({
      creandoCamino: creandoAlgo,
      tocado,
      hayPartesPendientes,
    })) {
      alVolver();
      return;
    }
    const cartel = cartelAlSalir({ creandoCamino: creandoAlgo, hayGuardados });
    if (!(await confirmar({
      titulo: cartel.titulo,
      mensaje: cartel.mensaje,
      textoDeAceptar: cartel.textoDeAceptar,
      destructivo: true,
    }))) return;
    alVolver();
  };

  const empezarDeNuevo = async () => {
    if (carga.estado !== "listo") return;
    if (!(await confirmar({
      titulo: tituloEmpezarDeNuevo,
      mensaje: mensajeEmpezarDeNuevo,
      textoDeAceptar: botonEmpezarDeNuevo,
      destructivo: true,
    }))) return;
    setPiezas(armarPiezas(carga.original, caminos));
    setElegida(null);
    setCreacion(null);
    setCreacionDeTrazo(null);
    setHerramienta("elegir");
    setTocado(false);
    setAviso(null);
    setAvisoDelCamino(null);
  };

  const guardarCamino = async () => {
    const pieza = piezas.find((cada) => cada.clave === creacion?.clave);
    if (!creacion || !pieza || guardando) return;
    const nombre = creacion.nombre.trim();
    if (!nombre) { setAvisoDelCamino("Escribí el nombre del Camino."); return; }
    if (creacion.actividades.length === 0) { setAvisoDelCamino("Elegí al menos una actividad."); return; }
    if (!creacion.paso) { setAvisoDelCamino("Elegí la condición de paso."); return; }
    if (analisis.get(pieza.clave)?.va) {
      setAvisoDelCamino("Así como está, esta parte va sobre un Camino que ya existe y sería un Camino repetido. Cortala para separar lo nuevo.");
      return;
    }
    const paso = creacion.paso;
    const complejidad = paso === "sin_paso" ? null : creacion.complejidad;
    setGuardando(true);
    setAvisoDelCamino(null);
    try {
      const resultado = await crearCaminoNuevo({
        nombre,
        descripcion: null,
        actividades: creacion.actividades,
        coordenadas: lineaDe(pieza),
      });
      if (!resultado.ok) { setAvisoDelCamino(`No se guardó el Camino: ${resultado.error}`); return; }
      let alDia = resultado.datos;
      const parte = alDia.partes[0];
      if (parte) {
        for (const actividad of creacion.actividades) {
          const clasificada = await clasificarParteDelCamino(alDia.id, alDia.actualizadoEn, {
            desdeM: parte.desdeM,
            hastaM: parte.hastaM,
            actividad,
            paso,
            complejidad,
          });
          if (!clasificada.ok) {
            setAvisoDelCamino(`El Camino «${nombre}» quedó guardado, pero no se pudo cargar la clasificación: ${clasificada.error}. Completala en su ficha.`);
            setPiezas((actuales) => actuales.map((cada) => cada.clave === pieza.clave
              ? { ...cada, coordenadas: lineaDe(pieza), nombre, guardadoComo: alDia.id } : cada));
            setCaminos((actuales) => [...actuales, { id: alDia.id, nombre: alDia.nombre, coordenadas: alDia.coordenadas }]);
            setCreacion(null);
            setElegida(null);
            await ponerAlDiaDespuesDeGuardar();
            return;
          }
          alDia = clasificada.datos;
        }
      }
      setPiezas((actuales) => actuales.map((cada) => cada.clave === pieza.clave
        ? { ...cada, coordenadas: lineaDe(pieza), nombre, guardadoComo: alDia.id } : cada));
      setCaminos((actuales) => [...actuales, { id: alDia.id, nombre: alDia.nombre, coordenadas: alDia.coordenadas }]);
      setCreacion(null);
      setElegida(null);
      const puesta = await ponerAlDiaDespuesDeGuardar();
      setAviso(puesta.clase === "fallo"
        ? `Se guardó «${nombre}», pero no aparece todavía en este celular: ${puesta.motivo}. Volvé a poner la app al día con conexión.`
        : null);
    } catch (causa) {
      setAvisoDelCamino(`Se interrumpió el guardado: ${causa instanceof Error ? causa.message : String(causa)}. Fijate en Marcas si quedó guardado antes de volver a tocar Guardar.`);
    } finally {
      setGuardando(false);
    }
  };

  const guardarTrazo = async () => {
    const pieza = piezas.find((cada) => cada.clave === creacionDeTrazo?.clave);
    if (!creacionDeTrazo || !pieza || guardando) return;
    if (analisis.get(pieza.clave)?.va) {
      setAvisoDelCamino("Así como está, esta parte va sobre un Camino que ya existe. Cortala para separar lo nuevo, o descartala.");
      return;
    }
    setGuardando(true);
    setAvisoDelCamino(null);
    try {
      const nombreDelTrazo = creacionDeTrazo.nombre.trim();
      const resultado = await crearAnotacionesEnTanda(null, [{
        tipo: "trazo",
        icono: null,
        color: TRAZO[creacionDeTrazo.color].color,
        titulo: null,
        comentario: nombreDelTrazo || null,
        geometria: { type: "LineString", coordinates: pieza.coordenadas },
      }], "google_earth");
      if (!resultado.ok) {
        setAvisoDelCamino(`No se sumó el trazo: ${resultado.error}`);
        return;
      }
      setPiezas((actuales) => actuales.map((cada) => cada.clave === pieza.clave
        ? { ...cada, nombre: nombreDelTrazo || TRAZO[creacionDeTrazo.color].nombre, guardadoComoTrazo: true } : cada));
      setCreacionDeTrazo(null);
      setElegida(null);
      const puesta = await ponerAlDiaDespuesDeGuardar();
      setAviso(puesta.clase === "fallo"
        ? `Se sumó el trazo, pero no aparece todavía en este celular: ${puesta.motivo}. Volvé a poner la app al día con conexión.`
        : null);
    } catch (causa) {
      setAvisoDelCamino(`Se interrumpió el guardado: ${causa instanceof Error ? causa.message : String(causa)}. Revisá Marcas antes de volver a tocar Guardar.`);
    } finally {
      setGuardando(false);
    }
  };

  const ayudaDeHerramienta: Record<Herramienta, string> = {
    elegir: enPc
      ? "Elegí una parte. Con el mouse: arrastrá un punto para moverlo; clic izquierdo agrega o alarga el Camino; clic derecho quita un punto."
      : "Tocá una parte en el mapa o en la lista para elegirla. Un clic fuera de la línea (sin arrastrar) suelta la elección y vuelve a mostrar todos los colores.",
    cortar: creandoAlgo ? "Tocá la línea que estás creando donde la querés cortar." : "Tocá la línea donde la querés cortar.",
    mover: creandoAlgo ? "Arrastrá los puntos de la parte que estás creando." : "Elegí una parte y arrastrá sus puntos hasta su lugar.",
    agregar: creandoAlgo ? "Tocá la línea que estás creando, entre dos puntos." : "Elegí una parte y tocá su línea entre dos puntos.",
    quitar: creandoAlgo ? "Tocá el punto de la parte que estás creando que querés quitar." : "Elegí una parte y tocá el punto que querés quitar.",
  };
  const opcionesDeHerramienta = enPc
    ? [
        { valor: "elegir" as const, etiqueta: "Elegir parte" },
        { valor: "cortar" as const, etiqueta: "Cortar" },
      ]
    : [
        { valor: "elegir" as const, etiqueta: "Elegir parte" },
        { valor: "cortar" as const, etiqueta: "Cortar" },
        { valor: "mover" as const, etiqueta: "Mover puntos", trazo: TRAZO_DE_MOVER_PUNTOS },
        { valor: "agregar" as const, etiqueta: "Agregar punto", trazo: TRAZO_DE_AGREGAR_PUNTO },
        { valor: "quitar" as const, etiqueta: "Quitar punto", trazo: TRAZO_DE_QUITAR_PUNTO },
      ];

  return (
    <div className="space-y-4">
      <EncabezadoDeMapas titulo="Marcas" subtitulo={subtitulo} alVolver={() => void volver()} volverDeshabilitado={guardando} />
      {carga.estado === "cargando" ? <p role="status" className="text-base text-texto">{textoDeCarga}</p> : null}
      {carga.estado === "fallo" ? (
        <Tarjeta franja="rojo" className="space-y-3">
          <p role="alert" className="text-base text-texto">{carga.motivo}</p>
          <Boton variante="secundario" onClick={() => { setCarga({ estado: "cargando" }); setIntento((cada) => cada + 1); }}>Volver a intentar</Boton>
        </Tarjeta>
      ) : null}
      {carga.estado === "listo" ? (
        <MapaConPanel
          panelPrimeroEnComputadora
          mapa={
            <CargadorDeMapa enVivo llenarElAltoEnLaComputadora consultaGoogle={consultaGoogle}
              encuadre={encuadre} encuadrarSoloAlAbrir viaje={viaje} caminos={dibujo}
              caminosEncima={caminosExistentes}
              anotaciones={anotacionesDeReferencia}
              mostrarFichaAnotacion={false}
              alTocarCamino={tocarElMapa}
              alTocarFueraDeCamino={(lon, lat) => {
                // PC: un clic fuera de la línea, con una parte en uso, alarga o
                // agrega sobre esa parte (no suelta la elección).
                if (editandoPuntosEnPc && piezaEnUso && lon !== undefined && lat !== undefined) {
                  const resultado = agregarOExtenderPuntoEnLinea(piezaEnUso.coordenadas, lon, lat);
                  if (!resultado.ok) { setAviso(resultado.error); return; }
                  cambiarPieza(piezaEnUso.clave, { coordenadas: resultado.datos });
                  setAviso("Se sumó un punto. Si quedó más allá del extremo, el Camino se alargó en recta.");
                  return;
                }
                if (creandoAlgo) return;
                setElegida(null);
                setAviso(null);
              }}
              verticesDeCamino={editandoLinea && piezaEnUso && piezaEnUso.guardadoComo === null && !piezaEnUso.guardadoComoTrazo ? piezaEnUso.coordenadas : null}
              alTocarVerticeDeCamino={herramienta === "quitar" ? quitarPunto : undefined}
              alClicDerechoEnVerticeDeCamino={editandoPuntosEnPc ? quitarPunto : undefined}
              alMoverVerticeDeCamino={editandoPuntosEnPc || herramienta === "mover" ? moverPunto : undefined} />
          }
          panel={
            <div className="space-y-4">
              <Tarjeta className="space-y-2">
                <p className="text-base text-texto">{textoDeAyuda}</p>
                <Opciones etiqueta="Herramienta" columnas={enPc ? 2 : 3} iconoArriba elegidas={[herramienta]}
                  alElegir={(nueva) => { setHerramienta(nueva); setAviso(null); }}
                  opciones={opcionesDeHerramienta} />
                <p className="text-base text-texto-suave">{ayudaDeHerramienta[herramienta]}</p>
                {aviso ? <p role="alert" className="text-base text-ambar-texto">{aviso}</p> : null}
              </Tarjeta>

              <h3 className="text-lg font-bold text-texto">Partes ({piezas.length})</h3>
              {piezas.map((pieza, indice) => {
                const datos = analisis.get(pieza.clave);
                const largo = km(datos?.largo ?? 0);
                const siguienteAlCrear = piezas[indice + 1];
                const unirAlCrear = siguienteAlCrear
                  && pieza.guardadoComo === null && !pieza.guardadoComoTrazo
                  && siguienteAlCrear.guardadoComo === null && !siguienteAlCrear.guardadoComoTrazo
                  && !guardando
                  ? () => unirConLaSiguiente(indice)
                  : null;
                if (creacion?.clave === pieza.clave) {
                  return (
                    <div key={pieza.clave} ref={(nodo) => guardarRefDeParte(pieza.clave, nodo)}>
                      <TarjetaDelCaminoNuevo numero={indice + 1} largo={largo} creacion={creacion}
                        inicio={datos?.inicio ?? null} final={datos?.final ?? null} vaSobre={datos?.va?.sobre.nombre ?? null}
                        guardando={guardando} aviso={avisoDelCamino} alCambiar={cambiarCreacion}
                        alUnirConLaSiguiente={unirAlCrear}
                        alCancelar={() => void cancelarCamino()} alGuardar={() => void guardarCamino()} />
                    </div>
                  );
                }
                if (creacionDeTrazo?.clave === pieza.clave) {
                  return (
                    <div key={pieza.clave} ref={(nodo) => guardarRefDeParte(pieza.clave, nodo)}>
                      <TarjetaDelTrazoNuevo numero={indice + 1} largo={largo} creacion={creacionDeTrazo}
                        vaSobre={datos?.va?.sobre.nombre ?? null} guardando={guardando} aviso={avisoDelCamino}
                        alCambiar={(cambio) => { setCreacionDeTrazo({ ...creacionDeTrazo, ...cambio }); setAvisoDelCamino(null); }}
                        alUnirConLaSiguiente={unirAlCrear}
                        alCancelar={() => void cancelarTrazo()} alGuardar={() => void guardarTrazo()} />
                    </div>
                  );
                }
                const esElegida = pieza.clave === elegida && !creandoAlgo;
                const hayOtraElegida = elegida !== null && !esElegida && !creandoAlgo;
                const bloqueada = guardando || pieza.guardadoComo !== null || pieza.guardadoComoTrazo;
                // Con una parte elegida, las acciones de las otras no responden: evita tocar la equivocada.
                const accionesDeOtra = bloqueada || creandoAlgo || hayOtraElegida;
                const siguiente = piezas[indice + 1];
                const sePuedeUnir = Boolean(siguiente)
                  && pieza.guardadoComo === null && !pieza.guardadoComoTrazo
                  && siguiente.guardadoComo === null && !siguiente.guardadoComoTrazo
                  && !guardando;
                const botonUnir = sePuedeUnir ? (
                  <Boton variante="secundario" disabled={accionesDeOtra && !esElegida}
                    onClick={() => unirConLaSiguiente(indice)}>Unir al siguiente tramo</Boton>
                ) : null;
                return (
                  <div key={pieza.clave} ref={(nodo) => guardarRefDeParte(pieza.clave, nodo)}>
                    <Tarjeta className={`space-y-3 ${esElegida ? "border-2 border-marca-de-parte" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-base font-semibold text-texto">
                          Parte {indice + 1} · {largo}{esElegida ? " · elegida" : ""}
                        </p>
                        {!esElegida && !creandoAlgo && pieza.destino !== "descartada" && pieza.guardadoComo === null && !pieza.guardadoComoTrazo ? (
                          <Boton variante="secundario" onClick={() => elegirParte(pieza)}>Elegir</Boton>
                        ) : null}
                      </div>
                      {pieza.guardadoComo !== null ? (
                        <p className="text-base text-verde-texto">Guardada como el Camino «{pieza.nombre}».</p>
                      ) : pieza.guardadoComoTrazo ? (
                        <p className="text-base text-verde-texto">Sumada como trazo «{pieza.nombre}».</p>
                      ) : pieza.destino === "descartada" ? (
                        <>
                          <p className="text-base text-texto-suave">Descartada: no se guarda y no se ve en el mapa.</p>
                          <div className="flex flex-wrap gap-2">
                            <Boton variante="secundario" disabled={guardando || creandoAlgo || hayOtraElegida}
                              onClick={() => cambiarPieza(pieza.clave, { destino: "pendiente" })}>Volver a usarla</Boton>
                            {botonUnir}
                          </div>
                        </>
                      ) : datos?.va ? (
                        <>
                          <p className="text-base text-texto">
                            Va sobre «{datos.va.sobre.nombre}» ({Math.round(datos.va.proporcion * 100)} % de esta parte).
                            Ese Camino ya existe y no se toca.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Boton variante="secundario" disabled={accionesDeOtra}
                              onClick={() => void descartarParte(pieza.clave)}>Descartar</Boton>
                            {botonUnir}
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-base text-texto">No coincide con ningún Camino.</p>
                          {creandoAlgo ? (
                            <p className="text-base text-texto-suave">Para usar esta parte, terminá o cancelá lo que estás creando.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <Boton variante="secundario" disabled={accionesDeOtra} onClick={() => empezarCamino(pieza)}>Crear Camino</Boton>
                              {permitirTrazo ? (
                                <Boton variante="secundario" disabled={accionesDeOtra} onClick={() => empezarTrazo(pieza)}>Sumar como trazo</Boton>
                              ) : null}
                              <Boton variante="secundario" disabled={accionesDeOtra}
                                onClick={() => void descartarParte(pieza.clave)}>Descartar</Boton>
                              {botonUnir}
                            </div>
                          )}
                        </>
                      )}
                    </Tarjeta>
                  </div>
                );
              })}

              <Tarjeta className="space-y-2">
                <p className="text-base text-texto-suave">{textoEmpezarDeNuevo}</p>
                <Boton variante="secundario" disabled={guardando} onClick={() => void empezarDeNuevo()}>{botonEmpezarDeNuevo}</Boton>
              </Tarjeta>

              {panelAlFinal}
            </div>
          }
        />
      ) : null}
    </div>
  );
}

function TarjetaDelCaminoNuevo({ numero, largo, creacion, inicio, final, vaSobre, guardando, aviso, alCambiar, alUnirConLaSiguiente, alCancelar, alGuardar }: {
  numero: number;
  largo: string;
  creacion: Creacion;
  inicio: PuntaCercana | null;
  final: PuntaCercana | null;
  vaSobre: string | null;
  guardando: boolean;
  aviso: string | null;
  alCambiar: (cambio: Partial<Creacion>) => void;
  alUnirConLaSiguiente: (() => void) | null;
  alCancelar: () => void;
  alGuardar: () => void;
}) {
  const elegirPaso = (paso: CondicionDePaso) => {
    alCambiar({ paso, complejidad: paso === "sin_paso" ? null : creacion.complejidad });
  };
  return (
    <Tarjeta franja="verde" className="space-y-4">
      <div className="space-y-1">
        <h3 className="flex items-center gap-2 text-xl font-bold text-texto"><IconoDeClase grupo="camino" />Camino nuevo</h3>
        <p className="text-base text-texto-suave">Desde la parte {numero} · {largo}. Las herramientas trabajan sobre esta parte.</p>
      </div>
      {vaSobre ? (
        <p role="alert" className="text-base text-ambar-texto">
          Así como está, va sobre «{vaSobre}»: sería un Camino repetido. Cortala para separar lo nuevo.
        </p>
      ) : null}
      <Campo label="Nombre del Camino" obligatorio value={creacion.nombre} maxLength={120} disabled={guardando}
        onChange={(evento) => alCambiar({ nombre: evento.target.value })} />
      <ElegirActividades etiqueta="Actividades" modo="varias" obligatorio elegidas={creacion.actividades} deshabilitado={guardando}
        alTocar={(actividad) => alCambiar({ actividades: creacion.actividades.includes(actividad)
          ? creacion.actividades.filter((cada) => cada !== actividad) : [...creacion.actividades, actividad] })} />
      <div className="space-y-2">
        <p className="text-base font-semibold text-texto">Condición de paso</p>
        <div className="flex flex-wrap gap-2">
          {(["por_explorar", "tentativo", "transitable", "a_pie", "sin_paso"] as CondicionDePaso[]).map((paso) => (
            <Boton key={paso}
              variante={creacion.paso === paso ? "principal" : "secundario"}
              aria-pressed={creacion.paso === paso} disabled={guardando}
              onClick={() => elegirPaso(paso)}>
              <span className="inline-flex items-center gap-2">
                <MuestraDeLinea paso={paso} />
                {nombreDelPaso(paso, creacion.actividades)}
              </span>
            </Boton>
          ))}
        </div>
      </div>
      {creacion.paso && creacion.paso !== "sin_paso" ? (
        <div className="space-y-2">
          <p className="text-base font-semibold text-texto">Complejidad</p>
          <div className="flex flex-wrap gap-2">
            {([null, "facil", "media", "dificil"] as Array<ComplejidadDeParte | null>).map((complejidad) => (
              <Boton key={complejidad ?? "ninguna"}
                variante={creacion.complejidad === complejidad ? "principal" : "secundario"}
                aria-pressed={creacion.complejidad === complejidad} disabled={guardando}
                onClick={() => alCambiar({ complejidad })}>
                <span className="inline-flex items-center gap-2">
                  <MuestraDeComplejidad complejidad={complejidad} />
                  {nombreDeComplejidad(complejidad)}
                </span>
              </Boton>
            ))}
          </div>
        </div>
      ) : null}
      {inicio || final ? (
        <div className="space-y-1">
          {([["inicio", inicio, "pegarInicio", "inicial"], ["final", final, "pegarFinal", "final"]] as const).map(([extremo, cercana, campo, palabra]) => cercana ? (
            <div key={extremo} className="flex items-center gap-1">
              <Casilla tildada={creacion[campo]} etiqueta={`Pegar la punta ${palabra} a «${cercana.camino.nombre}»`}
                alTocar={() => alCambiar({ [campo]: !creacion[campo] })} />
              <span className="text-base text-texto">Pegar la punta {palabra} a «{cercana.camino.nombre}» (está a {Math.round(cercana.distanciaM)} m)</span>
            </div>
          ) : null)}
        </div>
      ) : null}
      <p className="text-base text-texto-suave">La condición y la complejidad valen para todas las actividades elegidas.</p>
      {aviso ? <p role="alert" className="text-base text-ambar-texto">{aviso}</p> : null}
      {alUnirConLaSiguiente ? (
        <Boton variante="secundario" disabled={guardando} onClick={alUnirConLaSiguiente}>Unir al siguiente tramo</Boton>
      ) : null}
      <div className="flex flex-wrap justify-between gap-2 border-t border-borde pt-3">
        <Boton variante="secundario" disabled={guardando} onClick={alCancelar}>Cancelar</Boton>
        <Boton disabled={guardando} onClick={alGuardar}>{guardando ? "Guardando…" : "Guardar"}</Boton>
      </div>
    </Tarjeta>
  );
}

function TarjetaDelTrazoNuevo({ numero, largo, creacion, vaSobre, guardando, aviso, alCambiar, alUnirConLaSiguiente, alCancelar, alGuardar }: {
  numero: number;
  largo: string;
  creacion: CreacionDeTrazo;
  vaSobre: string | null;
  guardando: boolean;
  aviso: string | null;
  alCambiar: (cambio: Partial<CreacionDeTrazo>) => void;
  alUnirConLaSiguiente: (() => void) | null;
  alCancelar: () => void;
  alGuardar: () => void;
}) {
  return (
    <Tarjeta className="space-y-4">
      <div className="space-y-1">
        <h3 className="flex items-center gap-2 text-xl font-bold text-texto"><IconoDeClase grupo="trazo" />Trazo de referencia</h3>
        <p className="text-base text-texto-suave">Desde la parte {numero} · {largo}.</p>
      </div>
      {vaSobre ? (
        <p role="alert" className="text-base text-ambar-texto">
          Así como está, va sobre «{vaSobre}». Cortala para separar lo nuevo, o cancelá.
        </p>
      ) : null}
      <Campo label="Nombre" value={creacion.nombre} maxLength={120} disabled={guardando}
        onChange={(evento) => alCambiar({ nombre: evento.target.value })} />
      <div className="flex flex-wrap gap-2" aria-label="Color del trazo">
        {COLORES_DE_TRAZO.map((cada) => (
          <Boton key={cada} variante={creacion.color === cada ? "principal" : "secundario"}
            aria-pressed={creacion.color === cada} disabled={guardando}
            onClick={() => alCambiar({ color: cada })}>{TRAZO[cada].nombre}</Boton>
        ))}
      </div>
      {aviso ? <p role="alert" className="text-base text-ambar-texto">{aviso}</p> : null}
      {alUnirConLaSiguiente ? (
        <Boton variante="secundario" disabled={guardando} onClick={alUnirConLaSiguiente}>Unir al siguiente tramo</Boton>
      ) : null}
      <div className="flex flex-wrap justify-between gap-2 border-t border-borde pt-3">
        <Boton variante="secundario" disabled={guardando} onClick={alCancelar}>Cancelar</Boton>
        <Boton disabled={guardando} onClick={alGuardar}>{guardando ? "Sumando…" : "Sumar trazo"}</Boton>
      </div>
    </Tarjeta>
  );
}

export { ANCHO_DEL_PASILLO_M, km };
