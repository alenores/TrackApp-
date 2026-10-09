"use client";

import { useEffect, useMemo, useState } from "react";
import { leerCaminos } from "@/app/actions/caminos";
import { cambiarCircuito, cambiarDatosDelCircuito, crearCircuitoNuevo } from "@/app/actions/circuitos";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { ResumenDeCircuito } from "@/components/circuitos/resumen-de-circuito";
import { CamposDeDatosDelCircuito } from "@/components/circuitos/campos-de-datos-del-circuito";
import { dibujarCircuito, toqueLibre, toqueSobreCamino,
  type ToqueDelCircuito } from "@/lib/circuitos/dibujo";
import { caminosParaArmarCircuito, partesDelCircuitoEnElMapa } from "@/lib/circuitos/en-el-mapa";
import { resumirCircuito } from "@/lib/circuitos/resumen";
import { puntosVigentesParaEditar } from "@/lib/circuitos/edicion";
import { SIN_DATOS, type CircuitoGuardado, type DatosDelCircuito } from "@/lib/circuitos/datos";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import type { ParteDibujada } from "@/lib/circuitos/dibujo";
import { rectanguloQueAbarca } from "@/lib/datos/rectangulo";
import { mostrarActividad } from "@/lib/rutas/actividades";
import { ponerAlDiaDespuesDeGuardar } from "@/lib/offline/puesta-al-dia";
import { ACTIVIDADES_RUTA, type ActividadRuta } from "@/types/database";

