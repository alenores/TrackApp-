"use client";

import { useCallback, useEffect, useState } from "react";
import { leerCircuitoCompleto, leerCircuitos, retirarCircuito } from "@/app/actions/circuitos";
import { DetalleDeCircuito } from "@/components/circuitos/detalle-de-circuito";
import { EditorDeCircuito } from "@/components/circuitos/editor-de-circuito";
import { Boton } from "@/components/ui/boton";
import { BotonAgregar } from "@/components/ui/boton-agregar";
import { BotonFlotanteDeAgregar } from "@/components/ui/boton-flotante-de-agregar";
import { BuscadorDeTitulo } from "@/components/ui/buscador-de-titulo";
import { Tarjeta } from "@/components/ui/tarjeta";
import { TarjetaQueAbre } from "@/components/ui/tarjeta-que-abre";
import { MenuDeAcciones } from "@/components/ui/menu-de-acciones";
import { useDialogos } from "@/components/ui/dialogos";
import { actualizarCircuito } from "@/lib/circuitos/actualizar";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { useLoQueFalta } from "@/hooks/use-lo-que-falta";
import { AvisoCompactoDeMapas } from "@/components/rutas/aviso-compacto-de-mapas";
import { IndicadorDeMapaBajado } from "@/components/rutas/indicador-de-mapa-bajado";
import { AutorDeCircuito } from "@/components/circuitos/autor-de-circuito";
import { CifrasDeCircuito } from "@/components/circuitos/cifras-de-circuito";
import { useSectoresConMapaBajado } from "@/hooks/use-mapa-del-sector";
import { mapaDelCircuito } from "@/lib/mapas/lo-que-falta";
import {
  filtrarCircuitos,
  filtrosDeCircuitosPuestos,
  SIN_FILTROS_DE_CIRCUITOS,
  type FiltrosDeCircuitos,
} from "@/lib/circuitos/filtros";
import { FiltrosDeCircuitos as VentanaDeFiltros } from "@/components/circuitos/filtros-de-circuitos";
import { BotonRedondo } from "@/components/ui/boton-redondo";
import { ICONO_DE_FILTRAR } from "@/components/ui/iconos";
import { PastillasDeFiltros } from "@/components/ui/pastillas-de-filtros";
import type { CircuitoGuardado } from "@/lib/circuitos/datos";
import type { ParteDibujada } from "@/lib/circuitos/dibujo";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import { olvidarLoDeEstaApertura, unaVezPorApertura } from "@/lib/datos/una-vez-por-apertura";
import { useQuienSoy } from "@/components/armazon/quien-soy";

type Vista = { tipo: "lista" } | { tipo: "nuevo" } | { tipo: "detalle"; id: number }
  | { tipo: "editar"; circuito: CircuitoGuardado; partes: ParteDibujada[];
    finalSeparado: boolean; caminos: CaminoGuardado[] };

