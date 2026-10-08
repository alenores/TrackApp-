"use client";

import { useCallback, useEffect, useState } from "react";
import { leerCircuitos } from "@/app/actions/circuitos";
import { DetalleDeCircuito } from "@/components/circuitos/detalle-de-circuito";
import { EditorDeCircuito } from "@/components/circuitos/editor-de-circuito";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { useHaySenal } from "@/hooks/use-hay-senal";
import type { CircuitoGuardado } from "@/lib/circuitos/datos";
import type { ParteDibujada } from "@/lib/circuitos/dibujo";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import { mostrarActividad } from "@/lib/rutas/actividades";
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
  const { paquete, estado, aviso: avisoDelPaquete } = useDatosDeLaApp();
  const haySenal = useHaySenal();
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
      {categoria !== "normal" && haySenal ? <Boton onClick={() => setVista({ tipo: "nuevo" })}>Nuevo Circuito</Boton> : null}
    </div>
    {estado === "abriendo" ? <Tarjeta><p role="status" className="text-base text-texto">Cargando Circuitos…</p></Tarjeta> : null}
    {estado === "sin_datos" ? <Tarjeta franja="ambar"><p role="alert" className="text-base text-texto">Este celular todavía no tiene los Circuitos guardados. Abrí la app con señal en casa para descargarlos.</p></Tarjeta> : null}
    {aviso && haySenal ? <Tarjeta franja="ambar" className="space-y-2"><p role="alert" className="text-base text-texto">{aviso}</p>
      <Boton variante="secundario" onClick={() => void cargar()}>Volver a intentar</Boton></Tarjeta> : null}
    {estado === "incompleto" && avisoDelPaquete ? <Tarjeta franja="ambar"><p role="alert" className="text-base text-texto">Los Circuitos guardados pueden estar desactualizados: {avisoDelPaquete}</p></Tarjeta> : null}
    {!cargando && !aviso && fichas.length === 0 ? <Tarjeta>
      <p className="text-base text-texto">Todavía no hay Circuitos guardados.</p>
    </Tarjeta> : null}
    {fichas.length > 0 ? <div className="grid gap-3 sm:grid-cols-2">
      {fichas.map((circuito) => <Tarjeta key={circuito.id} className="space-y-2">
        <h2 className="text-lg font-semibold text-texto">{circuito.nombre}</h2>
        <p className="text-base text-texto-suave">{mostrarActividad(circuito.actividad).etiqueta}</p>
        <Boton variante="secundario" onClick={() => setVista({ tipo: "detalle", id: circuito.id })}>Ver Circuito</Boton>
      </Tarjeta>)}
    </div> : null}
  </div>;
}
