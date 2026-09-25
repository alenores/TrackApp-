"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { FeatureCollection } from "geojson";
import type { TipoDeFondo } from "@/components/mapa/capas-base";
import { useRecorridosDeRutas } from "@/hooks/use-rutas-en-area";
import { usePaqueteGuardado } from "@/hooks/use-paquete-guardado";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { useAnotacionesEnElMapa } from "@/components/navegacion/anotaciones-en-el-mapa";
import { ModalDeSalida } from "@/components/navegacion/modal-de-salida";
import { ElegirRutasDelMapa } from "@/components/navegacion/elegir-rutas-del-mapa";
import { BotonRedondo, ICONOS_DEL_CERRO } from "@/components/ui/boton-redondo";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useSalidaDeNavegacion } from "@/hooks/use-salida-de-navegacion";
import { usePantallaDespierta } from "@/hooks/use-pantalla-despierta";
import { useGps } from "@/hooks/use-gps";
import { seSuperponen } from "@/lib/datos/rectangulo";
import { avisoPorFaltaDeMapa } from "@/lib/navegacion/aviso-de-mapa";
import { useMapasBajados, useSectoresConMapaBajado } from "@/hooks/use-mapa-del-sector";
import { leerPaquete } from "@/lib/offline/paquete";
import { leerRecorrido } from "@/lib/offline/recorridos";
import { anotacionesDelLugar } from "@/lib/anotaciones/lugar";
import { sectorPrincipalDeLaRuta } from "@/lib/navegacion/mapa-libre";
import type { Anotacion, Rectangulo } from "@/types/database";

/**
 * La pantalla de navegación.
 *
 * **No consulta internet. Nunca. Por ningún motivo.** Todo lo que necesita se
 * descargó antes de salir; el GPS funciona por satélite y no necesita señal.
 *
 * Ver la regla «La navegación es 100% sin conexión» en AGENTS.md.
 *
 * **El GPS se prende solo al entrar y se apaga solo al salir**: quien entra
 * acá es porque está navegando. No hay botón para prenderlo.
 */

type NavegacionViewProps = {
  rutaId: number;
};

