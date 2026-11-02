"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FeatureCollection, LineString, Position } from "geojson";
import { crearCaminoNuevo, leerCaminos } from "@/app/actions/caminos";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { EncabezadoDeMapas } from "@/components/mapas/pantalla-de-mapas";
import { ElegirActividades } from "@/components/rutas/elegir-actividades";
import { Boton } from "@/components/ui/boton";
import { BuscadorDeTitulo } from "@/components/ui/buscador-de-titulo";
import { Campo } from "@/components/ui/campo";
import { Casilla } from "@/components/ui/casilla";
import { IconoDeClase } from "@/components/marcas/icono-de-clase";
import { useDialogos } from "@/components/ui/dialogos";
import { MapaConPanel } from "@/components/ui/mapa-con-panel";
import { Opciones } from "@/components/ui/opciones";
import { Tarjeta } from "@/components/ui/tarjeta";
import { TarjetaQueAbre } from "@/components/ui/tarjeta-que-abre";
import { TRAZO_DE_AGREGAR_PUNTO, TRAZO_DE_MOVER_PUNTOS, TRAZO_DE_QUITAR_PUNTO } from "@/components/ui/iconos";
import { useSalidasDeLaApertura } from "@/hooks/use-salidas-de-la-apertura";
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
  type CaminoParaComparar,
  type PuntaCercana,
} from "@/lib/caminos/desde-salida";
import { agregarPuntoEnLinea, quitarPuntoDeLinea } from "@/lib/caminos/edicion-de-puntos";
import { unaVezPorApertura } from "@/lib/datos/una-vez-por-apertura";
import { rectanguloQueAbarca } from "@/lib/datos/rectangulo";
import { diaEnPalabras } from "@/lib/fechas";
import { sinTildes } from "@/lib/marcas/buscar-en-consultas";
import { ponerAlDiaDespuesDeGuardar } from "@/lib/offline/puesta-al-dia";
import { lineasDelRecorrido } from "@/lib/rutas/recorrido";
import { traerLaLineaUnaVez } from "@/lib/salidas/archivo";
import type { ActividadRuta, Salida } from "@/types/database";

/**
 * Caminos desde una salida (decisión 077): la línea del GPS de una salida, de
 * cualquier usuario, como **borrador**. La app marca por dónde va sobre
 * Caminos que ya existen; el usuario corta, corrige y descarta, y elige qué
 * partes nuevas se guardan como Caminos, **de a uno**: la parte elegida se
 * vuelve la tarjeta de un Camino nuevo, con su nombre, sus actividades y su
 * Guardar. **La app propone, el usuario decide**: nada se guarda hasta tocar
 * Guardar, y un Camino que ya existe nunca se toca desde acá.
 *
 * Es una forma más de agregar en Marcas, como «Traer de afuera»: solo la ven
 * quienes pueden crear Caminos. Se hace en la computadora y con señal.
 */

type Destino = "pendiente" | "descartada";
type Pieza = {
  clave: number;
  coordenadas: Position[];
  destino: Destino;
  /** El nombre con que quedó guardada como Camino. */
  nombre: string;
  /** El Camino que quedó guardado con esta parte. */
  guardadoComo: number | null;
};
type Herramienta = "elegir" | "cortar" | "mover" | "agregar" | "quitar";

let proximaClave = 1;
function piezaNueva(coordenadas: Position[]): Pieza {
  return { clave: proximaClave++, coordenadas, destino: "pendiente", nombre: "", guardadoComo: null };
}

function km(metros: number): string {
  return `${(metros / 1000).toFixed(metros < 10_000 ? 2 : 1).replace(".", ",")} km`;
}

export function CaminosDesdeUnaSalida({ alVolver }: { alVolver: () => void }) {
  const [salida, setSalida] = useState<Salida | null>(null);
  return salida
    ? <BorradorDeLaSalida salida={salida} alVolver={() => setSalida(null)} />
    : <ElegirLaSalida alElegir={setSalida} alVolver={alVolver} />;
}