export function EditorDeCircuito({ original = null, edicion = null, alVolver, alGuardar }: {
  original?: CircuitoGuardado | null;
  edicion?: { partes: ParteDibujada[]; finalSeparado: boolean; caminos: CaminoGuardado[] } | null;
  alVolver: () => void;
  alGuardar: (id: number) => void;
}) {
  const [caminos, setCaminos] = useState<CaminoGuardado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [nombre, setNombre] = useState(original?.nombre ?? "");
  const [actividad, setActividad] = useState<ActividadRuta>(original?.actividad ?? "mountain_bike");
  const [visibles, setVisibles] = useState<ActividadRuta[]>([original?.actividad ?? "mountain_bike"]);
  const [datos, setDatos] = useState<DatosDelCircuito>(original?.datos ?? SIN_DATOS);
  const puntosIniciales = original && edicion
    ? puntosVigentesParaEditar(original, edicion.partes, edicion.caminos) : null;
  const requiereRedibujar = !!original && !!edicion && (edicion.finalSeparado
    || !puntosIniciales?.ok || edicion.caminos.some((camino) => camino.eliminadoEn));
  const [redibujando, setRedibujando] = useState(false);
  const [puntos, setPuntos] = useState<ToqueDelCircuito[]>(puntosIniciales?.ok
    ? puntosIniciales.datos : original?.puntos ?? []);
  const soloDatos = requiereRedibujar && !redibujando;

  useEffect(() => {
    let vigente = true;
    void leerCaminos().then((resultado) => {
      if (!vigente) return;
      if (resultado.ok) {
        setCaminos(resultado.datos.caminos);
        if (resultado.datos.conProblemas.length) {
          setAviso("Algunos Caminos tienen datos incompletos. Pedile al administrador que los revise antes de guardar un Circuito que los use.");
        }
      } else setAviso(resultado.error);
      setCargando(false);
    }).catch((error) => {
      if (!vigente) return;
      setAviso(`No se pudieron cargar los Caminos: ${error instanceof Error ? error.message : String(error)}. Volvé a entrar con señal.`);
      setCargando(false);
    });
    return () => { vigente = false; };
  }, []);

  const bases = useMemo(() => caminos.map((camino) => ({
    id: camino.id, coordenadas: camino.coordenadas, versionForma: camino.versionForma,
  })), [caminos]);
  const caminosVisibles = useMemo(() => caminosParaArmarCircuito(caminos, actividad, visibles),
    [caminos, actividad, visibles]);
  const dibujo = useMemo(() => dibujarCircuito(puntos, bases), [puntos, bases]);
  const partesVisibles = useMemo(() => soloDatos ? edicion?.partes ?? [] : dibujo.ok ? dibujo.datos : [],
    [soloDatos, edicion, dibujo]);
  const caminosDelDibujo = useMemo(() => soloDatos ? edicion?.caminos ?? [] : caminos,
    [soloDatos, edicion, caminos]);
  const circuitoVisible = useMemo(() => partesDelCircuitoEnElMapa(partesVisibles,
    caminosDelDibujo, actividad), [partesVisibles, caminosDelDibujo, actividad]);
  const resumen = useMemo(() => partesVisibles.length
    ? resumirCircuito(partesVisibles, caminosDelDibujo, actividad,
      soloDatos && edicion?.finalSeparado ? original?.puntos.at(-1)?.coordenada ?? null : null) : null,
  [partesVisibles, caminosDelDibujo, actividad, soloDatos, edicion, original]);
  const encuadre = useMemo(() => {
    const lugares: [number, number][] = edicion
      ? edicion.partes.flatMap((parte) => parte.coordenadas.map((punto): [number, number] => [punto[0], punto[1]]))
      : caminos.flatMap((camino) => camino.coordenadas.map((punto): [number, number] => [punto[0], punto[1]]));
    if (edicion?.finalSeparado && original?.puntos.length) {
      const final = original.puntos.at(-1)!.coordenada;
      lugares.push([final[0], final[1]]);
    }
    return lugares.length ? rectanguloQueAbarca(lugares) : null;
  }, [caminos, edicion, original]);

  const marcar = (lon: number, lat: number, caminoId: number | null, actividadMostrada: string | null) => {
    if (ocupado || cargando || soloDatos) return;
    const camino = caminos.find((cada) => cada.id === caminoId);
    const sobre = camino && actividadMostrada && (ACTIVIDADES_RUTA as string[]).includes(actividadMostrada)
      ? toqueSobreCamino([lon, lat], camino, actividadMostrada as ActividadRuta)
      : toqueLibre([lon, lat]);
    if (!sobre.ok) { setAviso(sobre.error); return; }
    setPuntos((anteriores) => [...anteriores, sobre.datos]);
    setAviso(null);
  };

  const guardar = async () => {
    if (ocupado || cargando) return;
    if (!soloDatos) {
      if (!dibujo.ok) { setAviso(dibujo.error); return; }
      if (puntos.length < 2) { setAviso("Marcá al menos dos puntos antes de guardar el Circuito."); return; }
    }
    setOcupado(true);
    setAviso(null);
    try {
      const pedido = { nombre, actividad, puntos, datos };
      const guardado = original
        ? soloDatos
          ? await cambiarDatosDelCircuito(original.id, original.actualizadoEn, nombre, actividad, datos)
          : await cambiarCircuito(original.id, original.actualizadoEn, pedido)
        : await crearCircuitoNuevo(pedido);
      if (guardado.ok) {
        await ponerAlDiaDespuesDeGuardar();
        alGuardar(guardado.datos.id);
      } else setAviso(guardado.error);
    } catch (error) {
      setAviso(`No se pudo guardar el Circuito: ${error instanceof Error ? error.message : String(error)}. Revisá la lista antes de volver a tocar Guardar.`);
    } finally { setOcupado(false); }
  };

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Boton variante="secundario" onClick={alVolver}>Volver</Boton>
        <h1 className="text-2xl font-bold text-texto">{original ? "Editar Circuito" : "Nuevo Circuito"}</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        {original ? <Boton variante="secundario" disabled={ocupado}
          onClick={() => { setRedibujando(true); setPuntos([]); setAviso(null); }}>Dibujar de nuevo</Boton> : null}
        <Boton variante="secundario" disabled={ocupado || soloDatos || puntos.length === 0}
          onClick={() => setPuntos((anteriores) => anteriores.slice(0, -1))}>Deshacer último punto</Boton>
        <Boton disabled={ocupado || cargando} onClick={() => void guardar()}>Guardar Circuito</Boton>
      </div>
    </div>
    <p className="text-base text-texto-suave">Tocá el mapa para marcar los puntos del Circuito. Si dos puntos quedan sobre un mismo Camino, la línea sigue ese Camino.</p>
    {aviso ? <Tarjeta franja="ambar"><p role="alert" className="text-base text-texto">{aviso}</p></Tarjeta> : null}
    {soloDatos ? <Tarjeta franja="ambar"><p className="text-base text-texto">El dibujo actualizado tiene un final separado o usa un Camino retirado. Podés cambiar el nombre, la actividad y los datos sin alterar la línea. Para cambiar el dibujo, tocá «Dibujar de nuevo».</p></Tarjeta> : null}
    <Tarjeta className="space-y-3">
      <label className="block text-base font-semibold text-texto">Nombre
        <input value={nombre} maxLength={120} onChange={(evento) => setNombre(evento.target.value)}
          className="mt-1 block w-full rounded-xl border border-borde bg-superficie p-2 text-base text-texto" />
      </label>
      <div><p className="mb-2 text-base font-semibold text-texto">Actividad del Circuito</p>
        <div className="flex flex-wrap gap-2">{ACTIVIDADES_RUTA.map((opcion) =>
          <Boton key={opcion} variante={actividad === opcion ? "principal" : "secundario"}
            aria-pressed={actividad === opcion} onClick={() => { setActividad(opcion); setVisibles((actuales) =>
              actuales.includes(opcion) ? actuales : [...actuales, opcion]); }}>{mostrarActividad(opcion).etiqueta}</Boton>)}</div>
      </div>
      <div><p className="mb-2 text-base font-semibold text-texto">Mostrar Caminos de estas actividades</p>
        <div className="flex flex-wrap gap-2">{ACTIVIDADES_RUTA.map((opcion) =>
          <Boton key={opcion} variante={visibles.includes(opcion) ? "principal" : "secundario"}
            aria-pressed={visibles.includes(opcion)} onClick={() => setVisibles((actuales) =>
              actuales.includes(opcion) ? (actuales.length > 1 ? actuales.filter((cada) => cada !== opcion) : actuales)
                : [...actuales, opcion])}>{mostrarActividad(opcion).etiqueta}</Boton>)}</div>
      </div>
    </Tarjeta>
    <CamposDeDatosDelCircuito datos={datos} deshabilitado={ocupado}
      alCambiar={(cambio) => setDatos((anteriores) => ({ ...anteriores, ...cambio }))} />
    {cargando ? <Tarjeta><p role="status" className="text-base text-texto">Cargando el mapa…</p></Tarjeta> :
      <CargadorDeMapa enVivo principal encuadre={encuadre} encuadrarSoloAlAbrir
        caminos={caminosVisibles} circuito={circuitoVisible.ok ? circuitoVisible.datos : null}
        finalConservadoDelCircuito={soloDatos && edicion?.finalSeparado ? original?.puntos.at(-1)?.coordenada ?? null : null}
        verticesDeCamino={soloDatos ? [] : puntos.map((punto) => [punto.coordenada[0], punto.coordenada[1]])}
        mostrarActividadesDeCaminoAlPasar alMarcarPuntoDelCircuito={marcar} />}
    {!soloDatos ? <p className="text-base text-texto">{puntos.length} {puntos.length === 1 ? "punto marcado" : "puntos marcados"}.</p> : null}
    {!soloDatos && dibujo.ok === false && puntos.length > 1 ? <Tarjeta franja="ambar"><p role="alert" className="text-base text-texto">{dibujo.error}</p></Tarjeta> : null}
    {resumen ? <ResumenDeCircuito resultado={resumen} /> : null}
  </div>;
}
