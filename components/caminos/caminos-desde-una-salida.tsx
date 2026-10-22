"use client";

import { useEffect, useMemo, useState } from "react";
import type { FeatureCollection, LineString, Position } from "geojson";
import { crearCaminoNuevo, leerCaminos } from "@/app/actions/caminos";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { EncabezadoDeMapas } from "@/components/mapas/pantalla-de-mapas";
import { ElegirActividades } from "@/components/rutas/elegir-actividades";
import { Boton } from "@/components/ui/boton";
import { BuscadorDeTitulo } from "@/components/ui/buscador-de-titulo";
import { Casilla } from "@/components/ui/casilla";
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
  cortarLinea,
  largoDeParte,
  pegarPunta,
  porDondeVa,
  proponerPartes,
  puntaCercana,
  type CaminoParaComparar,
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
 * partes nuevas se guardan como Caminos. **La app propone, el usuario
 * decide**: nada se guarda hasta tocar Guardar, y un Camino que ya existe
 * nunca se toca desde acá.
 *
 * Es una forma más de agregar en Marcas, como «Traer de afuera»: solo la ven
 * quienes pueden crear Caminos. Se hace en la computadora y con señal.
 */

type Destino = "pendiente" | "camino" | "descartada";
type Pieza = {
  clave: number;
  coordenadas: Position[];
  destino: Destino;
  nombre: string;
  pegarInicio: boolean;
  pegarFinal: boolean;
  /** El Camino que quedó guardado con esta parte. */
  guardadoComo: number | null;
};
type Herramienta = "elegir" | "cortar" | "mover" | "agregar" | "quitar";

