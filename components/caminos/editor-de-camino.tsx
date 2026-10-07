"use client";

import { useEffect, useMemo, useState } from "react";
import {
  cambiarActividadesDelCamino, cambiarDatosDeParteDelCamino, cambiarNombreDelCamino,
  clasificarParteDelCamino, corregirLineaDelCamino, leerCamino, retirarCamino,
} from "@/app/actions/caminos";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { Boton } from "@/components/ui/boton";
import { BotonDeEmergente, Emergente } from "@/components/ui/emergente";
import { Tarjeta } from "@/components/ui/tarjeta";
import { dibujarCaminos } from "@/lib/caminos/dibujo";
import { corregirLinea, ubicarEnCamino, type ComplejidadDeParte, type CondicionDePaso } from "@/lib/caminos/partes";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import { rectanguloQueAbarca } from "@/lib/datos/rectangulo";
import { agregarPuntoEnLinea, quitarPuntoDeLinea } from "@/lib/caminos/edicion-de-puntos";
import { mostrarActividad } from "@/lib/rutas/actividades";
import { nombreDeComplejidad, nombreDelPaso, ReferenciaDePartes } from "@/components/rutas/referencia-de-partes";
import { ponerAlDiaDespuesDeGuardar } from "@/lib/offline/puesta-al-dia";
import type { ActividadRuta } from "@/types/database";

type Pestana = "datos" | "partes";

