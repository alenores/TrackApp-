"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PreguntaDeRegistrar } from "@/components/navegacion/registro-de-salida";
import { BotonFlotante } from "@/components/ui/boton-flotante-de-agregar";
import { useRegistros } from "@/hooks/use-registros";
import { elEnCurso, empezarUnRegistro } from "@/lib/salidas/registro";
import { leerCircuitoCompleto, retirarCircuito } from "@/app/actions/circuitos";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import type { TipoDeFondo } from "@/components/mapa/capas-base";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { ResumenDeCircuito } from "@/components/circuitos/resumen-de-circuito";
import { DatosDeCircuito } from "@/components/circuitos/datos-de-circuito";
import { AlturasDeCircuito } from "@/components/circuitos/alturas-de-circuito";
import { BloqueDeCobertura } from "@/components/rutas/bloque-de-cobertura";
import { alturasDelCircuito, puntoEnElCircuito } from "@/lib/circuitos/alturas";
import { useDialogos } from "@/components/ui/dialogos";
import { actualizarCircuito } from "@/lib/circuitos/actualizar";
import { caminosParaArmarCircuito, partesDelCircuitoEnElMapa } from "@/lib/circuitos/en-el-mapa";
import { resumirCircuito } from "@/lib/circuitos/resumen";
import { calcularCobertura } from "@/lib/cobertura";
import { rectanguloQueAbarca } from "@/lib/datos/rectangulo";
import { exito } from "@/lib/datos/resultado";
import { leerCircuitoPreparado, type CircuitoPreparado } from "@/lib/offline/circuitos";
import { usePaqueteGuardado } from "@/hooks/use-paquete-guardado";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { useMapasBajados } from "@/hooks/use-mapa-del-sector";
import type { CircuitoGuardado } from "@/lib/circuitos/datos";
import type { ParteDibujada } from "@/lib/circuitos/dibujo";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import type { CorreccionDeCamino } from "@/lib/circuitos/actualizar";
import { ACTIVIDADES_RUTA } from "@/types/database";
import { mostrarActividad } from "@/lib/rutas/actividades";

type Completo = { circuito: CircuitoGuardado; caminos: CaminoGuardado[]; correcciones: CorreccionDeCamino[] };

