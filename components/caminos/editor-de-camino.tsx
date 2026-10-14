"use client";

import { useEffect, useMemo, useState } from "react";
import {
  cambiarActividadesDelCamino, cambiarDatosDeParteDelCamino, cambiarNombreDelCamino,
  clasificarParteDelCamino, corregirLineaDelCamino, leerCamino, retirarCamino,
} from "@/app/actions/caminos";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { Boton } from "@/components/ui/boton";
import { EncabezadoDeMapas } from "@/components/mapas/pantalla-de-mapas";
import { MenuDeAcciones } from "@/components/ui/menu-de-acciones";
import { BotonDeEmergente, Emergente } from "@/components/ui/emergente";
import { MapaConPanel } from "@/components/ui/mapa-con-panel";
import { Tarjeta } from "@/components/ui/tarjeta";
import { ElegirActividades } from "@/components/rutas/elegir-actividades";
import { Pestanas } from "@/components/ui/pestanas";
import { ContadorDeCaracteres } from "@/components/ui/contador-de-caracteres";
import { hoyEnCordoba } from "@/lib/salidas/reglas";
import { Opciones } from "@/components/ui/opciones";
import { TRAZO_DE_AGREGAR_PUNTO, TRAZO_DE_MOVER_PUNTOS, TRAZO_DE_QUITAR_PUNTO } from "@/components/ui/iconos";
import { dibujarCaminos } from "@/lib/caminos/dibujo";
import { corregirLinea, ubicarEnCamino, type ComplejidadDeParte, type CondicionDePaso } from "@/lib/caminos/partes";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import { rectanguloQueAbarca } from "@/lib/datos/rectangulo";
import { agregarPuntoEnLinea, quitarPuntoDeLinea } from "@/lib/caminos/edicion-de-puntos";
import { mostrarActividad } from "@/lib/rutas/actividades";
import { MuestraDeComplejidad, MuestraDeLinea, nombreDeComplejidad, nombreDelPaso } from "@/components/rutas/referencia-de-partes";
import { ponerAlDiaDespuesDeGuardar } from "@/lib/offline/puesta-al-dia";
import type { ActividadRuta } from "@/types/database";

type Pestana = "datos" | "linea" | "partes";

