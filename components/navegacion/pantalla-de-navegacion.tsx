"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FeatureCollection } from "geojson";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { ModalDeSalida } from "@/components/navegacion/modal-de-salida";
import { BotonDeModo } from "@/components/ui/boton-de-modo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSalidaDeNavegacion } from "@/hooks/use-salida-de-navegacion";
import { usePantallaDespierta } from "@/hooks/use-pantalla-despierta";
import { vibrarAlTocar } from "@/lib/vibracion";
import {
  distanciaALaRutaEnMetros,
  mensajeDeErrorDelGps,
  METROS_DE_DESVIO_QUE_AVISAN,
  type EstadoDelGps,
} from "@/lib/navegacion/desvio";
import { seSuperponen } from "@/lib/datos/rectangulo";
import { avisoPorFaltaDeMapa } from "@/lib/navegacion/aviso-de-mapa";
import { sectoresConMapaBajado } from "@/lib/offline/mapas";
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

  const vigilanciaRef = useRef<number | null>(null);
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
              sectoresConMapaBajado(),
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
  }, [rutaId]);

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
    metrosDeDesvio > METROS_DE_DESVIO_QUE_AVISAN;

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
      <Card className="py-8 text-center text-base text-texto-suave">
        Abriendo la ruta…
      </Card>
    );
  }

  if (!recorrido) {
    return (
      <Card franja="rojo" className="space-y-3">
        <p role="alert" className="text-base leading-6 text-rojo-texto">
          Esta ruta no está guardada en el celular, así que no se puede navegar
          sin señal.
        </p>
        <p className="text-sm leading-6 text-texto-suave">
          Abrila una vez con conexión desde tu casa y queda guardada sola.
        </p>
        <Button variante="secundario" anchoCompleto onClick={() => requestExit()}>
          Volver a la ruta
        </Button>
      </Card>
    );
  }

  return (
    <>
      <div className="flex h-[calc(100dvh-8rem)] min-h-[420px] flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-texto">
              {nombre}
            </h1>
            <p className="text-sm text-texto-suave">Navegando sin conexión</p>
          </div>

          <button
            type="button"
            onClick={() => requestExit()}
            onPointerDown={() => vibrarAlTocar()}
            aria-label="Salir de la navegación"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-borde bg-superficie text-2xl text-texto-suave hover:bg-superficie-alta hover:text-texto"
          >
            ×
          </button>
        </div>

        {avisoDelMapa ? (
          <div
            role="status"
            className="flex items-start gap-2 rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-2"
          >
            <svg
              viewBox="0 0 24 24"
              className="mt-0.5 h-5 w-5 shrink-0 text-ambar-icono"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.1}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 3.5 21 19H3Z" />
              <path d="M12 10v4" />
              <path d="M12 17.2v.1" />
            </svg>
            <p className="text-sm leading-6 text-ambar-texto">{avisoDelMapa}</p>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-borde">
          <CargadorDeMapa
            recorrido={recorrido}
            anotaciones={anotaciones}
            miPosicion={posicion ? { lat: posicion.lat, lon: posicion.lon } : null}
            encuadre={rectangulo}
            pantallaCompleta
          />
        </div>

        {estoyFueraDeRuta ? (
          <div
            role="alert"
            className="rounded-xl bg-rojo-fondo px-3 py-3 text-center text-lg font-bold text-rojo-texto ring-1 ring-rojo-borde"
          >
            Fuera de ruta
          </div>
        ) : null}

        {posicionVieja ? (
          <div
            role="alert"
            className="rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-2 text-center text-sm text-ambar-texto"
          >
            Hace {segundosSinNoticias} segundos que el GPS no da novedades. Tu
            punto puede estar desactualizado.
          </div>
        ) : null}

        <div className="space-y-2">
          {estadoDelGps === "apagado" || estadoDelGps === "pidiendo" ? (
            <Button
              anchoCompleto
              paraNavegacion
              disabled={estadoDelGps === "pidiendo"}
              onClick={prenderGps}
            >
              {estadoDelGps === "pidiendo" ? "Prendiendo el GPS…" : "Prender el GPS"}
            </Button>
          ) : null}

          {errorDelGps ? (
            <p role="alert" className="text-base leading-6 text-rojo">
              {errorDelGps}
            </p>
          ) : null}

          {/*
            El cambio de modo vive acá abajo, al alcance del pulgar: si el sol
            gira y la pantalla deja de leerse, no se puede pedir que el usuario
            entre a un menú con guantes puestos.
          */}
          <div className="flex items-center gap-3">
            <BotonDeModo paraNavegacion />

            {estadoDelGps === "andando" && metrosDeDesvio !== null ? (
              <p className="flex-1 text-center text-lg font-medium text-texto-suave">
                {metrosDeDesvio <= METROS_DE_DESVIO_QUE_AVISAN
                  ? `Vas por la ruta · a ${Math.round(metrosDeDesvio)} m de la línea`
                  : `Te desviaste ${Math.round(metrosDeDesvio)} m de la línea`}
              </p>
            ) : (
              <span className="flex-1" />
            )}
          </div>
        </div>
      </div>

      <ModalDeSalida
        open={open}
        onCancel={cancelExit}
        onConfirm={confirmExit}
      />
    </>
  );
}