export function DetalleDeCircuito({ id, miPerfilId, esAdministrador, alVolver, alEditar, alRetirar }: {
  id: number;
  miPerfilId: string | null;
  esAdministrador: boolean;
  alVolver: () => void;
  alEditar: (circuito: CircuitoGuardado, partes: ParteDibujada[], finalSeparado: boolean, caminos: CaminoGuardado[]) => void;
  alRetirar: () => void;
}) {
  const { confirmar, avisar } = useDialogos();
  const router = useRouter();
  const hayUnaEnCurso = elEnCurso(useRegistros()) !== null;
  const [preguntandoSiRegistrar, setPreguntandoSiRegistrar] = useState(false);
  const [completo, setCompleto] = useState<Completo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [preparado, setPreparado] = useState<CircuitoPreparado | null>(null);
  const [puntoSenalado, setPuntoSenalado] = useState<number[] | null>(null);
  const paquete = usePaqueteGuardado();
  const fichaGuardada = paquete?.circuitos.find((cada) => cada.id === id) ?? null;
  const haySenal = useHaySenal();
  const mapasBajados = useMapasBajados();
  useEffect(() => {
    if (!haySenal) return;
    let vigente = true;
    void leerCircuitoCompleto(id).then((resultado) => {
      if (!vigente) return;
      if (resultado.ok) { setCompleto(resultado.datos); setAviso(null); }
      else setAviso(resultado.error);
      setCargando(false);
    }).catch((error) => {
      if (!vigente) return;
      setAviso(`No se pudo abrir el Circuito: ${error instanceof Error ? error.message : String(error)}. Volvé a intentar con señal.`);
      setCargando(false);
    });
    return () => { vigente = false; };
  }, [id, haySenal]);
  useEffect(() => {
    let vigente = true;
    if (!fichaGuardada) return;
    void leerCircuitoPreparado(fichaGuardada).then((resultado) => {
      if (vigente) { setPreparado(resultado); setCargando(false); }
    });
    return () => { vigente = false; };
  }, [fichaGuardada]);

  const actualizado = useMemo(() => completo
    ? actualizarCircuito(completo.circuito, completo.caminos, completo.correcciones) : null, [completo]);
  const dibujo = useMemo(() => completo && actualizado?.ok
    ? partesDelCircuitoEnElMapa(actualizado.datos.partes, completo.caminos, completo.circuito.actividad) : null,
  [completo, actualizado]);
  const resumen = useMemo(() => completo && actualizado?.ok
    ? resumirCircuito(actualizado.datos.partes, completo.caminos, completo.circuito.actividad, actualizado.datos.finalSeparado) : null,
  [completo, actualizado]);
  const alturas = useMemo(() => completo && actualizado?.ok
    ? alturasDelCircuito(actualizado.datos.partes, completo.caminos, completo.circuito.alturasPropias) : null,
  [completo, actualizado]);
  const encuadre = useMemo(() => {
    if (!actualizado?.ok) return null;
    const puntos: [number, number][] = actualizado.datos.partes.flatMap((parte) => parte.coordenadas.map((punto): [number, number] => [punto[0], punto[1]]));
    if (actualizado.datos.finalSeparado) puntos.push([actualizado.datos.finalSeparado[0], actualizado.datos.finalSeparado[1]]);
    return puntos.length ? rectanguloQueAbarca(puntos) : null;
  }, [actualizado]);
  const caminosDelFondo = useMemo(() => completo
    ? caminosParaArmarCircuito(completo.caminos, completo.circuito.actividad, ACTIVIDADES_RUTA)
    : null, [completo]);
  const ficha = completo?.circuito ?? fichaGuardada;
  const dibujoMostrado = dibujo?.ok ? dibujo.datos : preparado?.dibujo ?? null;
  const resumenMostrado = resumen ?? (preparado ? exito(preparado.resumen) : null);
  const finalMostrado = actualizado?.ok ? actualizado.datos.finalSeparado : preparado?.finalSeparado ?? null;
  const encuadreMostrado = encuadre ?? fichaGuardada?.rectangulo ?? null;
  const alturasMostradas = alturas ?? preparado?.alturas ?? null;
  const partesMostradas = actualizado?.ok ? actualizado.datos.partes : preparado?.partes ?? null;
  const datosDelCircuito = completo?.circuito.datos ?? fichaGuardada?.datos;
  const largoM = resumenMostrado?.ok ? resumenMostrado.datos.metrosTotales : fichaGuardada?.totales?.largoM ?? null;
  const yaBajados = useMemo(() => new Set(mapasBajados.map((mapa) => mapa.sectorId)), [mapasBajados]);
  const cobertura = useMemo(() => dibujoMostrado
    ? calcularCobertura(dibujoMostrado, paquete?.sectores ?? [], yaBajados) : null,
  [dibujoMostrado, paquete?.sectores, yaBajados]);
  const sectoresNecesarios = cobertura?.sectores.map((cada) => cada.sector) ?? [];
  const fondosDisponibles: TipoDeFondo[] = [];
  if (mapasBajados.some((mapa) => sectoresNecesarios.some((sector) => sector.id === mapa.sectorId) && mapa.tipo === "simple")) fondosDisponibles.push("dibujo");
  if (mapasBajados.some((mapa) => sectoresNecesarios.some((sector) => sector.id === mapa.sectorId) && mapa.tipo === "satelital")) fondosDisponibles.push("satelital");
  const versionVigente = completo?.caminos.reduce((ultima, camino) => camino.actualizadoEn > ultima ? camino.actualizadoEn : ultima,
    completo.circuito.actualizadoEn) ?? preparado?.actualizadoEn;
  const preparadoAlDia = preparado && preparado.actualizadoEn === versionVigente;

  const irANavegar = () => router.push(`/circuitos/${id}/navegar`);

  // Antes de navegar se pregunta si registrar la Salida, como hacía la ruta.
  // Si ya hay una en curso (se dejó para seguir después), se sigue esa.
  const navegar = () => {
    if (hayUnaEnCurso) { irANavegar(); return; }
    setPreguntandoSiRegistrar(true);
  };

  const registrarYNavegar = async () => {
    setPreguntandoSiRegistrar(false);
    try {
      await empezarUnRegistro(id, ficha?.nombre ?? null);
    } catch (causa) {
      await avisar({
        titulo: "No se pudo empezar a registrar",
        mensaje: `${causa instanceof Error ? causa.message : String(causa)}. Podés navegar igual y empezar a registrar desde el mapa.`,
      });
    }
    irANavegar();
  };

  const retirar = async () => {
    if (!completo || ocupado) return;
    const seguro = await confirmar({ titulo: "¿Retirar este Circuito?",
      mensaje: "Dejará de aparecer en la lista. Los Caminos del mapa quedan como están.",
      textoDeAceptar: "Retirar Circuito", destructivo: true });
    if (!seguro) return;
    setOcupado(true);
    try {
      const resultado = await retirarCircuito(completo.circuito.id, completo.circuito.actualizadoEn);
      if (resultado.ok) alRetirar();
      else setAviso(resultado.error);
    } catch (error) {
      setAviso(`No se pudo retirar el Circuito: ${error instanceof Error ? error.message : String(error)}. Probá de nuevo.`);
    } finally { setOcupado(false); }
  };

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2">
      <Boton variante="secundario" onClick={alVolver}>Volver</Boton>
      <h1 className="text-2xl font-bold text-texto">{ficha?.nombre ?? "Circuito"}</h1>
    </div>
    {cargando && (haySenal || fichaGuardada) ? <Tarjeta><p role="status" className="text-base text-texto">Abriendo el Circuito…</p></Tarjeta> : null}
    {!haySenal && !fichaGuardada ? <Tarjeta franja="ambar"><p role="alert" className="text-base text-texto">Este Circuito no está guardado en el celular. Abrí la app con señal en casa para descargarlo.</p></Tarjeta> : null}
    {aviso ? <Tarjeta franja="ambar"><p role="alert" className="text-base text-texto">{aviso}</p></Tarjeta> : null}
    {ficha ? <>
      <p className="text-base text-texto">{mostrarActividad(ficha.actividad).etiqueta}</p>
      {actualizado && !actualizado.ok ? <Tarjeta franja="ambar"><p role="alert" className="text-base text-texto">{actualizado.error}</p></Tarjeta> : null}
      {dibujo && !dibujo.ok ? <Tarjeta franja="ambar"><p role="alert" className="text-base text-texto">{dibujo.error}</p></Tarjeta> : null}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-4">
          {dibujoMostrado ? <CargadorDeMapa enVivo={haySenal} principal encuadre={encuadreMostrado}
            caminos={caminosDelFondo} circuito={dibujoMostrado} puntoSenalado={puntoSenalado}
            finalConservadoDelCircuito={finalMostrado} fondosDisponibles={fondosDisponibles} /> : null}
          {alturasMostradas ? <AlturasDeCircuito alturas={alturasMostradas}
            alSenalar={(distanciaM) => setPuntoSenalado(distanciaM === null || !partesMostradas
              ? null : puntoEnElCircuito(partesMostradas, distanciaM))} /> : null}
          {resumenMostrado ? <ResumenDeCircuito resultado={resumenMostrado} /> : null}
        </div>
        <div className="space-y-4">
          <DatosDeCircuito datos={datosDelCircuito} largoM={largoM}
            desnivelPositivoM={alturasMostradas?.ok ? alturasMostradas.datos.desnivelPositivoM : null}
            desnivelNegativoM={alturasMostradas?.ok ? alturasMostradas.datos.desnivelNegativoM : null} />
          {cobertura ? <BloqueDeCobertura cobertura={cobertura} este="este Circuito" /> : null}
          {preparadoAlDia ? <Boton onClick={navegar}>Navegar Circuito</Boton>
            : <Tarjeta franja="ambar"><p className="text-base text-texto">Este Circuito aún no quedó preparado en el celular. Abrí la app con señal en casa para descargarlo antes de salir.</p></Tarjeta>}
          {haySenal && completo && (esAdministrador || completo.circuito.perfilId === miPerfilId) ? <div className="flex flex-wrap gap-2">
            <Boton variante="secundario" disabled={!actualizado?.ok}
              onClick={() => { if (actualizado?.ok) alEditar(completo.circuito,
                actualizado.datos.partes, !!actualizado.datos.finalSeparado, completo.caminos); }}>Editar Circuito</Boton>
            <Boton variante="destructivo" disabled={ocupado} onClick={() => void retirar()}>Retirar Circuito</Boton>
          </div> : null}
        </div>
      </div>
    </> : null}
    {ficha && preparadoAlDia ? <>
      {/* En el celular, flotante abajo a la derecha, al alcance del pulgar, como en la ruta. */}
      <div aria-hidden className="h-12 lg:hidden" />
      <BotonFlotante etiqueta="Navegar este Circuito" alTocar={navegar} soloCelular>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        <circle cx="12" cy="12" r="6.5" />
        <circle cx="12" cy="12" r="2.5" />
      </BotonFlotante>
    </> : null}
    <PreguntaDeRegistrar
      abierta={preguntandoSiRegistrar}
      alCerrar={() => setPreguntandoSiRegistrar(false)}
      alSoloNavegar={() => { setPreguntandoSiRegistrar(false); irANavegar(); }}
      alRegistrar={() => void registrarYNavegar()}
    />
  </div>;
}