export function EditorDeCamino({ id, alVolver }: { id: number; alVolver: () => void }) {
  const [camino, setCamino] = useState<CaminoGuardado | null>(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  // Los avisos van al lado del botón que los provocó, no arriba del mapa.
  const [avisoDePartir, setAvisoDePartir] = useState(false);
  const [pestana, setPestana] = useState<Pestana>("datos");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [actividades, setActividades] = useState<ActividadRuta[]>([]);
  const [actividad, setActividad] = useState<ActividadRuta | null>(null);
  const [indice, setIndice] = useState(0);
  const [observacion, setObservacion] = useState("");
  const [fecha, setFecha] = useState("");
  // Lo elegido en la parte antes de tocar Guardar: nada se guarda solo.
  // Se recuerda lo de cada actividad de la parte hasta tocar Guardar, que guarda todo junto.
  const [borradorDeLaParte, setBorradorDeLaParte] = useState<{
    parte: string;
    porActividad: Partial<Record<ActividadRuta, { paso: CondicionDePaso; complejidad: ComplejidadDeParte | null }>>;
  } | null>(null);
  const [actividadesPendientes, setActividadesPendientes] = useState<ActividadRuta[] | null>(null);
  const [confirmarRetiro, setConfirmarRetiro] = useState(false);
  const [primerCorte, setPrimerCorte] = useState<number | null>(null);
  const [partiendo, setPartiendo] = useState(false);
  const [borradorLinea, setBorradorLinea] = useState<number[][] | null>(null);
  const [modoCorreccion, setModoCorreccion] = useState<"mover" | "agregar" | "quitar">("mover");

  useEffect(() => {
    let vigente = true;
    void leerCamino(id).then((resultado) => {
      if (!vigente) return;
      if (resultado.ok) {
        setCamino(resultado.datos);
        setNombre(resultado.datos.nombre);
        setDescripcion(resultado.datos.descripcion ?? "");
        setActividades(resultado.datos.actividades);
        setActividad(resultado.datos.actividades[0] ?? null);
        setObservacion(resultado.datos.partes[0]?.observacion ?? "");
        setFecha(resultado.datos.partes[0]?.comprobadoEl ?? hoyEnCordoba());
      } else setAviso(resultado.error);
      setCargando(false);
    }).catch((causa) => {
      if (!vigente) return;
      setAviso(`No se pudo abrir el Camino: ${causa instanceof Error ? causa.message : String(causa)}. Volvé a la lista y probá de nuevo.`);
      setCargando(false);
    });
    return () => { vigente = false; };
  }, [id]);

  const parte = camino?.partes[indice] ?? null;
  const claveDeLaParte = parte ? `${parte.desdeM}-${parte.hastaM}` : "";
  const borradorVigente = borradorDeLaParte?.parte === claveDeLaParte ? borradorDeLaParte.porActividad : {};
  const elegidoDeLaActividad = actividad ? borradorVigente[actividad] ?? parte?.porActividad[actividad] : undefined;
  const pasoElegido: CondicionDePaso = elegidoDeLaActividad?.paso ?? "por_explorar";
  const complejidadElegida: ComplejidadDeParte | null = elegidoDeLaActividad?.complejidad ?? null;
  const elegirEnLaParte = (paso: CondicionDePaso, complejidad: ComplejidadDeParte | null) => {
    if (!actividad) return;
    setBorradorDeLaParte({
      parte: claveDeLaParte,
      // Sin paso no lleva complejidad.
      porActividad: { ...borradorVigente, [actividad]: { paso, complejidad: paso === "sin_paso" ? null : complejidad } },
    });
  };
  const encuadre = useMemo(() => camino ? rectanguloQueAbarca(camino.coordenadas.map((punto) => [punto[0], punto[1]])) : null, [camino]);
  const vistaPrevia = useMemo(() => camino && borradorLinea ? corregirLinea(camino, borradorLinea) : null, [camino, borradorLinea]);
  // La sección Línea ya es para editarla: entrar es empezar a corregir, sin botón de más.
  const corrigiendo = pestana === "linea";
  const caminoVisible = corrigiendo && vistaPrevia?.ok ? vistaPrevia.datos : camino;
  const dibujo = useMemo(() => caminoVisible && actividad ? dibujarCaminos([caminoVisible], actividad) : null, [caminoVisible, actividad]);

  const seleccionarParte = (nueva: number, de: CaminoGuardado | null = camino) => {
    if (!de?.partes[nueva]) return;
    setIndice(nueva);
    setObservacion(de.partes[nueva].observacion ?? "");
    setFecha(de.partes[nueva].comprobadoEl ?? hoyEnCordoba());
  };

  const guardar = async (hacer: (actual: CaminoGuardado) => Promise<{ ok: true; datos: CaminoGuardado } | { ok: false; error: string }>, texto: string, dePartir = false): Promise<boolean> => {
    if (!camino || ocupado) return false;
    setOcupado(true);
    setAviso(null);
    setAvisoDePartir(dePartir);
    try {
      const resultado = await hacer(camino);
      if (!resultado.ok) { setAviso(resultado.error); return false; }
      setCamino(resultado.datos);
      if (actividad && !resultado.datos.actividades.includes(actividad)) {
        setActividad(resultado.datos.actividades[0] ?? null);
      }
      setIndice(Math.min(indice, resultado.datos.partes.length - 1));
      const puesta = await ponerAlDiaDespuesDeGuardar();
      setAviso(puesta.clase === "fallo"
        ? `${texto}, pero este celular todavía no muestra el cambio: ${puesta.motivo}. Con conexión, volvé a poner la app al día.`
        : texto);
      return true;
    } catch (causa) {
      setAviso(`No se pudo guardar: ${causa instanceof Error ? causa.message : String(causa)}. Revisá si el cambio aparece antes de volver a tocar Guardar.`);
      return false;
    } finally { setOcupado(false); }
  };

  // Tocar una actividad solo la prende o la apaga en pantalla: se guarda con
  // el resto de los datos, con un solo botón. La última no se puede apagar.
  const tocarActividad = (opcion: ActividadRuta) => {
    if (!actividades.includes(opcion)) setActividades([...actividades, opcion]);
    else if (actividades.length > 1) setActividades(actividades.filter((cada) => cada !== opcion));
  };

  const guardarDatosYActividades = (nuevas: ActividadRuta[]) => {
    void guardar(async (actual) => {
      const conDatos = await cambiarNombreDelCamino(actual.id, actual.actualizadoEn, { nombre, descripcion });
      if (!conDatos.ok) return conDatos;
      const mismas = nuevas.length === conDatos.datos.actividades.length
        && nuevas.every((cada) => conDatos.datos.actividades.includes(cada));
      if (mismas) return conDatos;
      return cambiarActividadesDelCamino(conDatos.datos.id, conDatos.datos.actualizadoEn, nuevas);
    }, "Se guardaron los datos del Camino.");
  };

  // Sacar una actividad borra su clasificación: antes de guardar, se confirma.
  const guardarDatos = () => {
    if (!camino) return;
    if (camino.actividades.some((cada) => !actividades.includes(cada))) {
      setActividadesPendientes(actividades);
      return;
    }
    guardarDatosYActividades(actividades);
  };

  const tocarCamino = (lon: number, lat: number, propiedades: Record<string, unknown>) => {
    if (!camino) return;
    const indiceTocado = Number(propiedades.parte_indice);
    if (!Number.isInteger(indiceTocado) || !camino.partes[indiceTocado]) return;
    const lugar = ubicarEnCamino(camino, lon, lat);
    if (!lugar) return;
    if (!partiendo) { seleccionarParte(indiceTocado); return; }
    if (primerCorte === null) {
      seleccionarParte(indiceTocado);
      setPrimerCorte(lugar.distanciaM);
      setAviso("Ahora tocá el final del tramo que querés separar.");
      setAvisoDePartir(true);
      return;
    }
    const desde = Math.min(primerCorte, lugar.distanciaM);
    const hasta = Math.max(primerCorte, lugar.distanciaM);
    if (desde < camino.partes[indice].desdeM || hasta > camino.partes[indice].hastaM) {
      setAviso("Los dos toques deben estar dentro de la misma parte. Volvé a elegir el inicio.");
      setAvisoDePartir(true);
      setPrimerCorte(null);
      return;
    }
    const actual = actividad ? camino.partes[indice].porActividad[actividad] : null;
    if (!actividad || !actual) return;
    setPrimerCorte(null);
    setPartiendo(false);
    void guardar((cada) => clasificarParteDelCamino(cada.id, cada.actualizadoEn,
      { desdeM: desde, hastaM: hasta, actividad, paso: actual.paso, complejidad: actual.complejidad }),
    "Se separó el tramo y se conservó su clasificación.", true);
  };

  const agregarPunto = (lon: number, lat: number) => {
    if (!camino) return;
    const linea = borradorLinea ?? camino.coordenadas;
    const resultado = agregarPuntoEnLinea(linea, lon, lat);
    if (!resultado.ok) { setAviso(resultado.error); return; }
    setBorradorLinea(resultado.datos);
    setAviso("Se agregó un punto al borrador. Guardá la línea para conservar el cambio.");
    setAvisoDePartir(false);
  };

  const quitarPunto = (indiceDelPunto: number) => {
    if (!camino) return;
    const linea = borradorLinea ?? camino.coordenadas;
    const resultado = quitarPuntoDeLinea(linea, indiceDelPunto);
    if (!resultado.ok) { setAviso(resultado.error); return; }
    setBorradorLinea(resultado.datos);
    setAviso("Se quitó el punto del borrador. Guardá la línea para conservar el cambio.");
    setAvisoDePartir(false);
  };

  const cartelDeAviso = aviso
    ? <Tarjeta franja={aviso.startsWith("Se ") ? undefined : "ambar"}><p role="alert" className="text-base text-texto">{aviso}</p></Tarjeta>
    : null;
  const avisoAlPie = camino && !avisoDePartir ? cartelDeAviso : null;

  return (
    <div className="space-y-4">
      <EncabezadoDeMapas titulo="Marcas" subtitulo={camino?.nombre ?? "Camino"} alVolver={alVolver}
        accion={camino ? <MenuDeAcciones etiqueta={`Opciones de ${camino.nombre}`}
          acciones={[{ etiqueta: "Eliminar", destructiva: true, deshabilitada: ocupado,
            alElegir: () => setConfirmarRetiro(true) }]} /> : null} />
      {cargando ? <p role="status" className="text-base text-texto">Abriendo el Camino…</p> : null}
      {aviso && !camino ? cartelDeAviso : null}
      {camino ? (
        <MapaConPanel
          mapa={
            <CargadorDeMapa enVivo llenarElAltoEnLaComputadora encuadre={encuadre} encuadrarSoloAlAbrir caminos={dibujo}
              alTocarCamino={corrigiendo ? (modoCorreccion === "agregar" ? agregarPunto : undefined) : tocarCamino}
              verticesDeCamino={corrigiendo ? (borradorLinea ?? camino.coordenadas) : null}
              alTocarVerticeDeCamino={corrigiendo && modoCorreccion === "quitar" ? quitarPunto : undefined}
              alMoverVerticeDeCamino={corrigiendo && modoCorreccion === "mover" ? (indiceDelPunto, lon, lat) => {
                setBorradorLinea((anterior) => (anterior ?? camino.coordenadas).map((punto, i) =>
                  i === indiceDelPunto ? [lon, lat, ...punto.slice(2)] : [...punto]));
              } : undefined} />
          }
          panel={
            <div className="space-y-4">
              <Pestanas etiqueta="Editor del Camino" elegida={pestana} alElegir={(nueva) => { setPestana(nueva); setAviso(null); }}
                opciones={[{ valor: "datos", texto: "Datos" }, { valor: "linea", texto: "Línea" }, { valor: "partes", texto: "Partes" }]} />
              {pestana === "datos" ? (
                <div role="tabpanel" className="space-y-4">
                  <Tarjeta className="space-y-3">
                    <label className="block text-base text-texto">Nombre
                      <input className="mt-1 block w-full rounded-xl border border-borde bg-superficie p-2 text-texto" value={nombre} maxLength={120} onChange={(evento) => setNombre(evento.target.value)} />
                      <ContadorDeCaracteres texto={nombre} maximo={120} />
                    </label>
                    <label className="block text-base text-texto">Descripción
                      <textarea className="mt-1 block w-full rounded-xl border border-borde bg-superficie p-2 text-texto" value={descripcion} maxLength={2000} onChange={(evento) => setDescripcion(evento.target.value)} />
                      <ContadorDeCaracteres texto={descripcion} maximo={2000} />
                    </label>
                    <ElegirActividades etiqueta="Actividades" modo="varias" obligatorio
                      elegidas={actividades} deshabilitado={ocupado} alTocar={tocarActividad} />
                    <div className="flex justify-end border-t border-borde pt-3">
                      <Boton disabled={ocupado} onClick={guardarDatos}>Guardar</Boton>
                    </div>
                    {avisoAlPie}
                  </Tarjeta>
                </div>
              ) : pestana === "linea" ? (
                <div role="tabpanel" className="space-y-4">
                  <Tarjeta className="space-y-3">
                    <Opciones etiqueta="Editar la línea" columnas={3} iconoArriba
                      elegidas={[modoCorreccion]} alElegir={setModoCorreccion}
                      opciones={[
                        { valor: "mover", etiqueta: "Mover puntos", trazo: TRAZO_DE_MOVER_PUNTOS },
                        { valor: "agregar", etiqueta: "Agregar punto", trazo: TRAZO_DE_AGREGAR_PUNTO },
                        { valor: "quitar", etiqueta: "Quitar punto", trazo: TRAZO_DE_QUITAR_PUNTO },
                      ]} />
                    <p className="text-base text-texto-suave">{modoCorreccion === "mover" ? "Arrastrá un punto hasta su lugar." : modoCorreccion === "agregar" ? "Tocá la línea entre dos puntos." : "Tocá el punto que querés quitar."}</p>
                    <div className="flex justify-end gap-2 border-t border-borde pt-3">
                      <Boton variante="fantasma" disabled={ocupado || !borradorLinea} onClick={() => setBorradorLinea(null)}>Descartar</Boton>
                      <Boton disabled={ocupado || !borradorLinea || vistaPrevia?.ok !== true} onClick={() => void (async () => {
                        if (!borradorLinea) return;
                        const guardado = await guardar((actual) => corregirLineaDelCamino(actual.id, actual.actualizadoEn, borradorLinea), "Se corrigió la línea del Camino.");
                        if (guardado) setBorradorLinea(null);
                      })()}>Guardar</Boton>
                    </div>
                    {avisoAlPie}
                    {vistaPrevia && !vistaPrevia.ok ? <p role="alert" className="text-base text-ambar-texto">{vistaPrevia.error}</p> : null}
                  </Tarjeta>
                </div>
              ) : (
                <div role="tabpanel" className="space-y-4">
                  {/* Partir vale para todas las actividades: va arriba de todo. */}
                  <div className="flex flex-wrap gap-2">
                    <Boton variante="secundario" disabled={ocupado} onClick={() => { setPartiendo(true); setPrimerCorte(null); setAviso("Tocá el inicio del tramo que querés separar."); setAvisoDePartir(true); }}>Partir una parte entre dos toques</Boton>
                    {partiendo ? <Boton variante="fantasma" onClick={() => { setPartiendo(false); setPrimerCorte(null); setAviso(null); setAvisoDePartir(false); }}>Cancelar los toques</Boton> : null}
                  </div>
                  {avisoDePartir ? cartelDeAviso : null}
                  <Pestanas etiqueta="Partes del Camino" chica elegida={indice} alElegir={(i) => seleccionarParte(i)}
                    opciones={camino.partes.map((_, i) => ({ valor: i, texto: `Parte ${i + 1}` }))} />
                  {parte && actividad ? (
                    <Tarjeta className="space-y-4">
                      <h3 className="text-lg font-bold text-texto">Parte {indice + 1} · {((parte.hastaM - parte.desdeM) / 1000).toFixed(2).replace(".", ",")} km</h3>
                      <ElegirActividades etiqueta="Actividad a clasificar" opciones={camino.actividades}
                        elegidas={[actividad]} alTocar={setActividad} />
                      <div className="space-y-2">
                        <p className="text-base font-semibold text-texto">Condición para {mostrarActividad(actividad).etiqueta}</p>
                        <div className="flex flex-wrap gap-2">
                          {(["por_explorar", "transitable", "a_pie", "sin_paso"] as CondicionDePaso[]).map((paso) => <Boton key={paso}
                            variante={pasoElegido === paso ? "principal" : "secundario"}
                            aria-pressed={pasoElegido === paso} disabled={ocupado}
                            onClick={() => elegirEnLaParte(paso, complejidadElegida)}>
                            <span className="inline-flex items-center gap-2"><MuestraDeLinea paso={paso} />{nombreDelPaso(paso, [actividad])}</span></Boton>)}
                        </div>
                      </div>
                      {pasoElegido !== "sin_paso" ? <div className="space-y-2">
                        <p className="text-base font-semibold text-texto">Complejidad de esta parte</p>
                        <div className="flex flex-wrap gap-2">
                          {([null, "facil", "media", "dificil"] as Array<ComplejidadDeParte | null>).map((complejidad) => <Boton key={complejidad ?? "ninguna"}
                            variante={complejidadElegida === complejidad ? "principal" : "secundario"}
                            aria-pressed={complejidadElegida === complejidad} disabled={ocupado}
                            onClick={() => elegirEnLaParte(pasoElegido, complejidad)}>
                            <span className="inline-flex items-center gap-2"><MuestraDeComplejidad complejidad={complejidad} />{nombreDeComplejidad(complejidad)}</span></Boton>)}
                        </div>
                      </div> : null}
                      <div className="space-y-2">
                        <label className="block text-base text-texto">Observación para todas las actividades
                          <textarea className="mt-1 block w-full rounded-xl border border-borde bg-superficie p-2 text-texto" value={observacion} maxLength={1000}
                            onChange={(evento) => setObservacion(evento.target.value)} />
                          <ContadorDeCaracteres texto={observacion} maximo={1000} />
                        </label>
                        <label className="block text-base text-texto">Fecha de comprobación
                          <input className="mt-1 block w-44 max-w-full rounded-xl border border-borde bg-superficie p-2 text-texto" type="date" value={fecha}
                            onChange={(evento) => setFecha(evento.target.value)} />
                        </label>
                        <div className="flex justify-end border-t border-borde pt-3">
                        <Boton disabled={ocupado} onClick={() => void (async () => {
                          const elegidas = Object.entries(borradorVigente) as [ActividadRuta, { paso: CondicionDePaso; complejidad: ComplejidadDeParte | null }][];
                          const guardado = await guardar(async (actual) => {
                            let alDia = actual;
                            for (const [cada, { paso, complejidad }] of elegidas) {
                              const clasificada = await clasificarParteDelCamino(alDia.id, alDia.actualizadoEn,
                                { desdeM: parte.desdeM, hastaM: parte.hastaM, actividad: cada, paso, complejidad });
                              if (!clasificada.ok) return clasificada;
                              alDia = clasificada.datos;
                            }
                            return cambiarDatosDeParteDelCamino(alDia.id, alDia.actualizadoEn,
                              { desdeM: parte.desdeM, hastaM: parte.hastaM, observacion, comprobadoEl: fecha });
                          }, "Se guardó esta parte.");
                          if (guardado) setBorradorDeLaParte(null);
                        })()}>Guardar</Boton>
                        </div>
                        {avisoAlPie}
                      </div>
                    </Tarjeta>
                  ) : null}
                </div>
              )}
            </div>
          }
        />
      ) : null}
      <Emergente abierto={actividadesPendientes !== null} alCerrar={() => setActividadesPendientes(null)}
        titulo="¿Sacar esta actividad?" descripcion="Se perderán su condición y su complejidad en todas las partes. La observación y la fecha quedan."
        acciones={<><BotonDeEmergente onClick={() => setActividadesPendientes(null)}>Cancelar</BotonDeEmergente>
          <BotonDeEmergente variante="destructivo" disabled={ocupado} onClick={() => {
            const nuevas = actividadesPendientes;
            setActividadesPendientes(null);
            if (nuevas) guardarDatosYActividades(nuevas);
          }}>Sacar actividad</BotonDeEmergente></>} />
      <Emergente abierto={confirmarRetiro} alCerrar={() => setConfirmarRetiro(false)} titulo="¿Retirar este Camino?"
        descripcion="Dejará de verse en el mapa. Esta acción no se puede deshacer."
        acciones={<><BotonDeEmergente onClick={() => setConfirmarRetiro(false)}>Cancelar</BotonDeEmergente>
          <BotonDeEmergente variante="destructivo" disabled={ocupado} onClick={() => {
            if (!camino) return;
            setConfirmarRetiro(false);
            setOcupado(true);
            void retirarCamino(camino.id, camino.actualizadoEn).then(async (resultado) => {
              if (!resultado.ok) { setAviso(resultado.error); return; }
              await ponerAlDiaDespuesDeGuardar();
              alVolver();
            }).catch((causa) => setAviso(`No se pudo retirar el Camino: ${causa instanceof Error ? causa.message : String(causa)}`))
              .finally(() => setOcupado(false));
          }}>Retirar Camino</BotonDeEmergente></>} />
    </div>
  );
}
