"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { FeatureCollection } from "geojson";
import type { TipoDeFondo } from "@/components/mapa/capas-base";
import { useRutasEnArea } from "@/hooks/use-rutas-en-area";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { FichaDeAnotacion } from "@/components/navegacion/ficha-de-anotacion";
import { ModalDeSalida } from "@/components/navegacion/modal-de-salida";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useSalidaDeNavegacion } from "@/hooks/use-salida-de-navegacion";
import { usePantallaDespierta } from "@/hooks/use-pantalla-despierta";
import { vibrarAlTocar } from "@/lib/vibracion";
import {
  distanciaALaRutaEnMetros,
  mensajeDeErrorDelGps,
  hayQueAvisarDelDesvio,
  type EstadoDelGps,
} from "@/lib/navegacion/desvio";
import { seSuperponen } from "@/lib/datos/rectangulo";
import { avisoPorFaltaDeMapa } from "@/lib/navegacion/aviso-de-mapa";
import { useMapasBajados, useSectoresConMapaBajado } from "@/hooks/use-mapa-del-sector";
import { leerPaquete } from "@/lib/offline/paquete";
import { leerRecorrido } from "@/lib/offline/recorridos";
import type { Anotacion, Rectangulo } from "@/types/database";

/**
 * La pantalla de navegación.
 *
 * **No consulta internet. Nunca. Por ningún motivo.** Todo lo que necesita se
 * descargó antes de salir; el GPS funciona por satélite y no necesita señal.
 *
 * Ver la regla «La navegación es 100% sin conexión» en AGENTS.md.
 */