let proximaClave = 1;
function piezaNueva(coordenadas: Position[]): Pieza {
  return { clave: proximaClave++, coordenadas, destino: "pendiente", nombre: "", pegarInicio: false, pegarFinal: false, guardadoComo: null };
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

function BorradorDeLaSalida({ salida, alVolver }: { salida: Salida; alVolver: () => void }) {
  const { confirmar } = useDialogos();
  const [carga, setCarga] = useState<Carga>({ estado: "cargando" });
  const [intento, setIntento] = useState(0);
  const [piezas, setPiezas] = useState<Pieza[]>([]);
  const [caminos, setCaminos] = useState<CaminoParaComparar[]>([]);
  const [elegida, setElegida] = useState<number | null>(null);
  const [herramienta, setHerramienta] = useState<Herramienta>("elegir");
  const [actividades, setActividades] = useState<ActividadRuta[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [tocado, setTocado] = useState(false);

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

  const lineaParaGuardar = (pieza: Pieza): Position[] => {
    const datos = analisis.get(pieza.clave);
    let linea = pieza.coordenadas;
    if (pieza.pegarInicio && datos?.inicio) linea = pegarPunta(linea, "inicio", datos.inicio.coordenada);
    if (pieza.pegarFinal && datos?.final) linea = pegarPunta(linea, "final", datos.final.coordenada);
    return linea;
  };

  const elegidaPieza = piezas.find((pieza) => pieza.clave === elegida) ?? null;
  const editandoLinea = herramienta === "mover" || herramienta === "agregar" || herramienta === "quitar";

  // El borrador: verde donde va sobre un Camino, con el color de la línea de las salidas donde es nuevo.
  const dibujo = useMemo((): FeatureCollection<LineString> => ({
    type: "FeatureCollection",
    features: piezas.filter((pieza) => pieza.destino !== "descartada").map((pieza) => {
      const sobre = Boolean(analisis.get(pieza.clave)?.va);
      return {
        type: "Feature" as const,
        properties: {
          borrador: pieza.clave, paso: "transitable",
          ...(sobre ? { complejidad: "facil" } : { complejidad: null, lineaDeSalida: true }),
          elegida: pieza.clave === elegida,
        },
        geometry: { type: "LineString" as const, coordinates: lineaParaGuardar(pieza) },
      };
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [piezas, analisis, elegida]);

  // Los Caminos que ya existen van encima, finos: así se ven los dos.
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

  const tocarElMapa = (lon: number, lat: number, propiedades: Record<string, unknown>) => {
    const clave = Number(propiedades.borrador);
    if (!Number.isInteger(clave)) return;
    const pieza = piezas.find((cada) => cada.clave === clave);
    if (!pieza || pieza.guardadoComo !== null) return;
    if (herramienta === "cortar") {
      const corte = cortarLinea(pieza.coordenadas, lon, lat);
      if (!corte.ok) { setAviso(corte.error); return; }
      const [antes, despues] = corte.datos.map(piezaNueva);
      setPiezas((actuales) => actuales.flatMap((cada) => cada.clave === clave ? [antes, despues] : [cada]));
      setElegida(null);
      setTocado(true);
      setAviso("Se cortó la parte en dos. Revisá qué hacer con cada una.");
      return;
    }
    if (herramienta === "agregar" && clave === elegida) {
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
    if (!elegidaPieza) return;
    const resultado = quitarPuntoDeLinea(elegidaPieza.coordenadas, indice);
    if (!resultado.ok) { setAviso(resultado.error); return; }
    cambiarPieza(elegidaPieza.clave, { coordenadas: resultado.datos });
  };

  const moverPunto = (indice: number, lon: number, lat: number) => {
    if (!elegidaPieza) return;
    cambiarPieza(elegidaPieza.clave, {
      coordenadas: elegidaPieza.coordenadas.map((punto, i) => i === indice ? [lon, lat] : [punto[0], punto[1]]),
    });
  };

  const volver = async () => {
    const pendientesDeGuardar = piezas.some((pieza) => pieza.destino === "camino" && pieza.guardadoComo === null);
    if ((tocado || pendientesDeGuardar) && !(await confirmar({
      titulo: "¿Salir sin guardar?",
      mensaje: "Los cortes, las correcciones y lo que marcaste como Camino se pierden. Los Caminos ya guardados quedan.",
      textoDeAceptar: "Salir sin guardar",
      destructivo: true,
    }))) return;
    alVolver();
  };

  const empezarDeNuevo = async () => {
    if (carga.estado !== "listo") return;
    if (!(await confirmar({
      titulo: "¿Volver al GPS como vino?",
      mensaje: "Se pierden los cortes, las correcciones y lo que marcaste. Los Caminos ya guardados quedan.",
      textoDeAceptar: "Volver al GPS original",
      destructivo: true,
    }))) return;
    setPiezas(armarPiezas(carga.original, caminos));
    setElegida(null);
    setHerramienta("elegir");
    setTocado(false);
    setAviso(null);
  };

  const paraGuardar = piezas.filter((pieza) => pieza.destino === "camino" && pieza.guardadoComo === null);
  const sinNombre = paraGuardar.filter((pieza) => !pieza.nombre.trim()).length;
  const repetidas = paraGuardar.filter((pieza) => analisis.get(pieza.clave)?.va).length;
  const puedeGuardar = paraGuardar.length > 0 && sinNombre === 0 && repetidas === 0 && actividades.length > 0 && !guardando;

  const guardar = async () => {
    if (!puedeGuardar) return;
    setGuardando(true);
    setAviso(null);
    let guardados = 0;
    let problema: string | null = null;
    try {
      for (const pieza of paraGuardar) {
        const resultado = await crearCaminoNuevo({
          nombre: pieza.nombre.trim(),
          descripcion: `Desde la salida «${salida.titulo}» del ${diaEnPalabras(salida.fecha)}.`,
          actividades,
          coordenadas: lineaParaGuardar(pieza),
        });
        if (!resultado.ok) { problema = `«${pieza.nombre.trim()}» no quedó guardado: ${resultado.error}`; break; }
        guardados += 1;
        const nuevo = resultado.datos;
        setPiezas((actuales) => actuales.map((cada) => cada.clave === pieza.clave ? { ...cada, guardadoComo: nuevo.id } : cada));
        // Desde ahora el Camino nuevo también cuenta para comparar.
        setCaminos((actuales) => [...actuales, { id: nuevo.id, nombre: nuevo.nombre, coordenadas: nuevo.coordenadas }]);
      }
      if (guardados > 0) {
        const puesta = await ponerAlDiaDespuesDeGuardar();
        if (puesta.clase === "fallo") {
          problema = `${problema ? `${problema} ` : ""}Lo guardado no aparece todavía en este celular: ${puesta.motivo}. Volvé a poner la app al día con conexión.`;
        }
      }
      setAviso(problema ?? (guardados === 1 ? "Se guardó 1 Camino nuevo." : `Se guardaron ${guardados} Caminos nuevos.`));
    } catch (causa) {
      setAviso(`Se interrumpió el guardado: ${causa instanceof Error ? causa.message : String(causa)}. Lo ya guardado no se repite si tocás Guardar de nuevo.`);
    } finally {
      setGuardando(false);
    }
  };

  const ayudaDeHerramienta: Record<Herramienta, string> = {
    elegir: "Tocá una parte en el mapa o en la lista para elegirla.",
    cortar: "Tocá la línea donde la querés cortar.",
    mover: "Elegí una parte y arrastrá sus puntos hasta su lugar.",
    agregar: "Elegí una parte y tocá su línea entre dos puntos.",
    quitar: "Elegí una parte y tocá el punto que querés quitar.",
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
              verticesDeCamino={editandoLinea && elegidaPieza && elegidaPieza.guardadoComo === null ? elegidaPieza.coordenadas : null}
              alTocarVerticeDeCamino={herramienta === "quitar" ? quitarPunto : undefined}
              alMoverVerticeDeCamino={herramienta === "mover" ? moverPunto : undefined} />
          }
          panel={
            <div className="space-y-4">
              <Tarjeta className="space-y-2">
                <p className="text-base text-texto">
                  La línea gruesa es el GPS, como borrador. En verde, las partes que van sobre un Camino que ya
                  existe (a menos de {ANCHO_DEL_PASILLO_M} m); en el color de las salidas, las que no coinciden con
                  ninguno. Los Caminos existentes se ven encima, en una línea fina gris. Es una propuesta: revisala.
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
                {aviso && !aviso.startsWith("Se guard") ? <p role="alert" className="text-base text-ambar-texto">{aviso}</p> : null}
              </Tarjeta>

              <h3 className="text-lg font-bold text-texto">Partes ({piezas.length})</h3>
              {piezas.map((pieza, indice) => {
                const datos = analisis.get(pieza.clave);
                const esElegida = pieza.clave === elegida;
                const bloqueada = guardando || pieza.guardadoComo !== null;
                return (
                  <Tarjeta key={pieza.clave} franja={esElegida ? "verde" : undefined} className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-base font-semibold text-texto">Parte {indice + 1} · {km(datos?.largo ?? 0)}</p>
                      {!esElegida && pieza.destino !== "descartada" ? (
                        <Boton variante="secundario" onClick={() => setElegida(pieza.clave)}>Elegir</Boton>
                      ) : null}
                    </div>
                    {pieza.guardadoComo !== null ? (
                      <p className="text-base text-verde-texto">Guardada como el Camino «{pieza.nombre.trim()}».</p>
                    ) : pieza.destino === "descartada" ? (
                      <>
                        <p className="text-base text-texto-suave">Descartada: no se guarda y no se ve en el mapa.</p>
                        <Boton variante="secundario" disabled={guardando} onClick={() => cambiarPieza(pieza.clave, { destino: "pendiente" })}>Volver a usarla</Boton>
                      </>
                    ) : datos?.va ? (
                      <>
                        <p className="text-base text-texto">
                          Va sobre «{datos.va.sobre.nombre}» ({Math.round(datos.va.proporcion * 100)} % de esta parte).
                          Ese Camino ya existe y no se toca.
                        </p>
                        {pieza.destino === "camino" ? (
                          <p role="alert" className="text-base text-ambar-texto">
                            Así como está, sería un Camino repetido. Cortala para separar lo nuevo, o descartala.
                          </p>
                        ) : null}
                        <Boton variante="secundario" disabled={bloqueada} onClick={() => cambiarPieza(pieza.clave, { destino: "descartada" })}>Descartar</Boton>
                      </>
                    ) : (
                      <>
                        <p className="text-base text-texto">No coincide con ningún Camino.</p>
                        <div className="flex flex-wrap gap-2">
                          <Boton variante={pieza.destino === "camino" ? "principal" : "secundario"} aria-pressed={pieza.destino === "camino"}
                            disabled={bloqueada} onClick={() => cambiarPieza(pieza.clave, { destino: pieza.destino === "camino" ? "pendiente" : "camino" })}>
                            Crear Camino
                          </Boton>
                          <Boton variante="secundario" disabled={bloqueada} onClick={() => cambiarPieza(pieza.clave, { destino: "descartada" })}>Descartar</Boton>
                        </div>
                        {pieza.destino === "camino" ? (
                          <div className="space-y-2">
                            <label className="block text-base text-texto">Nombre del Camino
                              <input className="mt-1 block w-full rounded-xl border border-borde-fuerte bg-fondo p-2 text-texto" value={pieza.nombre}
                                maxLength={120} disabled={bloqueada} onChange={(evento) => cambiarPieza(pieza.clave, { nombre: evento.target.value })} />
                            </label>
                            {(["inicio", "final"] as const).map((extremo) => {
                              const cercana = extremo === "inicio" ? datos?.inicio : datos?.final;
                              if (!cercana) return null;
                              const campo = extremo === "inicio" ? "pegarInicio" : "pegarFinal";
                              return (
                                <div key={extremo} className="flex items-center gap-1">
                                  <Casilla tildada={pieza[campo]} etiqueta={`Pegar la punta ${extremo === "inicio" ? "inicial" : "final"} a «${cercana.camino.nombre}»`}
                                    alTocar={() => cambiarPieza(pieza.clave, { [campo]: !pieza[campo] })} />
                                  <span className="text-base text-texto">
                                    Pegar la punta {extremo === "inicio" ? "inicial" : "final"} a «{cercana.camino.nombre}» (está a {Math.round(cercana.distanciaM)} m)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </>
                    )}
                  </Tarjeta>
                );
              })}

              <Tarjeta className="space-y-3">
                <ElegirActividades etiqueta="Actividades de los Caminos nuevos" modo="varias" obligatorio
                  elegidas={actividades} deshabilitado={guardando}
                  alTocar={(actividad) => setActividades((actuales) => actuales.includes(actividad)
                    ? actuales.filter((cada) => cada !== actividad) : [...actuales, actividad])} />
                <p className="text-base text-texto-suave">
                  Cada Camino nuevo empieza por explorar. La condición y la complejidad se cargan después, en su ficha.
                </p>
                {paraGuardar.length === 0 ? <p className="text-base text-texto-suave">Marcá al menos una parte con «Crear Camino».</p> : null}
                {sinNombre > 0 ? <p className="text-base text-ambar-texto">Falta el nombre de {sinNombre === 1 ? "un Camino" : `${sinNombre} Caminos`}.</p> : null}
                {repetidas > 0 ? <p className="text-base text-ambar-texto">Hay partes marcadas que van sobre un Camino existente. Cortalas o descartalas.</p> : null}
                {paraGuardar.length > 0 && actividades.length === 0 ? <p className="text-base text-ambar-texto">Elegí al menos una actividad.</p> : null}
                <div className="flex flex-wrap justify-between gap-2 border-t border-borde pt-3">
                  <Boton variante="secundario" disabled={guardando} onClick={() => void empezarDeNuevo()}>Volver al GPS original</Boton>
                  <Boton disabled={!puedeGuardar} onClick={() => void guardar()}>{guardando ? "Guardando…" : "Guardar"}</Boton>
                </div>
                {aviso && aviso.startsWith("Se guard") ? <p role="status" className="text-base text-verde-texto">{aviso}</p> : null}
              </Tarjeta>
            </div>
          }
        />
      ) : null}
    </div>
  );
}
