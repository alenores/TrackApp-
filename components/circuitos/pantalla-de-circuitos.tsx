"use client";

import { useCallback, useEffect, useState } from "react";
import { leerCircuitoCompleto, leerCircuitos, retirarCircuito } from "@/app/actions/circuitos";
import { DetalleDeCircuito } from "@/components/circuitos/detalle-de-circuito";
import { EditorDeCircuito } from "@/components/circuitos/editor-de-circuito";
import { Boton } from "@/components/ui/boton";
import { BotonAgregar } from "@/components/ui/boton-agregar";
import { Tarjeta } from "@/components/ui/tarjeta";
import { TarjetaQueAbre } from "@/components/ui/tarjeta-que-abre";
import { MenuDeAcciones } from "@/components/ui/menu-de-acciones";
import { useDialogos } from "@/components/ui/dialogos";
import { actualizarCircuito } from "@/lib/circuitos/actualizar";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { useLoQueFalta } from "@/hooks/use-lo-que-falta";
import { AvisoDeMapasQueFaltan } from "@/components/rutas/aviso-de-mapas-que-faltan";
import type { CircuitoGuardado } from "@/lib/circuitos/datos";
import type { ParteDibujada } from "@/lib/circuitos/dibujo";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import { mostrarActividad } from "@/lib/rutas/actividades";
import { textoDeAltura, textoDeDistancia } from "@/lib/alturas/grafico";
import { IndicadorTecnica, VelocimetroEsfuerzo } from "@/components/rutas/indicadores-de-exigencia";
import type { CategoriaUsuario } from "@/types/database";

type Vista = { tipo: "lista" } | { tipo: "nuevo" } | { tipo: "detalle"; id: number }
  | { tipo: "editar"; circuito: CircuitoGuardado; partes: ParteDibujada[];
    finalSeparado: boolean; caminos: CaminoGuardado[] };

