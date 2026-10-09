"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import type { TipoDeFondo } from "@/components/mapa/capas-base";
import { useAnotacionesEnElMapa } from "@/components/navegacion/anotaciones-en-el-mapa";
import { ElegirCircuitosDelMapa } from "@/components/navegacion/elegir-circuitos-del-mapa";
import { ModalDeSalida } from "@/components/navegacion/modal-de-salida";
import {
  BotonEmpezarARegistrar,
  BotonMarcarAca,
  FranjaDeRegistro,
  PreguntaDeRegistrar,
} from "@/components/navegacion/registro-de-salida";
import { Boton } from "@/components/ui/boton";
import { BotonRedondo, ICONOS_DEL_CERRO } from "@/components/ui/boton-redondo";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Emergente } from "@/components/ui/emergente";
import { GraficoDeAlturas } from "@/components/ui/grafico-de-alturas";
import { ReferenciaDePartes } from "@/components/rutas/referencia-de-partes";
import { useGps } from "@/hooks/use-gps";
import { usePantallaDespierta } from "@/hooks/use-pantalla-despierta";
import { useSalidaDeNavegacion } from "@/hooks/use-salida-de-navegacion";
import { useMapasBajados, useSectoresConMapaBajado } from "@/hooks/use-mapa-del-sector";
import { usePaqueteGuardado } from "@/hooks/use-paquete-guardado";
import { useRegistroDeSalida } from "@/hooks/use-registro-de-salida";
import { useDibujosDeCircuitos } from "@/hooks/use-dibujos-de-circuitos";
import { anotacionesParaMapaDelLugar } from "@/lib/anotaciones/lugar";
import { loQueFaltaDesde, lugarEnElCircuito } from "@/lib/circuitos/alturas";
import { textoDeAltura, textoDeDistancia } from "@/lib/alturas/grafico";
import { avisoPorFaltaDeMapa } from "@/lib/navegacion/aviso-de-mapa";
import { sectorPrincipalDelCircuito } from "@/lib/navegacion/mapa-libre";
import { seSuperponen } from "@/lib/datos/rectangulo";
import { leerCircuitoPreparado, type CircuitoPreparado } from "@/lib/offline/circuitos";

/**
 * Navegar un Circuito.
 *
 * **No consulta internet. Nunca. Por ningún motivo.** Todo sale del celular:
 * el Circuito preparado, los mapas, las anotaciones y los otros Circuitos. El
 * GPS funciona por satélite y no necesita señal.
 *
 * Hace todo lo que hacía navegar una ruta (decisión 049): registrar la Salida,
 * anotar desde el cerro y prender otros Circuitos sobre el mapa. Suma el
 * gráfico de alturas con «Estás acá».
 *
 * **El GPS se prende solo al entrar y se apaga solo al salir.**
 */

/** Más lejos que esto de la línea, el gráfico no marca «Estás acá»: sería mentir dónde estás. */
const CERCA_DEL_CIRCUITO_M = 100;