export function PantallaDeCircuitos() {
  const { miCategoria: categoria, miPerfilId } = useQuienSoy();
  const [vista, setVista] = useState<Vista>({ tipo: "lista" });
  const [filtros, setFiltros] = useState<FiltrosDeCircuitos>(SIN_FILTROS_DE_CIRCUITOS);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [circuitos, setCircuitos] = useState<CircuitoGuardado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  const { confirmar } = useDialogos();
  const { paquete, estado, aviso: avisoDelPaquete } = useDatosDeLaApp();
  const haySenal = useHaySenal();
  // Lo que le falta a este celular se dice acá, en casa y con señal.
  const loQueFalta = useLoQueFalta(paquete);
  const sectoresConMapa = useSectoresConMapaBajado();
  // Después de guardar o retirar: se olvida lo pedido y se trae fresco.
  const cargar = useCallback(async () => {
    setCargando(true);
    olvidarLoDeEstaApertura();
    try {
      const resultado = await unaVezPorApertura("circuitos", leerCircuitos);
      if (resultado.ok) { setCircuitos(resultado.datos); setAviso(null); }
      else setAviso(resultado.error);
    } catch (error) {
      setAviso(`No se pudieron cargar los Circuitos: ${error instanceof Error ? error.message : String(error)}. Probá de nuevo con señal.`);
    } finally { setCargando(false); }
  }, []);
  useEffect(() => {
    if (!haySenal) return;
    let vigente = true;
    // Una vez por apertura: volver a entrar no le pregunta de nuevo a la base.
    void unaVezPorApertura("circuitos", leerCircuitos).then((resultado) => {
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
  const puedeAgregar = categoria !== "normal" && haySenal;
  // El largo y el desnivel se arman con los Caminos al preparar el celular.
  const guardadas = new Map((paquete?.circuitos ?? []).map((cada) => [cada.id, cada]));
  // Buscar y filtrar se hace en el celular, sobre lo que ya llegó: no sale a internet.
  const paraFiltrar = fichas.map((circuito) => {
    const guardada = guardadas.get(circuito.id);
    const autor = circuito.autor ?? guardada?.autor ?? null;
    return { circuito, autor, nombre: circuito.nombre, actividad: circuito.actividad, autorId: autor?.id ?? null,
      esfuerzo: guardada?.datos?.nivelEsfuerzo ?? null, largoM: guardada?.totales?.largoM ?? null };
  });
  const encontrados = filtrarCircuitos(paraFiltrar, filtros).map((cada) => cada.circuito);
  const autores = [...new Map(paraFiltrar.flatMap((cada) => cada.autor ? [[cada.autor.id, cada.autor] as const] : [])).values()]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const nombreDe = (id: string) => autores.find((autor) => autor.id === id)?.nombre ?? "alguien que ya no está";
  const puestos = filtrosDeCircuitosPuestos(filtros, nombreDe);
  const enVivoPorId = new Map(circuitos.map((cada) => [cada.id, cada]));

  const editar = async (circuito: CircuitoGuardado) => {
    try {
      // El mismo pedido que el detalle: una vez por apertura.
      const resultado = await unaVezPorApertura(`circuito-${circuito.id}`, () => leerCircuitoCompleto(circuito.id));
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

  return <div className="space-y-4 pb-16 lg:pb-0">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h1 className="text-2xl font-bold text-texto">Circuitos</h1>
      {puedeAgregar ? <BotonAgregar etiqueta="Agregar Circuito" className="hidden lg:flex" alTocar={() => setVista({ tipo: "nuevo" })} /> : null}
    </div>
    {/* En el celular, el «+» flota abajo a la derecha, como en Salidas. */}
    {puedeAgregar ? <BotonFlotanteDeAgregar etiqueta="Agregar Circuito" soloCelular alTocar={() => setVista({ tipo: "nuevo" })} /> : null}
    <AvisoCompactoDeMapas perdidos={loQueFalta.perdidos} circuitos={loQueFalta.circuitos} aviso={loQueFalta.aviso} />
    {fichas.length > 0 ? <BuscadorDeTitulo titulo={filtros.nombre} placeholder="Buscar Circuito"
      alCambiar={(nombre) => setFiltros((actuales) => ({ ...actuales, nombre }))}>
      {/* Puesto algún filtro, se pinta con el color principal. */}
      <BotonRedondo etiqueta={puestos.length ? `Filtrar, ${puestos.length} puestos` : "Filtrar"}
        variante={puestos.length ? "principal" : "secundario"} onClick={() => setFiltrosAbiertos(true)}>
        {ICONO_DE_FILTRAR}
      </BotonRedondo>
    </BuscadorDeTitulo> : null}
    {puestos.length ? <PastillasDeFiltros puestos={puestos} alSacar={setFiltros}
      alLimpiar={() => setFiltros({ ...SIN_FILTROS_DE_CIRCUITOS, nombre: filtros.nombre })} /> : null}
    <VentanaDeFiltros abierto={filtrosAbiertos} alCerrar={() => setFiltrosAbiertos(false)} filtros={filtros}
      autores={autores} alAplicar={(elegidos) => { setFiltrosAbiertos(false); setFiltros({ ...elegidos, nombre: filtros.nombre }); }} />
    {estado === "abriendo" ? <Tarjeta><p role="status" className="text-base text-texto">Cargando Circuitos…</p></Tarjeta> : null}
    {estado === "sin_datos" ? <Tarjeta franja="ambar"><p role="alert" className="text-base text-texto">Este celular todavía no tiene los Circuitos guardados. Abrí la app con señal en casa para descargarlos.</p></Tarjeta> : null}
    {aviso && haySenal ? <Tarjeta franja="ambar" className="space-y-2"><p role="alert" className="text-base text-texto">{aviso}</p>
      <Boton variante="secundario" onClick={() => void cargar()}>Volver a intentar</Boton></Tarjeta> : null}
    {estado === "incompleto" && avisoDelPaquete ? <Tarjeta franja="ambar"><p role="alert" className="text-base text-texto">Los Circuitos guardados pueden estar desactualizados: {avisoDelPaquete}</p></Tarjeta> : null}
    {!cargando && !aviso && fichas.length === 0 ? <Tarjeta>
      <p className="text-base text-texto">Todavía no hay Circuitos guardados.</p>
    </Tarjeta> : null}
    {fichas.length > 0 && encontrados.length === 0 ? <Tarjeta>
      <p className="text-base text-texto-suave">Ningún Circuito cumple con lo que buscaste. Cambiá el nombre o sacá algún filtro para ver más.</p>
    </Tarjeta> : null}
    {encontrados.length > 0 ? <div className="grid gap-3 sm:grid-cols-2">
      {encontrados.map((circuito) => {
        const guardada = guardadas.get(circuito.id);
        const circuitoEnVivo = haySenal ? enVivoPorId.get(circuito.id) : null;
        const puedeCambiar = circuitoEnVivo && (categoria === "administrador" || circuitoEnVivo.perfilId === miPerfilId);
        const totales = guardada?.totales;
        const datos = guardada?.datos;
        return <div key={circuito.id} className="relative"><TarjetaQueAbre etiqueta={`Abrir ${circuito.nombre}`}
          alAbrir={() => setVista({ tipo: "detalle", id: circuito.id })} className="space-y-2">
        <h2 className={`text-lg font-semibold text-texto ${puedeCambiar ? "pr-12" : ""}`}>{circuito.nombre}</h2>
        <AutorDeCircuito autor={circuito.autor ?? guardada?.autor} />
        <CifrasDeCircuito actividad={circuito.actividad} largoM={totales?.largoM ?? null}
          tecnica={datos?.tecnica ?? null} esfuerzo={datos?.nivelEsfuerzo ?? null}
          desnivelPositivoM={totales?.desnivelPositivoM ?? null} desnivelNegativoM={totales?.desnivelNegativoM ?? null} />
        {guardada ? <IndicadorDeMapaBajado {...mapaDelCircuito(guardada, paquete?.sectores ?? [], sectoresConMapa)} /> : null}
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