export function PantallaDeCircuitos({ categoria, miPerfilId }: {
  categoria: CategoriaUsuario; miPerfilId: string | null;
}) {
  const [vista, setVista] = useState<Vista>({ tipo: "lista" });
  const [circuitos, setCircuitos] = useState<CircuitoGuardado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  const { confirmar } = useDialogos();
  const { paquete, estado, aviso: avisoDelPaquete } = useDatosDeLaApp();
  const haySenal = useHaySenal();
  // Lo que le falta a este celular se dice acá, en casa y con señal.
  const loQueFalta = useLoQueFalta(paquete);
  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const resultado = await leerCircuitos();
      if (resultado.ok) { setCircuitos(resultado.datos); setAviso(null); }
      else setAviso(resultado.error);
    } catch (error) {
      setAviso(`No se pudieron cargar los Circuitos: ${error instanceof Error ? error.message : String(error)}. Probá de nuevo con señal.`);
    } finally { setCargando(false); }
  }, []);
  useEffect(() => {
    if (!haySenal) return;
    let vigente = true;
    void leerCircuitos().then((resultado) => {
      if (!vigente) return;
      if (resultado.ok) { setCircuitos(resultado.datos); setAviso(null); }
      else setAviso(resultado.error);
      setCargando(false);
    }).catch((error) => {
      if (!vigente) return;
      setAviso(`No se pudieron cargar los Circuitos: ${error instanceof Error ? error.message : String(error)}. Probá de nuevo con señal.`);
      setCargando(false);
    });
    return () => { vigente = false; };
  }, [haySenal]);

  const fichas = haySenal && !cargando && !aviso ? circuitos : paquete?.circuitos ?? [];
  // El largo y el desnivel se arman con los Caminos al preparar el celular.
  const guardadas = new Map((paquete?.circuitos ?? []).map((cada) => [cada.id, cada]));
  const enVivoPorId = new Map(circuitos.map((cada) => [cada.id, cada]));

  const editar = async (circuito: CircuitoGuardado) => {
    try {
      const resultado = await leerCircuitoCompleto(circuito.id);
      if (!resultado.ok) { setAviso(resultado.error); return; }
      const actualizado = actualizarCircuito(resultado.datos.circuito,
        resultado.datos.caminos, resultado.datos.correcciones);
      if (!actualizado.ok) { setAviso(actualizado.error); return; }
      setVista({ tipo: "editar", circuito: resultado.datos.circuito, partes: actualizado.datos.partes,
        finalSeparado: !!actualizado.datos.finalSeparado, caminos: resultado.datos.caminos });
    } catch (error) {
      setAviso(`No se pudo abrir la edición: ${error instanceof Error ? error.message : String(error)}. Probá de nuevo con señal.`);
    }
  };
  const eliminar = async (circuito: CircuitoGuardado) => {
    const seguro = await confirmar({ titulo: `¿Retirar «${circuito.nombre}»?`,
      mensaje: "Dejará de aparecer en la lista. Los Caminos del mapa quedan como están.",
      textoDeAceptar: "Retirar Circuito", destructivo: true });
    if (!seguro) return;
    try {
      const resultado = await retirarCircuito(circuito.id, circuito.actualizadoEn);
      if (!resultado.ok) { setAviso(resultado.error); return; }
      await cargar();
    } catch (error) {
      setAviso(`No se pudo retirar el Circuito: ${error instanceof Error ? error.message : String(error)}. Probá de nuevo con señal.`);
    }
  };

  if (vista.tipo === "nuevo" || vista.tipo === "editar") {
    return <EditorDeCircuito original={vista.tipo === "editar" ? vista.circuito : null}
      edicion={vista.tipo === "editar" ? { partes: vista.partes,
        finalSeparado: vista.finalSeparado, caminos: vista.caminos } : null}
      alVolver={() => setVista({ tipo: "lista" })}
      alGuardar={(id) => { void cargar(); setVista({ tipo: "detalle", id }); }} />;
  }
  if (vista.tipo === "detalle") {
    return <DetalleDeCircuito id={vista.id} miPerfilId={miPerfilId}
      esAdministrador={categoria === "administrador"}
      alVolver={() => setVista({ tipo: "lista" })}
      alEditar={(circuito, partes, finalSeparado, caminos) =>
        setVista({ tipo: "editar", circuito, partes, finalSeparado, caminos })}
      alRetirar={() => { void cargar(); setVista({ tipo: "lista" }); }} />;
  }

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h1 className="text-2xl font-bold text-texto">Circuitos</h1>
      {categoria !== "normal" && haySenal ? <BotonAgregar etiqueta="Agregar Circuito" alTocar={() => setVista({ tipo: "nuevo" })} /> : null}
    </div>
    <AvisoDeMapasQueFaltan perdidos={loQueFalta.perdidos} circuitos={loQueFalta.circuitos} aviso={loQueFalta.aviso} />
    {estado === "abriendo" ? <Tarjeta><p role="status" className="text-base text-texto">Cargando Circuitos…</p></Tarjeta> : null}
    {estado === "sin_datos" ? <Tarjeta franja="ambar"><p role="alert" className="text-base text-texto">Este celular todavía no tiene los Circuitos guardados. Abrí la app con señal en casa para descargarlos.</p></Tarjeta> : null}
    {aviso && haySenal ? <Tarjeta franja="ambar" className="space-y-2"><p role="alert" className="text-base text-texto">{aviso}</p>
      <Boton variante="secundario" onClick={() => void cargar()}>Volver a intentar</Boton></Tarjeta> : null}
    {estado === "incompleto" && avisoDelPaquete ? <Tarjeta franja="ambar"><p role="alert" className="text-base text-texto">Los Circuitos guardados pueden estar desactualizados: {avisoDelPaquete}</p></Tarjeta> : null}
    {!cargando && !aviso && fichas.length === 0 ? <Tarjeta>
      <p className="text-base text-texto">Todavía no hay Circuitos guardados.</p>
    </Tarjeta> : null}
    {fichas.length > 0 ? <div className="grid gap-3 sm:grid-cols-2">
      {fichas.map((circuito) => {
        const guardada = guardadas.get(circuito.id);
        const circuitoEnVivo = haySenal ? enVivoPorId.get(circuito.id) : null;
        const puedeCambiar = circuitoEnVivo && (categoria === "administrador" || circuitoEnVivo.perfilId === miPerfilId);
        const totales = guardada?.totales;
        const datos = guardada?.datos;
        return <div key={circuito.id} className="relative"><TarjetaQueAbre etiqueta={`Abrir ${circuito.nombre}`}
          alAbrir={() => setVista({ tipo: "detalle", id: circuito.id })} className="space-y-2">
        <h2 className={`text-lg font-semibold text-texto ${puedeCambiar ? "pr-12" : ""}`}>{circuito.nombre}</h2>
        <p className="text-base text-texto-suave">{mostrarActividad(circuito.actividad).etiqueta}</p>
        {totales ? <p className="text-base text-texto">
          {textoDeDistancia(totales.largoM)}
          {totales.desnivelPositivoM !== null && totales.desnivelNegativoM !== null
            ? ` · desnivel positivo ${textoDeAltura(totales.desnivelPositivoM)} · negativo ${textoDeAltura(totales.desnivelNegativoM)}`
            : " · desnivel sin calcular"}
        </p> : null}
        {datos && (datos.tecnica !== null || datos.nivelEsfuerzo !== null) ? <div className="flex items-center gap-4">
          {datos.tecnica !== null ? <IndicadorTecnica tecnica={datos.tecnica} /> : null}
          {datos.nivelEsfuerzo !== null ? <VelocimetroEsfuerzo esfuerzo={datos.nivelEsfuerzo} /> : null}
        </div> : null}
      </TarjetaQueAbre>
        {puedeCambiar ?
          <MenuDeAcciones className="absolute right-3 top-3 z-10" etiqueta={`Opciones de ${circuito.nombre}`}
            acciones={[
              { etiqueta: "Editar", alElegir: () => void editar(circuitoEnVivo) },
              { etiqueta: "Eliminar", destructiva: true, alElegir: () => void eliminar(circuitoEnVivo) },
            ]} /> : null}
      </div>;
      })}
    </div> : null}
  </div>;
}
