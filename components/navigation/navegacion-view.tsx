"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FeatureCollection } from "geojson";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { NavigationExitModal } from "@/components/navigation/navigation-exit-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigationExitGuard } from "@/hooks/use-navigation-exit-guard";
import { usePantallaDespierta } from "@/hooks/use-pantalla-despierta";
import { triggerTapHaptic } from "@/lib/haptics";
import {
  DEVIATION_THRESHOLD_METERS,
  getDistanceToRouteMeters,
  getGpsErrorMessage,
  type GpsStatus,
} from "@/lib/navigation";
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

export function NavegacionView({ rutaId }: NavegacionViewProps) {
  const salida = `/rutas/${rutaId}`;
  const { open, requestExit, cancelExit, confirmExit } =
    useNavigationExitGuard(salida);

  const vigilanciaRef = useRef<number | null>(null);
  const [recorrido, setRecorrido] = useState<FeatureCollection | null>(null);
  const [nombre, setNombre] = useState("Ruta");
  const [rectangulo, setRectangulo] = useState<Rectangulo | null>(null);
  const [anotaciones, setAnotaciones] = useState<Anotacion[]>([]);
  const [cargandoRecorrido, setCargandoRecorrido] = useState(true);
  const [estadoDelGps, setEstadoDelGps] = useState<GpsStatus>("idle");
  const [errorDelGps, setErrorDelGps] = useState<string | null>(null);
  const [posicion, setPosicion] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [ultimaNoticia, setUltimaNoticia] = useState<number | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());
  const [metrosDeDesvio, setMetrosDeDesvio] = useState<number | null>(null);

  usePantallaDespierta(estadoDelGps === "active");

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
        const sectoresQueLaCruzan = (paquete?.sectores ?? [])
          .filter(
            (sector) =>
              ruta.rectangulo.latSur <= sector.rectangulo.latNorte &&
              ruta.rectangulo.latNorte >= sector.rectangulo.latSur &&
              ruta.rectangulo.lonOeste <= sector.rectangulo.lonEste &&
              ruta.rectangulo.lonEste >= sector.rectangulo.lonOeste,
          )
          .map((sector) => sector.id);

        setAnotaciones(
          (paquete?.anotaciones ?? []).filter((anotacion) =>
            sectoresQueLaCruzan.includes(anotacion.sectorId),
          ),
        );
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
    if (estadoDelGps !== "active") return;
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
      setEstadoDelGps("unavailable");
      return;
    }

    setEstadoDelGps("requesting");
    setErrorDelGps(null);

    if (vigilanciaRef.current !== null) {
      navigator.geolocation.clearWatch(vigilanciaRef.current);
    }

    vigilanciaRef.current = navigator.geolocation.watchPosition(
      (lectura) => {
        const lat = lectura.coords.latitude;
        const lon = lectura.coords.longitude;

        setPosicion({ lat, lon });
        setEstadoDelGps("active");
        setUltimaNoticia(Date.now());
        setAhora(Date.now());

        if (recorrido) {
          setMetrosDeDesvio(getDistanceToRouteMeters(lat, lon, recorrido));
        }
      },
      (error) => {
        setErrorDelGps(getGpsErrorMessage(error));
        setEstadoDelGps(
          error.code === error.PERMISSION_DENIED ? "denied" : "unavailable",
        );
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );
  }, [recorrido]);

  const estoyFueraDeRuta =
    estadoDelGps === "active" &&
    metrosDeDesvio !== null &&
    metrosDeDesvio > DEVIATION_THRESHOLD_METERS;

  // Avisar vibrando: yendo por el sendero, nadie está mirando la pantalla.
  useEffect(() => {
    if (estoyFueraDeRuta) triggerTapHaptic(220);
  }, [estoyFueraDeRuta]);

  const segundosSinNoticias =
    ultimaNoticia === null ? 0 : Math.round((ahora - ultimaNoticia) / 1000);

  const posicionVieja =
    estadoDelGps === "active" &&
    segundosSinNoticias > SEGUNDOS_PARA_AVISAR_POSICION_VIEJA;

  if (cargandoRecorrido) {
    return (
      <Card className="py-8 text-center text-base text-muted">
        Abriendo la ruta…
      </Card>
    );
  }

  if (!recorrido) {
    return (
      <Card accent className="space-y-3">
        <p role="alert" className="text-base leading-6 text-red-300">
          Esta ruta no está guardada en el celular, así que no se puede navegar
          sin señal.
        </p>
        <p className="text-sm leading-6 text-slate-400">
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
            <h1 className="truncate text-lg font-bold text-foreground">
              {nombre}
            </h1>
            <p className="text-sm text-muted">Navegando sin conexión</p>
          </div>

          <button
            type="button"
            onClick={() => requestExit()}
            onPointerDown={() => triggerTapHaptic()}
            aria-label="Salir de la navegación"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-2xl text-muted hover:bg-surface-elevated hover:text-foreground"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border">
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
            className="rounded-xl bg-red-950/70 px-3 py-3 text-center text-lg font-bold text-red-200 ring-1 ring-red-800/60"
          >
            Fuera de ruta
          </div>
        ) : null}

        {posicionVieja ? (
          <div
            role="alert"
            className="rounded-xl border border-amber-600/40 bg-amber-950/30 px-3 py-2 text-center text-sm text-amber-200"
          >
            Hace {segundosSinNoticias} segundos que el GPS no da novedades. Tu
            punto puede estar desactualizado.
          </div>
        ) : null}

        <div className="space-y-2">
          {estadoDelGps === "idle" || estadoDelGps === "requesting" ? (
            <Button
              anchoCompleto
              paraNavegacion
              disabled={estadoDelGps === "requesting"}
              onClick={prenderGps}
            >
              {estadoDelGps === "requesting" ? "Prendiendo el GPS…" : "Prender el GPS"}
            </Button>
          ) : null}

          {errorDelGps ? (
            <p role="alert" className="text-base leading-6 text-red-400">
              {errorDelGps}
            </p>
          ) : null}

          {estadoDelGps === "active" && metrosDeDesvio !== null ? (
            <p className="text-center text-base text-muted">
              {metrosDeDesvio <= DEVIATION_THRESHOLD_METERS
                ? `Vas por la ruta · a ${Math.round(metrosDeDesvio)} m de la línea`
                : `Te desviaste ${Math.round(metrosDeDesvio)} m de la línea`}
            </p>
          ) : null}
        </div>
      </div>

      <NavigationExitModal
        open={open}
        onCancel={cancelExit}
        onConfirm={confirmExit}
      />
    </>
  );
}