export function PantallaDeNavegacion({ rutaId }: NavegacionViewProps) {
  const salida = `/rutas/${rutaId}`;
  const { open, requestExit, cancelExit, confirmExit } =
    useSalidaDeNavegacion(salida);
  const searchParams = useSearchParams();
  const fondoInicial = (searchParams.get("fondo") as TipoDeFondo) || "dibujo";
  const rutasParams = searchParams.get("rutas");

  const sectoresBajados = useSectoresConMapaBajado();
  const mapasBajados = useMapasBajados();
  /** Los sectores que cruza esta ruta: de ellos sale qué mapas hay para elegir. */
  const [sectoresDeLaRuta, setSectoresDeLaRuta] = useState<number[]>([]);
  const [recorrido, setRecorrido] = useState<FeatureCollection | null>(null);
  const [nombre, setNombre] = useState("Ruta");
  const [rectangulo, setRectangulo] = useState<Rectangulo | null>(null);
  const [anotaciones, setAnotaciones] = useState<Anotacion[]>([]);
  const [cargandoRecorrido, setCargandoRecorrido] = useState(true);
  const gps = useGps();
  const {
    estado: estadoDelGps,
    error: errorDelGps,
    posicion,
    prender: prenderGps,
    segundosSinNoticias,
    posicionVieja,
  } = gps;

  // Se prende solo al entrar. Al salir se apaga: el GPS deja de vigilar
  // cuando la pantalla se cierra.
  useEffect(() => {
    prenderGps();
  }, [prenderGps]);
  const [avisoDelMapa, setAvisoDelMapa] = useState<string | null>(null);
  const [centrarGps, setCentrarGps] = useState<number>(0);
  const centrarEnMi = useCallback(() => setCentrarGps(Date.now()), []);
  const deAnotaciones = useAnotacionesEnElMapa({ delPaquete: anotaciones, gps, centrarEnMi });

  // Las otras rutas que se ven, además de la que se navega. Todo del celular.
  const paquete = usePaqueteGuardado();
  const rutasGuardadas = useMemo(() => paquete?.rutas ?? [], [paquete]);
  const zonasGuardadas = useMemo(() => paquete?.zonas ?? [], [paquete]);
  const sectoresGuardados = useMemo(() => paquete?.sectores ?? [], [paquete]);
  const [otrasPrendidas, setOtrasPrendidas] = useState<Set<number>>(
    () => new Set(rutasParams ? rutasParams.split(",").map(Number).filter((id) => id !== rutaId) : []),
  );
  const idsDeLasOtras = useMemo(
    () => [...otrasPrendidas].filter((id) => id !== rutaId),
    [otrasPrendidas, rutaId],
  );
  const recorridoCombinado = useRecorridosDeRutas(rutasGuardadas, idsDeLasOtras);
  const [eligiendoRutas, setEligiendoRutas] = useState(false);
  const cerrarElegirRutas = useCallback(() => setEligiendoRutas(false), []);

  // La lista de rutas abre en el sector por donde pasa la mayor parte de esta.
  const [sectorElegido, setSectorElegido] = useState<number | null>(null);
  const estaRuta = rutasGuardadas.find((cada) => cada.id === rutaId) ?? null;
  const sectorDeLaRuta = estaRuta ? sectorPrincipalDeLaRuta(estaRuta, sectoresGuardados) : null;
  const sectorDeLaLista = sectorElegido ?? sectorDeLaRuta?.id ?? null;

  usePantallaDespierta(estadoDelGps === "andando");

  // Todo sale del celular, nunca de internet.
  useEffect(() => {
    let vigente = true;

    void (async () => {
      const paquete = leerPaquete();
      const ruta = paquete?.rutas.find((cada) => cada.id === rutaId) ?? null;
      const guardado = await leerRecorrido(rutaId);

      if (!vigente) return;

      if (ruta) {
        setNombre(ruta.nombre);
        setRectangulo(ruta.rectangulo);

        // Las anotaciones de los sectores por los que pasa esta ruta.
        const sectoresQueLaCruzan = (paquete?.sectores ?? []).filter((sector) =>
          seSuperponen(ruta.rectangulo, sector.rectangulo),
        );

        const idsQueLaCruzan = sectoresQueLaCruzan.map((sector) => sector.id);
        setSectoresDeLaRuta(idsQueLaCruzan);

        // Las de los sectores que cruza y las marcadas sin sector cerca de
        // la ruta: manda dónde están, no a qué sector se las anotó.
        setAnotaciones(
          anotacionesDelLugar(
            paquete?.anotaciones ?? [],
            sectoresQueLaCruzan,
            ruta.rectangulo,
          ),
        );

        // Se navega igual, pero el usuario tiene que saber por dónde va sin
        // mapa. Es todo cálculo con lo que ya está en el celular: acá no se
        // consulta internet ni de casualidad.
        if (guardado) {
          setAvisoDelMapa(
            avisoPorFaltaDeMapa(
              guardado,
              sectoresQueLaCruzan,
              sectoresBajados,
            ),
          );
        }
      }

      setRecorrido(guardado);
      setCargandoRecorrido(false);
    })();

    return () => {
      vigente = false;
    };
  }, [rutaId, sectoresBajados]);

  if (cargandoRecorrido) {
    return (
      <Tarjeta className="py-8 text-center text-base text-texto-suave">
        Abriendo la ruta…
      </Tarjeta>
    );
  }

  if (!recorrido) {
    return (
      <Tarjeta franja="rojo" className="space-y-3">
        <p role="alert" className="text-base leading-6 text-rojo-texto">
          Esta ruta no está guardada en el celular, así que no se puede navegar
          sin señal.
        </p>
        <p className="text-sm leading-6 text-texto-suave">
          Abrila una vez con conexión desde tu casa y queda guardada sola.
        </p>
        <Boton variante="secundario" anchoCompleto onClick={() => requestExit()}>
          Volver a la ruta
        </Boton>
      </Tarjeta>
    );
  }

  const recorridoCompletoMapa: FeatureCollection | null =
    recorrido && recorridoCombinado
      ? {
          type: "FeatureCollection",
          features: [...recorrido.features, ...recorridoCombinado.features],
        }
      : recorrido || recorridoCombinado;

  // Simple, satelital o los dos: los que estén bajados en algún sector de la ruta.
  const fondosDisponibles: TipoDeFondo[] = [];
  const tiposBajados = new Set(
    mapasBajados
      .filter((mapa) => sectoresDeLaRuta.includes(mapa.sectorId))
      .map((mapa) => mapa.tipo),
  );
  if (tiposBajados.has("simple")) fondosDisponibles.push("dibujo");
  if (tiposBajados.has("satelital")) fondosDisponibles.push("satelital");

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-mapa-fondo">
        <div className="absolute inset-0">
          <CargadorDeMapa
            recorrido={recorridoCompletoMapa}
            anotaciones={deAnotaciones.enElMapa}
            marcandoPunto={deAnotaciones.marcandoPunto}
            alMarcarPunto={deAnotaciones.alMarcarPunto}
            miPosicion={posicion ? { lat: posicion.lat, lon: posicion.lon } : null}
            encuadre={rectangulo}
            pantallaCompleta
            fondoInicial={fondoInicial}
            fondosDisponibles={fondosDisponibles}
            forzarCentradoEn={centrarGps}
            alTocarAnotacion={deAnotaciones.alTocarAnotacion}
          />
        </div>

        {deAnotaciones.aviso}

        {deAnotaciones.anotando ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0">{deAnotaciones.panel}</div>
        ) : (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col justify-end gap-2 p-3 pb-safe-4">
            {avisoDelMapa ? (
              <p
                role="status"
                className="pointer-events-auto rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-2 text-center text-lg text-ambar-texto"
              >
                {avisoDelMapa}
              </p>
            ) : null}

            {posicionVieja ? (
              <p
                role="alert"
                className="pointer-events-auto rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-2 text-center text-lg text-ambar-texto"
              >
                Hace {segundosSinNoticias} segundos que el GPS no da novedades. Tu
                punto puede estar desactualizado.
              </p>
            ) : null}

            {estadoDelGps === "pidiendo" ? (
              <p
                role="status"
                className="pointer-events-auto rounded-xl border border-borde bg-superficie px-3 py-2 text-center text-lg text-texto"
              >
                Buscando tu posición con el GPS…
              </p>
            ) : null}

            {errorDelGps ? (
              <p
                role="alert"
                className="pointer-events-auto rounded-xl border border-rojo-borde bg-superficie p-2 text-lg leading-7 text-rojo-texto"
              >
                {errorDelGps}
              </p>
            ) : null}

            <div className="pointer-events-auto flex items-center gap-2">
              <BotonRedondo etiqueta="Salir de la navegación" onClick={() => requestExit()}>
                {ICONOS_DEL_CERRO.salir}
              </BotonRedondo>
              {deAnotaciones.boton}
              <BotonRedondo etiqueta="Rutas en el mapa" onClick={() => setEligiendoRutas(true)}>
                {ICONOS_DEL_CERRO.rutas}
              </BotonRedondo>
              <span className="flex-1" />
              {estadoDelGps === "andando" ? (
                <BotonRedondo etiqueta="Centrar en mi ubicación" onClick={() => setCentrarGps(Date.now())}>
                  {ICONOS_DEL_CERRO.centrar}
                </BotonRedondo>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <ElegirRutasDelMapa
        abierto={eligiendoRutas}
        alCerrar={cerrarElegirRutas}
        zonas={zonasGuardadas}
        sectores={sectoresGuardados}
        rutas={rutasGuardadas}
        sectorId={sectorDeLaLista}
        alElegirSector={setSectorElegido}
        prendidas={otrasPrendidas}
        alCambiar={setOtrasPrendidas}
        fija={rutaId}
        posicion={posicion}
        fondosDisponibles={fondosDisponibles}
      />

      {deAnotaciones.resto}

      <ModalDeSalida
        open={open}
        onCancel={cancelExit}
        onConfirm={confirmExit}
      />
    </>
  );
}