export function EditorDeCamino({ id, alVolver }: { id: number; alVolver: () => void }) {
  const [camino, setCamino] = useState<CaminoGuardado | null>(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pestana, setPestana] = useState<Pestana>("datos");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [actividad, setActividad] = useState<ActividadRuta | null>(null);
  const [indice, setIndice] = useState(0);
  const [observacion, setObservacion] = useState("");
  const [fecha, setFecha] = useState("");
  const [actividadesPendientes, setActividadesPendientes] = useState<ActividadRuta[] | null>(null);
  const [confirmarRetiro, setConfirmarRetiro] = useState(false);
  const [primerCorte, setPrimerCorte] = useState<number | null>(null);
  const [partiendo, setPartiendo] = useState(false);
  const [corrigiendo, setCorrigiendo] = useState(false);
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
        setActividad(resultado.datos.actividades[0] ?? null);
        setObservacion(resultado.datos.partes[0]?.observacion ?? "");
        setFecha(resultado.datos.partes[0]?.comprobadoEl ?? "");
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
  const encuadre = useMemo(() => camino ? rectanguloQueAbarca(camino.coordenadas.map((punto) => [punto[0], punto[1]])) : null, [camino]);
  const vistaPrevia = useMemo(() => camino && borradorLinea ? corregirLinea(camino, borradorLinea) : null, [camino, borradorLinea]);
  const caminoVisible = vistaPrevia?.ok ? vistaPrevia.datos : camino;
  const dibujo = useMemo(() => caminoVisible && actividad ? dibujarCaminos([caminoVisible], actividad) : null, [caminoVisible, actividad]);

  const seleccionarParte = (nueva: number, de: CaminoGuardado | null = camino) => {
    if (!de?.partes[nueva]) return;
    setIndice(nueva);
    setObservacion(de.partes[nueva].observacion ?? "");
    setFecha(de.partes[nueva].comprobadoEl ?? "");
  };

  const guardar = async (hacer: (actual: CaminoGuardado) => Promise<{ ok: true; datos: CaminoGuardado } | { ok: false; error: string }>, texto: string): Promise<boolean> => {
    if (!camino || ocupado) return false;
    setOcupado(true);
    setAviso(null);
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

  const elegirActividades = (nuevas: ActividadRuta[]) => {
    if (!camino || nuevas.length === 0) {
      setAviso("El Camino tiene que tener al menos una actividad.");
      return;
    }
    if (camino.actividades.some((cada) => !nuevas.includes(cada))) {
      setActividadesPendientes(nuevas);
      return;
    }
    void guardar((actual) => cambiarActividadesDelCamino(actual.id, actual.actualizadoEn, nuevas), "Se actualizaron las actividades.");
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
      return;
    }
    const desde = Math.min(primerCorte, lugar.distanciaM);
    const hasta = Math.max(primerCorte, lugar.distanciaM);
    if (desde < camino.partes[indice].desdeM || hasta > camino.partes[indice].hastaM) {
      setAviso("Los dos toques deben estar dentro de la misma parte. Volvé a elegir el inicio.");
      setPrimerCorte(null);
      return;
    }
    const actual = actividad ? camino.partes[indice].porActividad[actividad] : null;
    if (!actividad || !actual) return;
    setPrimerCorte(null);
    setPartiendo(false);
    void guardar((cada) => clasificarParteDelCamino(cada.id, cada.actualizadoEn,
      { desdeM: desde, hastaM: hasta, actividad, paso: actual.paso, complejidad: actual.complejidad }),
    "Se separó el tramo y se conservó su clasificación.");
  };

  const agregarPunto = (lon: number, lat: number) => {
    if (!camino) return;
    const linea = borradorLinea ?? camino.coordenadas;
    const resultado = agregarPuntoEnLinea(linea, lon, lat);
    if (!resultado.ok) { setAviso(resultado.error); return; }
    setBorradorLinea(resultado.datos);
    setAviso("Se agregó un punto al borrador. Guardá la línea para conservar el cambio.");
  };

  const quitarPunto = (indiceDelPunto: number) => {
    if (!camino) return;
    const linea = borradorLinea ?? camino.coordenadas;
    const resultado = quitarPuntoDeLinea(linea, indiceDelPunto);
    if (!resultado.ok) { setAviso(resultado.error); return; }
    setBorradorLinea(resultado.datos);
    setAviso("Se quitó el punto del borrador. Guardá la línea para conservar el cambio.");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Boton variante="secundario" onClick={alVolver}>Volver</Boton>
        <h2 className="text-xl font-bold text-texto">{camino?.nombre ?? "Camino"}</h2>
      </div>
      {cargando ? <p role="status" className="text-base text-texto">Abriendo el Camino…</p> : null}
      {aviso ? <Tarjeta franja={aviso.startsWith("Se ") ? undefined : "ambar"}><p role="alert" className="text-base text-texto">{aviso}</p></Tarjeta> : null}
      {camino ? (
        <>
          <div role="tablist" aria-label="Editor del Camino" className="flex gap-2">
            <Boton role="tab" aria-selected={pestana === "datos"} variante={pestana === "datos" ? "principal" : "secundario"} onClick={() => setPestana("datos")}>Datos y línea</Boton>
            <Boton role="tab" aria-selected={pestana === "partes"} variante={pestana === "partes" ? "principal" : "secundario"} onClick={() => setPestana("partes")}>Partes</Boton>
          </div>
          <CargadorDeMapa enVivo principal encuadre={encuadre} encuadrarSoloAlAbrir caminos={dibujo}
            alTocarCamino={corrigiendo ? (modoCorreccion === "agregar" ? agregarPunto : undefined) : tocarCamino}
            verticesDeCamino={corrigiendo ? (borradorLinea ?? camino.coordenadas) : null}
            alTocarVerticeDeCamino={corrigiendo && modoCorreccion === "quitar" ? quitarPunto : undefined}
            alMoverVerticeDeCamino={corrigiendo && modoCorreccion === "mover" ? (indiceDelPunto, lon, lat) => {
              setBorradorLinea((anterior) => (anterior ?? camino.coordenadas).map((punto, i) =>
                i === indiceDelPunto ? [lon, lat, ...punto.slice(2)] : [...punto]));
            } : undefined} />
          {pestana === "datos" ? (
            <div role="tabpanel" className="space-y-4">
              <Tarjeta className="space-y-3">
                <label className="block text-base text-texto">Nombre
                  <input className="mt-1 block w-full rounded-xl border border-borde bg-superficie p-2 text-texto" value={nombre} maxLength={120} onChange={(evento) => setNombre(evento.target.value)} />
                </label>
                <p className="text-base text-texto-suave">{Array.from(nombre).length}/120 caracteres</p>
                <label className="block text-base text-texto">Descripción
                  <textarea className="mt-1 block w-full rounded-xl border border-borde bg-superficie p-2 text-texto" value={descripcion} maxLength={2000} onChange={(evento) => setDescripcion(evento.target.value)} />
                </label>
                <p className="text-base text-texto-suave">{Array.from(descripcion).length}/2.000 caracteres</p>
                <Boton disabled={ocupado} onClick={() => void guardar((actual) => cambiarNombreDelCamino(actual.id, actual.actualizadoEn, { nombre, descripcion }), "Se guardaron los datos del Camino.")}>Guardar datos</Boton>
              </Tarjeta>
              <Tarjeta className="space-y-3">
                <h3 className="text-lg font-semibold text-texto">Actividades</h3>
                <div className="flex flex-wrap gap-2">
                  {(["trekking", "correr", "mountain_bike", "kayak", "canyoning"] as ActividadRuta[]).map((opcion) => (
                    <Boton key={opcion} variante={camino.actividades.includes(opcion) ? "principal" : "secundario"}
                      aria-pressed={camino.actividades.includes(opcion)} disabled={ocupado}
                      onClick={() => elegirActividades(camino.actividades.includes(opcion)
                        ? camino.actividades.filter((cada) => cada !== opcion) : [...camino.actividades, opcion])}>
                      {mostrarActividad(opcion).etiqueta}
                    </Boton>
                  ))}
                </div>
              </Tarjeta>
              <Tarjeta className="space-y-3">
                <h3 className="text-lg font-semibold text-texto">Corregir la línea</h3>
                <p className="text-base text-texto-suave">Mové, agregá o quitá puntos sobre el mapa. La condición, la complejidad, la observación y la fecha de cada parte se conservan.</p>
                {corrigiendo ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {(["mover", "agregar", "quitar"] as const).map((modo) => <Boton key={modo}
                        variante={modoCorreccion === modo ? "principal" : "secundario"} aria-pressed={modoCorreccion === modo}
                        onClick={() => setModoCorreccion(modo)}>{modo === "mover" ? "Mover puntos" : modo === "agregar" ? "Agregar punto" : "Quitar punto"}</Boton>)}
                    </div>
                    <p className="text-base text-texto-suave">{modoCorreccion === "mover" ? "Arrastrá un punto hasta su lugar correcto." : modoCorreccion === "agregar" ? "Tocá la línea entre dos puntos." : "Tocá el punto que querés quitar."}</p>
                    <div className="flex flex-wrap gap-2">
                    <Boton disabled={ocupado || !borradorLinea || vistaPrevia?.ok !== true} onClick={() => void (async () => {
                      if (!borradorLinea) return;
                      const guardado = await guardar((actual) => corregirLineaDelCamino(actual.id, actual.actualizadoEn, borradorLinea), "Se corrigió la línea del Camino.");
                      if (guardado) { setCorrigiendo(false); setBorradorLinea(null); }
                    })()}>Guardar línea corregida</Boton>
                    <Boton variante="secundario" disabled={ocupado} onClick={() => { setCorrigiendo(false); setBorradorLinea(null); }}>Descartar cambios</Boton>
                    </div>
                  </div>
                ) : <Boton variante="secundario" onClick={() => { setCorrigiendo(true); setModoCorreccion("mover"); setBorradorLinea(null); }}>Corregir puntos de la línea</Boton>}
                {vistaPrevia && !vistaPrevia.ok ? <p role="alert" className="text-base text-ambar-texto">{vistaPrevia.error}</p> : null}
              </Tarjeta>
              <Boton variante="destructivo" disabled={ocupado} onClick={() => setConfirmarRetiro(true)}>Retirar este Camino</Boton>
            </div>
          ) : (
            <div role="tabpanel" className="space-y-4">
              <ReferenciaDePartes />
              <div className="flex flex-wrap gap-2" aria-label="Actividad a clasificar">
                {camino.actividades.map((opcion) => <Boton key={opcion} variante={actividad === opcion ? "principal" : "secundario"}
                  aria-pressed={actividad === opcion} onClick={() => setActividad(opcion)}>{mostrarActividad(opcion).etiqueta}</Boton>)}
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Partes del Camino">
                {camino.partes.map((cada, i) => <Boton key={`${cada.desdeM}-${cada.hastaM}`} variante={indice === i ? "principal" : "secundario"}
                  aria-pressed={indice === i} onClick={() => seleccionarParte(i)}>Parte {i + 1}</Boton>)}
              </div>
              {parte && actividad ? (
                <Tarjeta className="space-y-4">
                  <h3 className="text-lg font-bold text-texto">Parte {indice + 1} · {((parte.hastaM - parte.desdeM) / 1000).toFixed(2).replace(".", ",")} km</h3>
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-texto">Condición para {mostrarActividad(actividad).etiqueta}</p>
                    <div className="flex flex-wrap gap-2">
                      {(["por_explorar", "transitable", "a_pie", "sin_paso"] as CondicionDePaso[]).map((paso) => <Boton key={paso}
                        variante={parte.porActividad[actividad]?.paso === paso ? "principal" : "secundario"}
                        aria-pressed={parte.porActividad[actividad]?.paso === paso} disabled={ocupado}
                        onClick={() => void guardar((actual) => clasificarParteDelCamino(actual.id, actual.actualizadoEn,
                          { desdeM: parte.desdeM, hastaM: parte.hastaM, actividad, paso }), "Se guardó la condición de esta parte.")}>
                        {nombreDelPaso(paso, [actividad])}</Boton>)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-texto">Complejidad de esta parte</p>
                    <div className="flex flex-wrap gap-2">
                      {([null, "facil", "media", "dificil"] as Array<ComplejidadDeParte | null>).map((complejidad) => <Boton key={complejidad ?? "ninguna"}
                        variante={parte.porActividad[actividad]?.complejidad === complejidad ? "principal" : "secundario"}
                        aria-pressed={parte.porActividad[actividad]?.complejidad === complejidad} disabled={ocupado}
                        onClick={() => void guardar((actual) => clasificarParteDelCamino(actual.id, actual.actualizadoEn,
                          { desdeM: parte.desdeM, hastaM: parte.hastaM, actividad, complejidad }), "Se guardó la complejidad de esta parte.")}>
                        {nombreDeComplejidad(complejidad)}</Boton>)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-base text-texto">Observación para todas las actividades
                      <textarea className="mt-1 block w-full rounded-xl border border-borde bg-superficie p-2 text-texto" value={observacion} maxLength={1000}
                        onChange={(evento) => setObservacion(evento.target.value)} />
                    </label>
                    <p className="text-base text-texto-suave">{Array.from(observacion).length}/1.000 caracteres</p>
                    <label className="block text-base text-texto">Fecha de comprobación
                      <input className="mt-1 block rounded-xl border border-borde bg-superficie p-2 text-texto" type="date" value={fecha}
                        onChange={(evento) => setFecha(evento.target.value)} />
                    </label>
                    <Boton disabled={ocupado} onClick={() => void guardar((actual) => cambiarDatosDeParteDelCamino(actual.id, actual.actualizadoEn,
                      { desdeM: parte.desdeM, hastaM: parte.hastaM, observacion, comprobadoEl: fecha }), "Se guardaron la observación y la fecha.")}>Guardar datos de esta parte</Boton>
                  </div>
                  <Boton variante="secundario" disabled={ocupado} onClick={() => { setPartiendo(true); setPrimerCorte(null); setAviso("Tocá el inicio del tramo que querés separar."); }}>Partir una parte entre dos toques</Boton>
                  {partiendo ? <Boton variante="fantasma" onClick={() => { setPartiendo(false); setPrimerCorte(null); setAviso(null); }}>Cancelar los toques</Boton> : null}
                </Tarjeta>
              ) : null}
            </div>
          )}
        </>
      ) : null}
      <Emergente abierto={actividadesPendientes !== null} alCerrar={() => setActividadesPendientes(null)}
        titulo="¿Sacar esta actividad?" descripcion="Se perderán su condición y su complejidad en todas las partes. La observación y la fecha quedan."
        acciones={<><BotonDeEmergente onClick={() => setActividadesPendientes(null)}>Cancelar</BotonDeEmergente>
          <BotonDeEmergente variante="destructivo" disabled={ocupado} onClick={() => {
            const nuevas = actividadesPendientes;
            setActividadesPendientes(null);
            if (nuevas) void guardar((actual) => cambiarActividadesDelCamino(actual.id, actual.actualizadoEn, nuevas), "Se actualizaron las actividades.");
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