/** Cuántos segundos sin noticias del GPS para avisar que la posición envejeció. */
const SEGUNDOS_PARA_AVISAR_POSICION_VIEJA = 30;

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
  const rutasExtrasIds = rutasParams ? rutasParams.split(",").map(Number) : [];

  const vigilanciaRef = useRef<number | null>(null);
  const sectoresBajados = useSectoresConMapaBajado();
  const mapasBajados = useMapasBajados();
  /** Los sectores que cruza esta ruta: de ellos sale qué mapas hay para elegir. */
  const [sectoresDeLaRuta, setSectoresDeLaRuta] = useState<number[]>([]);
  const [recorrido, setRecorrido] = useState<FeatureCollection | null>(null);
  const [nombre, setNombre] = useState("Ruta");
  const [rectangulo, setRectangulo] = useState<Rectangulo | null>(null);
  const [anotaciones, setAnotaciones] = useState<Anotacion[]>([]);
  const [cargandoRecorrido, setCargandoRecorrido] = useState(true);
  const [estadoDelGps, setEstadoDelGps] = useState<EstadoDelGps>("apagado");
  const [errorDelGps, setErrorDelGps] = useState<string | null>(null);
  const [posicion, setPosicion] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [ultimaNoticia, setUltimaNoticia] = useState<number | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());
  const [metrosDeDesvio, setMetrosDeDesvio] = useState<number | null>(null);
  const [avisoDelMapa, setAvisoDelMapa] = useState<string | null>(null);
  const [anotacionTocada, setAnotacionTocada] = useState<number | null>(null);
  const [centrarGps, setCentrarGps] = useState<number>(0);

  const { recorridoCombinado } = useRutasEnArea(rectangulo || { latNorte: 0, latSur: 0, lonEste: 0, lonOeste: 0 }, rutaId, rutasExtrasIds);

  usePantallaDespierta(estadoDelGps === "andando");

  // Abrir la ficha de una anotación es un toque en el mapa. Se pasa una función
  // que no cambia entre dibujados: el mapa la engancha una sola vez.
  const abrirLaAnotacion = useCallback((anotacionId: number) => {
    vibrarAlTocar();
    setAnotacionTocada(anotacionId);
  }, []);

  const cerrarLaAnotacion = useCallback(() => setAnotacionTocada(null), []);

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

        setAnotaciones(
          (paquete?.anotaciones ?? []).filter((anotacion) =>
            idsQueLaCruzan.includes(anotacion.sectorId),
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

  // Un reloj lento, solo para saber si la posición envejeció.
  useEffect(() => {
    if (estadoDelGps !== "andando") return;
    const tic = window.setInterval(() => setAhora(Date.now()), 5000);
    return () => window.clearInterval(tic);
  }, [estadoDelGps]);

  useEffect(() => {
    return () => {
      if (vigilanciaRef.current !== null) {
        navigator.geolocation.clearWatch(vigilanciaRef.current);
      }
    };
  }, []);

  const prenderGps = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorDelGps(
        "Este celular no tiene GPS disponible para la app. Fijate en los permisos del navegador.",
      );
      setEstadoDelGps("no_disponible");
      return;
    }

    setEstadoDelGps("pidiendo");
    setErrorDelGps(null);

    if (vigilanciaRef.current !== null) {
      navigator.geolocation.clearWatch(vigilanciaRef.current);
    }

    vigilanciaRef.current = navigator.geolocation.watchPosition(
      (lectura) => {
        const lat = lectura.coords.latitude;
        const lon = lectura.coords.longitude;

        setPosicion({ lat, lon });
        setEstadoDelGps("andando");
        setUltimaNoticia(Date.now());
        setAhora(Date.now());

        if (recorrido) {
          setMetrosDeDesvio(distanciaALaRutaEnMetros(lat, lon, recorrido));
        }
      },
      (error) => {
        setErrorDelGps(mensajeDeErrorDelGps(error));
        setEstadoDelGps(
          error.code === error.PERMISSION_DENIED ? "sin_permiso" : "no_disponible",
        );
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );
  }, [recorrido]);

  const estoyFueraDeRuta =
    estadoDelGps === "andando" &&
    metrosDeDesvio !== null &&
    hayQueAvisarDelDesvio(metrosDeDesvio);

  // Avisar vibrando: yendo por el sendero, nadie está mirando la pantalla.
  useEffect(() => {
    if (estoyFueraDeRuta) vibrarAlTocar(220);
  }, [estoyFueraDeRuta]);

  const segundosSinNoticias =
    ultimaNoticia === null ? 0 : Math.round((ahora - ultimaNoticia) / 1000);

  const posicionVieja =
    estadoDelGps === "andando" &&
    segundosSinNoticias > SEGUNDOS_PARA_AVISAR_POSICION_VIEJA;

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
            anotaciones={anotaciones}
            miPosicion={posicion ? { lat: posicion.lat, lon: posicion.lon } : null}
            encuadre={rectangulo}
            pantallaCompleta
            fondoInicial={fondoInicial}
            fondosDisponibles={fondosDisponibles}
            forzarCentradoEn={centrarGps}
            alCerrarPantallaCompleta={requestExit}
            alTocarAnotacion={abrirLaAnotacion}
          />
        </div>

        {/* Capa sobre el mapa (todo lo que no es el mapa en sí) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col justify-end gap-2 p-3 pb-safe-4">

          {estoyFueraDeRuta ? (
            <div
              role="alert"
              className="rounded-xl bg-rojo-fondo px-3 py-3 text-center text-lg font-bold text-rojo-texto ring-1 ring-rojo-borde pointer-events-auto"
            >
              Fuera de ruta
            </div>
          ) : null}

          {posicionVieja ? (
            <div
              role="alert"
              className="rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-2 text-center text-sm text-ambar-texto pointer-events-auto"
            >
              Hace {segundosSinNoticias} segundos que el GPS no da novedades. Tu
              punto puede estar desactualizado.
            </div>
          ) : null}

          <div className="space-y-2 pointer-events-auto">
            {estadoDelGps === "apagado" || estadoDelGps === "pidiendo" ? (
              <Boton
                anchoCompleto
                paraNavegacion
                disabled={estadoDelGps === "pidiendo"}
                onClick={prenderGps}
              >
                {estadoDelGps === "pidiendo" ? "Prendiendo el GPS…" : "Prender el GPS"}
              </Boton>
            ) : null}

            {errorDelGps ? (
              <p role="alert" className="text-base leading-6 text-rojo bg-superficie/90 p-2 rounded-xl border border-rojo/20">
                {errorDelGps}
              </p>
            ) : null}

            <div className="flex items-center gap-3">
              {estadoDelGps === "andando" ? (
                <button
                  type="button"
                  aria-label="Centrar en mi ubicación"
                  onClick={() => setCentrarGps(Date.now())}
                  className="pointer-events-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-borde-fuerte bg-superficie text-texto shadow-[var(--sombra-alta)] hover:bg-superficie-alta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde"
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                    <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                    <circle cx="12" cy="10" r="3" fill="currentColor" />
                  </svg>
                </button>
              ) : null}

              {estadoDelGps === "andando" && metrosDeDesvio !== null ? (
                <p className="flex-1 text-center text-lg font-medium text-texto-suave bg-superficie/80 py-2 rounded-xl backdrop-blur-sm border border-borde">
                  {!hayQueAvisarDelDesvio(metrosDeDesvio)
                    ? `Vas por la ruta · a ${Math.round(metrosDeDesvio)} m de la línea`
                    : `Te desviaste ${Math.round(metrosDeDesvio)} m de la línea`}
                </p>
              ) : (
                <span className="flex-1" />
              )}
            </div>
          </div>
        </div>
      </div>

      <FichaDeAnotacion
        anotacion={
          anotaciones.find((cada) => cada.id === anotacionTocada) ?? null
        }
        alCerrar={cerrarLaAnotacion}
      />

      <ModalDeSalida
        open={open}
        onCancel={cancelExit}
        onConfirm={confirmExit}
      />
    </>
  );
}