// ---------------------------------------------------------------- elegir

function ElegirLaSalida({ alElegir, alVolver }: { alElegir: (salida: Salida) => void; alVolver: () => void }) {
  const datos = useSalidasDeLaApertura();
  const [titulo, setTitulo] = useState("");
  const conArchivo = datos.estado === "listo" ? datos.salidas.filter((salida) => salida.archivoUrl) : [];
  const buscado = sinTildes(titulo);
  const encontradas = buscado ? conArchivo.filter((salida) => sinTildes(salida.titulo).includes(buscado)) : conArchivo;

  return (
    <div className="space-y-4">
      <EncabezadoDeMapas titulo="Marcas" subtitulo="Desde una salida" alVolver={alVolver} />
      <p className="text-base text-texto-suave">
        Elegí una salida con archivo GPS. Su línea se abre como borrador: vas a ver por dónde fue sobre Caminos
        que ya existen y decidir qué partes nuevas querés guardar como Caminos.
      </p>
      {datos.estado === "cargando" ? <p role="status" className="text-base text-texto">Trayendo las salidas…</p> : null}
      {datos.estado === "fallo" ? (
        <Tarjeta franja="rojo" className="space-y-3">
          <p role="alert" className="text-base text-texto">No se pudo traer la lista de salidas: {datos.motivo}</p>
          <Boton variante="secundario" onClick={datos.reintentar}>Volver a intentar</Boton>
        </Tarjeta>
      ) : null}
      {datos.estado === "listo" && conArchivo.length === 0 ? (
        <Tarjeta><p className="text-base text-texto-suave">Ninguna salida tiene archivo GPS todavía.</p></Tarjeta>
      ) : null}
      {conArchivo.length > 0 ? <BuscadorDeTitulo titulo={titulo} placeholder="Buscar salida" alCambiar={setTitulo} /> : null}
      {conArchivo.length > 0 && encontradas.length === 0 ? (
        <Tarjeta><p className="text-base text-texto-suave">Ninguna salida con archivo GPS se llama así.</p></Tarjeta>
      ) : null}
      <ul className="grid gap-3 sm:grid-cols-2">
        {encontradas.map((cada) => (
          <li key={cada.id}>
            <TarjetaQueAbre etiqueta={`Abrir el GPS de ${cada.titulo}`} alAbrir={() => alElegir(cada)} className="space-y-1">
              <p className="text-lg font-semibold text-texto">{cada.titulo}</p>
              <p className="text-base text-texto-suave">
                {diaEnPalabras(cada.fecha)} · {cada.perfil.nombre}{cada.largoKm !== null ? ` · ${km(cada.largoKm * 1000)}` : ""}
              </p>
            </TarjetaQueAbre>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------- borrador

type Carga =
  | { estado: "cargando" }
  | { estado: "fallo"; motivo: string }
  | { estado: "listo"; caminos: CaminoParaComparar[]; original: Position[][] };

function armarPiezas(lineas: Position[][], caminos: CaminoParaComparar[]): Pieza[] {
  return lineas.flatMap((linea) => proponerPartes(achicarLinea(linea), caminos).map((parte) => piezaNueva(parte.coordenadas)));
}

/** El Camino que se está creando con una parte. Hay uno solo a la vez. */
type Creacion = {
  clave: number;
  nombre: string;
  actividades: ActividadRuta[];
  pegarInicio: boolean;
  pegarFinal: boolean;
};

function BorradorDeLaSalida({ salida, alVolver }: { salida: Salida; alVolver: () => void }) {
  const { confirmar } = useDialogos();
  const [carga, setCarga] = useState<Carga>({ estado: "cargando" });
  const [intento, setIntento] = useState(0);
  const [piezas, setPiezas] = useState<Pieza[]>([]);
  const [caminos, setCaminos] = useState<CaminoParaComparar[]>([]);
  const [elegida, setElegida] = useState<number | null>(null);
  const [creacion, setCreacion] = useState<Creacion | null>(null);
  const [herramienta, setHerramienta] = useState<Herramienta>("elegir");
  const [aviso, setAviso] = useState<string | null>(null);
  const [avisoDelCamino, setAvisoDelCamino] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [tocado, setTocado] = useState(false);
  const tarjetasDeParte = useRef(new Map<number, HTMLElement>());
  const claveAMostrar = creacion?.clave ?? elegida;

  // Al elegir una parte en el mapa, la tarjeta sube sola en el panel.
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
        const [linea, lista] = await Promise.all([
          traerLaLineaUnaVez(salida.archivoUrl ?? ""),
          // El mismo pedido que el editor de Circuitos: una vez por apertura.
          unaVezPorApertura("caminos-para-circuitos", leerCaminos),
        ]);
        if (!vigente) return;
        if (!linea.ok) { setCarga({ estado: "fallo", motivo: `No se pudo abrir el archivo GPS: ${linea.motivo}.` }); return; }
        if (!lista.ok) { setCarga({ estado: "fallo", motivo: `No se pudieron traer los Caminos para comparar: ${lista.error}` }); return; }
        const paraComparar = lista.datos.caminos.map((camino) => ({ id: camino.id, nombre: camino.nombre, coordenadas: camino.coordenadas }));
        const original = lineasDelRecorrido(linea.geometria).filter((cada) => cada.length >= 2);
        if (original.length === 0) { setCarga({ estado: "fallo", motivo: "El archivo GPS de esta salida no trae ninguna línea." }); return; }
        setCaminos(paraComparar);
        setPiezas(armarPiezas(original, paraComparar));
        setCarga({ estado: "listo", caminos: paraComparar, original });
      } catch (causa) {
        if (vigente) setCarga({ estado: "fallo", motivo: `${causa instanceof Error ? causa.message : String(causa)}. Revisá la señal y volvé a intentar.` });
      }
    })();
    return () => { vigente = false; };
  }, [salida.archivoUrl, intento]);

  // Por dónde va cada parte y qué Camino tiene cerca en cada punta: propuestas, se recalculan al editar.
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

  // Mientras se crea un Camino, las herramientas trabajan sobre esa parte y nada más.
  const enUso = creacion?.clave ?? elegida;
  const piezaEnUso = piezas.find((pieza) => pieza.clave === enUso) ?? null;
  const editandoLinea = herramienta === "mover" || herramienta === "agregar" || herramienta === "quitar";

  // El borrador: verde donde va sobre un Camino, con el color de la línea de las salidas donde es nuevo.
  const dibujo = useMemo((): FeatureCollection<LineString> => ({
    type: "FeatureCollection",
    features: piezas.flatMap((pieza, indice) => {
      if (pieza.destino === "descartada") return [];
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
          borrador: pieza.clave, paso: "transitable",
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

  // Los Caminos que ya existen van debajo, finos: el borrador se ve encima.
  const caminosExistentes = useMemo((): FeatureCollection<LineString> => ({
    type: "FeatureCollection",
    features: caminos.map((camino) => ({
      type: "Feature" as const,
      properties: { camino_id: camino.id, nombre: camino.nombre },
      geometry: { type: "LineString" as const, coordinates: camino.coordenadas },
    })),
  }), [caminos]);

  const encuadre = useMemo(() => carga.estado === "listo"
    ? rectanguloQueAbarca(carga.original.flat().map((punto): [number, number] => [punto[0], punto[1]]))
    : null, [carga]);

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
    if (!pieza || pieza.guardadoComo !== null) return;
    // Creando un Camino, las otras partes no se tocan.
    if (creacion && clave !== creacion.clave) {
      setAviso("Estás creando un Camino: terminalo con Guardar o cancelalo para trabajar con otra parte.");
      return;
    }
    if (herramienta === "cortar") {
      const corte = cortarLinea(pieza.coordenadas, lon, lat);
      if (!corte.ok) { setAviso(corte.error); return; }
      const [antes, despues] = corte.datos.map(piezaNueva);
      setPiezas((actuales) => actuales.flatMap((cada) => cada.clave === clave ? [antes, despues] : [cada]));
      // La parte nueva (después del corte) queda elegida: cortar para seguir
      // con el pedazo que acabás de separar, no con otro.
      if (creacion) {
        setCreacion({ ...creacion, clave: despues.clave, pegarInicio: false });
        setAviso("Se cortó: el Camino que estás creando sigue con la parte nueva; el otro pedazo quedó aparte.");
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
    setCreacion({ clave: pieza.clave, nombre: "", actividades: [], pegarInicio: false, pegarFinal: false });
    setElegida(pieza.clave);
    setAviso(null);
    setAvisoDelCamino(null);
    setTocado(true);
  };

  const cancelarCamino = async () => {
    if (!creacion) return;
    if (!(await confirmar({
      titulo: "¿Cancelar este Camino?",
      mensaje: "Se pierden el nombre, las actividades y las puntas pegadas. La parte vuelve a quedar como estaba.",
      textoDeAceptar: "Cancelar el Camino",
      textoDeCancelar: "Seguir creándolo",
      destructivo: true,
    }))) return;
    setCreacion(null);
    setAvisoDelCamino(null);
  };

  const volver = async () => {
    const hayGuardados = piezas.some((pieza) => pieza.guardadoComo !== null);
    const hayPartesPendientes = piezas.some((pieza) =>
      pieza.destino === "pendiente" && pieza.guardadoComo === null);
    if (!hayQueConfirmarSalida({
      creandoCamino: Boolean(creacion),
      tocado,
      hayPartesPendientes,
    })) {
      alVolver();
      return;
    }
    const cartel = cartelAlSalir({ creandoCamino: Boolean(creacion), hayGuardados });
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
      titulo: "¿Volver al GPS como vino?",
      mensaje: "Se pierden los cortes, las correcciones y el Camino que estás creando. Los Caminos ya guardados quedan.",
      textoDeAceptar: "Volver al GPS original",
      destructivo: true,
    }))) return;
    setPiezas(armarPiezas(carga.original, caminos));
    setElegida(null);
    setCreacion(null);
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
    if (analisis.get(pieza.clave)?.va) {
      setAvisoDelCamino("Así como está, esta parte va sobre un Camino que ya existe y sería un Camino repetido. Cortala para separar lo nuevo.");
      return;
    }
    setGuardando(true);
    setAvisoDelCamino(null);
    try {
      const resultado = await crearCaminoNuevo({
        nombre,
        descripcion: `Desde la salida «${salida.titulo}» del ${diaEnPalabras(salida.fecha)}.`,
        actividades: creacion.actividades,
        coordenadas: lineaDe(pieza),
      });
      if (!resultado.ok) { setAvisoDelCamino(`No se guardó el Camino: ${resultado.error}`); return; }
      const nuevo = resultado.datos;
      setPiezas((actuales) => actuales.map((cada) => cada.clave === pieza.clave
        ? { ...cada, coordenadas: lineaDe(pieza), nombre, guardadoComo: nuevo.id } : cada));
      // Desde ahora el Camino nuevo también cuenta para comparar.
      setCaminos((actuales) => [...actuales, { id: nuevo.id, nombre: nuevo.nombre, coordenadas: nuevo.coordenadas }]);
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

  const ayudaDeHerramienta: Record<Herramienta, string> = {
    elegir: "Tocá una parte en el mapa o en la lista para elegirla.",
    cortar: creacion ? "Tocá la línea del Camino que estás creando donde la querés cortar." : "Tocá la línea donde la querés cortar.",
    mover: creacion ? "Arrastrá los puntos del Camino que estás creando." : "Elegí una parte y arrastrá sus puntos hasta su lugar.",
    agregar: creacion ? "Tocá la línea del Camino que estás creando, entre dos puntos." : "Elegí una parte y tocá su línea entre dos puntos.",
    quitar: creacion ? "Tocá el punto del Camino que estás creando que querés quitar." : "Elegí una parte y tocá el punto que querés quitar.",
  };

  return (
    <div className="space-y-4">
      <EncabezadoDeMapas titulo="Marcas" subtitulo={salida.titulo} alVolver={() => void volver()} volverDeshabilitado={guardando} />
      {carga.estado === "cargando" ? <p role="status" className="text-base text-texto">Abriendo el GPS de la salida…</p> : null}
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
            <CargadorDeMapa enVivo llenarElAltoEnLaComputadora encuadre={encuadre} encuadrarSoloAlAbrir caminos={dibujo}
              caminosEncima={caminosExistentes}
              alTocarCamino={tocarElMapa}
              verticesDeCamino={editandoLinea && piezaEnUso && piezaEnUso.guardadoComo === null ? piezaEnUso.coordenadas : null}
              alTocarVerticeDeCamino={herramienta === "quitar" ? quitarPunto : undefined}
              alMoverVerticeDeCamino={herramienta === "mover" ? moverPunto : undefined} />
          }
          panel={
            <div className="space-y-4">
              <Tarjeta className="space-y-2">
                <p className="text-base text-texto">
                  La línea gruesa es el GPS, como borrador (va por encima). En verde, las partes que van sobre un
                  Camino que ya existe (a menos de {ANCHO_DEL_PASILLO_M} m); en el color de las salidas, las que no
                  coinciden con ninguno. Los Caminos existentes se ven debajo, en una línea fina gris. Al pasar el
                  cursor por un tramo ves qué parte es; al tocarlo, la tarjeta sube sola en el panel. Es una
                  propuesta: revisala.
                </p>
                <Opciones etiqueta="Herramienta" columnas={3} iconoArriba elegidas={[herramienta]}
                  alElegir={(nueva) => { setHerramienta(nueva); setAviso(null); }}
                  opciones={[
                    { valor: "elegir", etiqueta: "Elegir parte" },
                    { valor: "cortar", etiqueta: "Cortar" },
                    { valor: "mover", etiqueta: "Mover puntos", trazo: TRAZO_DE_MOVER_PUNTOS },
                    { valor: "agregar", etiqueta: "Agregar punto", trazo: TRAZO_DE_AGREGAR_PUNTO },
                    { valor: "quitar", etiqueta: "Quitar punto", trazo: TRAZO_DE_QUITAR_PUNTO },
                  ]} />
                <p className="text-base text-texto-suave">{ayudaDeHerramienta[herramienta]}</p>
                {aviso ? <p role="alert" className="text-base text-ambar-texto">{aviso}</p> : null}
              </Tarjeta>

              <h3 className="text-lg font-bold text-texto">Partes ({piezas.length})</h3>
              {piezas.map((pieza, indice) => {
                const datos = analisis.get(pieza.clave);
                const largo = km(datos?.largo ?? 0);
                if (creacion?.clave === pieza.clave) {
                  return (
                    <div key={pieza.clave} ref={(nodo) => guardarRefDeParte(pieza.clave, nodo)}>
                      <TarjetaDelCaminoNuevo numero={indice + 1} largo={largo} creacion={creacion}
                        inicio={datos?.inicio ?? null} final={datos?.final ?? null} vaSobre={datos?.va?.sobre.nombre ?? null}
                        guardando={guardando} aviso={avisoDelCamino} alCambiar={cambiarCreacion}
                        alCancelar={() => void cancelarCamino()} alGuardar={() => void guardarCamino()} />
                    </div>
                  );
                }
                const esElegida = pieza.clave === elegida && !creacion;
                const bloqueada = guardando || pieza.guardadoComo !== null;
                return (
                  <div key={pieza.clave} ref={(nodo) => guardarRefDeParte(pieza.clave, nodo)}>
                    <Tarjeta className={`space-y-3 ${esElegida ? "ring-2 ring-acento-borde" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-base font-semibold text-texto">
                          Parte {indice + 1} · {largo}{esElegida ? " · elegida" : ""}
                        </p>
                        {!esElegida && !creacion && pieza.destino !== "descartada" && pieza.guardadoComo === null ? (
                          <Boton variante="secundario" onClick={() => setElegida(pieza.clave)}>Elegir</Boton>
                        ) : null}
                      </div>
                      {pieza.guardadoComo !== null ? (
                        <p className="text-base text-verde-texto">Guardada como el Camino «{pieza.nombre}».</p>
                      ) : pieza.destino === "descartada" ? (
                        <>
                          <p className="text-base text-texto-suave">Descartada: no se guarda y no se ve en el mapa.</p>
                          <Boton variante="secundario" disabled={guardando || Boolean(creacion)}
                            onClick={() => cambiarPieza(pieza.clave, { destino: "pendiente" })}>Volver a usarla</Boton>
                        </>
                      ) : datos?.va ? (
                        <>
                          <p className="text-base text-texto">
                            Va sobre «{datos.va.sobre.nombre}» ({Math.round(datos.va.proporcion * 100)} % de esta parte).
                            Ese Camino ya existe y no se toca.
                          </p>
                          <Boton variante="secundario" disabled={bloqueada || Boolean(creacion)}
                            onClick={() => cambiarPieza(pieza.clave, { destino: "descartada" })}>Descartar</Boton>
                        </>
                      ) : (
                        <>
                          <p className="text-base text-texto">No coincide con ningún Camino.</p>
                          {creacion ? (
                            <p className="text-base text-texto-suave">Para usar esta parte, terminá o cancelá el Camino que estás creando.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <Boton variante="secundario" disabled={bloqueada} onClick={() => empezarCamino(pieza)}>Crear Camino</Boton>
                              <Boton variante="secundario" disabled={bloqueada}
                                onClick={() => cambiarPieza(pieza.clave, { destino: "descartada" })}>Descartar</Boton>
                            </div>
                          )}
                        </>
                      )}
                    </Tarjeta>
                  </div>
                );
              })}

              <Tarjeta className="space-y-2">
                <p className="text-base text-texto-suave">
                  Si te perdiste entre cortes y correcciones, podés volver a empezar con la línea del GPS como vino.
                </p>
                <Boton variante="secundario" disabled={guardando} onClick={() => void empezarDeNuevo()}>Volver al GPS original</Boton>
              </Tarjeta>
            </div>
          }
        />
      ) : null}
    </div>
  );
}

/**
 * La parte convertida en un Camino que se está creando: se nota a simple vista,
 * con su título, y tiene todo lo del Camino adentro. Guardar guarda solo este.
 */
function TarjetaDelCaminoNuevo({ numero, largo, creacion, inicio, final, vaSobre, guardando, aviso, alCambiar, alCancelar, alGuardar }: {
  numero: number;
  largo: string;
  creacion: Creacion;
  inicio: PuntaCercana | null;
  final: PuntaCercana | null;
  vaSobre: string | null;
  guardando: boolean;
  aviso: string | null;
  alCambiar: (cambio: Partial<Creacion>) => void;
  alCancelar: () => void;
  alGuardar: () => void;
}) {
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
      <p className="text-base text-texto-suave">Empieza por explorar. La condición y la complejidad se cargan después, en su ficha.</p>
      {aviso ? <p role="alert" className="text-base text-ambar-texto">{aviso}</p> : null}
      <div className="flex flex-wrap justify-between gap-2 border-t border-borde pt-3">
        <Boton variante="secundario" disabled={guardando} onClick={alCancelar}>Cancelar</Boton>
        <Boton disabled={guardando} onClick={alGuardar}>{guardando ? "Guardando…" : "Guardar"}</Boton>
      </div>
    </Tarjeta>
  );
}