export function NavegacionDeCircuito({ circuitoId }: { circuitoId: number }) {
  const paquete = usePaqueteGuardado();
  const ficha = paquete?.circuitos.find((cada) => cada.id === circuitoId) ?? null;
  const searchParams = useSearchParams();
  const fondoInicial = (searchParams.get("fondo") as TipoDeFondo | null) ?? null;
  const [preparado, setPreparado] = useState<CircuitoPreparado | null>(null);
  const [cargando, setCargando] = useState(true);
  const [centrarGps, setCentrarGps] = useState(0);
  const [verAlturas, setVerAlturas] = useState(false);
  const { open, requestExit, cancelExit, confirmExit } = useSalidaDeNavegacion("/");
  const gps = useGps();
  const prenderGps = gps.prender;
  // La Salida que se está registrando, si hay. Solo escribe en el celular.
  const registro = useRegistroDeSalida(gps);
  const [preguntandoSiRegistrar, setPreguntandoSiRegistrar] = useState(false);
  const mapasBajados = useMapasBajados();
  const sectoresBajados = useSectoresConMapaBajado();
  useEffect(() => { prenderGps(); }, [prenderGps]);
  usePantallaDespierta(gps.estado === "andando");
  const centrarEnMi = useCallback(() => setCentrarGps(Date.now()), []);

  useEffect(() => {
    let vigente = true;
    if (!ficha) return;
    void leerCircuitoPreparado(ficha).then((resultado) => {
      if (!vigente) return;
      setPreparado(resultado);
      setCargando(false);
    }).catch(() => {
      if (vigente) setCargando(false);
    });
    return () => { vigente = false; };
  }, [ficha]);

  const sectoresGuardados = useMemo(() => paquete?.sectores ?? [], [paquete]);
  const zonasGuardadas = useMemo(() => paquete?.zonas ?? [], [paquete]);
  const circuitosGuardados = useMemo(() => paquete?.circuitos ?? [], [paquete]);

  // Los sectores que cruza la línea; con un paquete viejo, los que toca su rectángulo.
  const sectores = useMemo(() => {
    if (!ficha) return [];
    if (ficha.sectores) return sectoresGuardados.filter((sector) => ficha.sectores!.includes(sector.id));
    return ficha.rectangulo ? sectoresGuardados.filter((sector) => seSuperponen(sector.rectangulo, ficha.rectangulo!)) : [];
  }, [ficha, sectoresGuardados]);

  // Todos los puntos marcados aparecen; los trazos, los de los sectores que cruza.
  const anotaciones = useMemo(() => anotacionesParaMapaDelLugar(paquete?.anotaciones ?? [], sectores, ficha?.rectangulo ?? null),
    [paquete, sectores, ficha]);
  const deAnotaciones = useAnotacionesEnElMapa({ delPaquete: anotaciones, gps, centrarEnMi });

  // Otros Circuitos prendidos para ubicarse, leídos del celular.
  const [otrosPrendidos, setOtrosPrendidos] = useState<Set<number>>(new Set());
  const idsDeLosOtros = useMemo(() => [...otrosPrendidos].filter((id) => id !== circuitoId), [otrosPrendidos, circuitoId]);
  const otrosCircuitos = useDibujosDeCircuitos(circuitosGuardados, idsDeLosOtros);
  const [eligiendoCircuitos, setEligiendoCircuitos] = useState(false);
  const cerrarElegirCircuitos = useCallback(() => setEligiendoCircuitos(false), []);
  const [sectorElegido, setSectorElegido] = useState<number | null>(null);
  const sectorDeLaLista = sectorElegido ?? (ficha ? sectorPrincipalDelCircuito(ficha, sectoresGuardados)?.id ?? null : null);

  const fondosDisponibles: TipoDeFondo[] = [];
  const tiposBajados = new Set(mapasBajados.filter((mapa) => sectores.some((sector) => sector.id === mapa.sectorId)).map((mapa) => mapa.tipo));
  if (tiposBajados.has("simple")) fondosDisponibles.push("dibujo");
  if (tiposBajados.has("satelital")) fondosDisponibles.push("satelital");
  const avisoDelMapa = preparado ? avisoPorFaltaDeMapa(preparado.dibujo, sectores, sectoresBajados) : null;

  const lugar = preparado?.partes && gps.posicion ? lugarEnElCircuito(preparado.partes, [gps.posicion.lon, gps.posicion.lat]) : null;
  const aquiM = lugar && lugar.alejamientoM <= CERCA_DEL_CIRCUITO_M ? lugar.distanciaM : null;
  const alturas = preparado?.alturas ?? null;
  const falta = alturas?.ok && aquiM !== null ? loQueFaltaDesde(alturas.datos, aquiM) : null;

  if (cargando && ficha) return <Tarjeta><p role="status" className="text-lg text-texto">Abriendo el Circuito guardado…</p></Tarjeta>;
  if (!ficha || !preparado) return <Tarjeta franja="rojo" className="space-y-3">
    <p role="alert" className="text-lg text-texto">Este Circuito no quedó completo en el celular. Abrí la app con señal en casa para descargarlo antes de salir.</p>
    <Boton variante="secundario" onClick={() => requestExit()}>Volver</Boton>
    <ModalDeSalida open={open} onCancel={cancelExit} onConfirm={confirmExit} />
  </Tarjeta>;

  return <>
    <div className="fixed inset-0 z-50 flex flex-col bg-mapa-fondo">
      <div className="absolute inset-0">
        <CargadorDeMapa circuito={preparado.dibujo} otrosCircuitos={otrosCircuitos}
          finalConservadoDelCircuito={preparado.finalSeparado}
          anotaciones={deAnotaciones.enElMapa}
          marcandoPunto={deAnotaciones.marcandoPunto}
          alMarcarPunto={deAnotaciones.alMarcarPunto}
          alTocarAnotacion={deAnotaciones.alTocarAnotacion}
          mostrarFichaAnotacion={false}
          miPosicion={gps.posicion ? { lat: gps.posicion.lat, lon: gps.posicion.lon } : null}
          encuadre={ficha.rectangulo} pantallaCompleta
          fondoInicial={fondoInicial && fondosDisponibles.includes(fondoInicial) ? fondoInicial : fondosDisponibles[0] ?? "dibujo"}
          fondosDisponibles={fondosDisponibles}
          forzarCentradoEn={centrarGps} sinMapaDescargado={avisoDelMapa !== null || fondosDisponibles.length === 0} />
      </div>

      {deAnotaciones.aviso}

      {deAnotaciones.anotando ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0">{deAnotaciones.panel}</div>
      ) : (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 p-3 pb-safe-4">
          <ReferenciaDePartes navegando conPartesPropias />
          {gps.posicionVieja ? <p role="alert" className="pointer-events-auto rounded-xl border border-ambar-borde bg-ambar-fondo p-2 text-lg text-ambar-texto">
            Hace {gps.segundosSinNoticias} segundos que el GPS no da novedades. Tu punto puede estar desactualizado.
          </p> : null}
          {gps.estado === "pidiendo" ? <p role="status" className="pointer-events-auto rounded-xl border border-borde bg-superficie p-2 text-lg text-texto">
            Buscando tu posición con el GPS…
          </p> : null}
          {gps.error ? <p role="alert" className="pointer-events-auto rounded-xl border border-rojo-borde bg-superficie p-2 text-lg text-rojo-texto">{gps.error}</p> : null}
          {registro.enCurso ? <FranjaDeRegistro kilometros={registro.kilometros} puntos={registro.puntos}
            marcaRecien={registro.marcaRecien} error={registro.error} /> : null}
          <div className="pointer-events-auto flex items-center gap-2">
            <BotonRedondo etiqueta="Salir de la navegación" onClick={() => requestExit()}>{ICONOS_DEL_CERRO.salir}</BotonRedondo>
            {deAnotaciones.boton}
            <BotonRedondo etiqueta="Circuitos en el mapa" onClick={() => setEligiendoCircuitos(true)}>{ICONOS_DEL_CERRO.circuitos}</BotonRedondo>
            <BotonRedondo etiqueta="Ver las alturas" onClick={() => setVerAlturas(true)}>{ICONOS_DEL_CERRO.alturas}</BotonRedondo>
            <span className="flex-1" />
            {registro.enCurso
              ? <BotonMarcarAca alTocar={registro.marcarAca} deshabilitado={!gps.posicion} />
              : <BotonEmpezarARegistrar alTocar={() => setPreguntandoSiRegistrar(true)} />}
            {gps.estado === "andando" ? <BotonRedondo etiqueta="Centrar en mi ubicación" onClick={() => setCentrarGps(Date.now())}>{ICONOS_DEL_CERRO.centrar}</BotonRedondo> : null}
          </div>
        </div>
      )}
    </div>

    <ElegirCircuitosDelMapa
      abierto={eligiendoCircuitos}
      alCerrar={cerrarElegirCircuitos}
      zonas={zonasGuardadas}
      sectores={sectoresGuardados}
      circuitos={circuitosGuardados}
      sectorId={sectorDeLaLista}
      alElegirSector={setSectorElegido}
      prendidas={otrosPrendidos}
      alCambiar={setOtrosPrendidos}
      fija={circuitoId}
      posicion={gps.posicion}
      fondosDisponibles={fondosDisponibles}
    />

    {deAnotaciones.resto}

    <Emergente abierto={verAlturas} alCerrar={() => setVerAlturas(false)} titulo="Alturas" ancho="amplio">
      {!alturas ? <p role="alert" className="text-lg text-texto">Las alturas de este Circuito todavía no están en el celular. Abrí la app con señal en casa para ponerla al día.</p>
        : !alturas.ok ? <p role="alert" className="text-lg text-texto">{alturas.error}</p>
          : <div className="space-y-3">
            {falta ? <p className="text-lg text-texto">
              Hasta el final: <strong>{textoDeDistancia(falta.metros)}</strong> · desnivel positivo <strong>{textoDeAltura(falta.desnivelPositivoM)}</strong> · negativo <strong>{textoDeAltura(falta.desnivelNegativoM)}</strong>
            </p> : <p className="text-lg text-texto">
              {lugar ? `Estás a ${textoDeDistancia(lugar.alejamientoM)} del Circuito: el gráfico no marca dónde estás.`
                : "Todavía no hay posición del GPS: el gráfico no marca dónde estás."}
            </p>}
            <GraficoDeAlturas perfil={alturas.datos.perfil} tramos={alturas.datos.tramos} aquiM={aquiM} enNavegacion
              descripcion={`Alturas del Circuito: ${textoDeDistancia(alturas.datos.largoM)}, desnivel positivo ${textoDeAltura(alturas.datos.desnivelPositivoM)} y negativo ${textoDeAltura(alturas.datos.desnivelNegativoM)}.`} />
            <ReferenciaDePartes navegando conPartesPropias />
          </div>}
    </Emergente>

    <PreguntaDeRegistrar
      abierta={preguntandoSiRegistrar}
      alCerrar={() => setPreguntandoSiRegistrar(false)}
      alSoloNavegar={() => setPreguntandoSiRegistrar(false)}
      textoDeSoloNavegar="Ahora no"
      alRegistrar={() => {
        setPreguntandoSiRegistrar(false);
        void registro.empezar(circuitoId, ficha.nombre);
      }}
    />

    <ModalDeSalida
      open={open}
      onCancel={cancelExit}
      onConfirm={confirmExit}
      registrando={registro.enCurso !== null}
      alTerminarYSalir={() => {
        void registro.terminar().then((terminada) => {
          if (terminada) confirmExit();
        });
      }}
    />
  </>;
}
