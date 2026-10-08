"use client";

import { useEffect, useMemo, useState } from "react";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import type { TipoDeFondo } from "@/components/mapa/capas-base";
import { ModalDeSalida } from "@/components/navegacion/modal-de-salida";
import { Boton } from "@/components/ui/boton";
import { BotonRedondo, ICONOS_DEL_CERRO } from "@/components/ui/boton-redondo";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useGps } from "@/hooks/use-gps";
import { usePantallaDespierta } from "@/hooks/use-pantalla-despierta";
import { useSalidaDeNavegacion } from "@/hooks/use-salida-de-navegacion";
import { useMapasBajados } from "@/hooks/use-mapa-del-sector";
import { usePaqueteGuardado } from "@/hooks/use-paquete-guardado";
import { seSuperponen } from "@/lib/datos/rectangulo";
import { leerCircuitoPreparado, type CircuitoPreparado } from "@/lib/offline/circuitos";

/** En esta pantalla no hay pedidos a la base. El GPS y el mapa leen el celular. */
export function NavegacionDeCircuito({ circuitoId }: { circuitoId: number }) {
  const paquete = usePaqueteGuardado();
  const ficha = paquete?.circuitos.find((cada) => cada.id === circuitoId) ?? null;
  const [preparado, setPreparado] = useState<CircuitoPreparado | null>(null);
  const [cargando, setCargando] = useState(true);
  const [centrarGps, setCentrarGps] = useState(0);
  const { open, requestExit, cancelExit, confirmExit } = useSalidaDeNavegacion("/circuitos");
  const gps = useGps();
  const prenderGps = gps.prender;
  const mapasBajados = useMapasBajados();
  useEffect(() => { prenderGps(); }, [prenderGps]);
  usePantallaDespierta(gps.estado === "andando");

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

  const sectores = useMemo(() => ficha?.rectangulo
    ? (paquete?.sectores ?? []).filter((sector) => seSuperponen(sector.rectangulo, ficha.rectangulo!))
    : [], [ficha, paquete]);
  const fondosDisponibles: TipoDeFondo[] = [];
  if (mapasBajados.some((mapa) => sectores.some((sector) => sector.id === mapa.sectorId) && mapa.tipo === "simple")) {
    fondosDisponibles.push("dibujo");
  }
  if (mapasBajados.some((mapa) => sectores.some((sector) => sector.id === mapa.sectorId) && mapa.tipo === "satelital")) {
    fondosDisponibles.push("satelital");
  }

  if (cargando && ficha) return <Tarjeta><p role="status" className="text-lg text-texto">Abriendo el Circuito guardado…</p></Tarjeta>;
  if (!ficha || !preparado) return <Tarjeta franja="rojo" className="space-y-3">
    <p role="alert" className="text-lg text-texto">Este Circuito no quedó completo en el celular. Abrí la app con señal en casa para descargarlo antes de salir.</p>
    <Boton variante="secundario" onClick={() => requestExit()}>Volver</Boton>
    <ModalDeSalida open={open} onCancel={cancelExit} onConfirm={confirmExit} />
  </Tarjeta>;

  return <>
    <div className="fixed inset-0 z-50 flex flex-col bg-mapa-fondo">
      <div className="absolute inset-0">
        <CargadorDeMapa circuito={preparado.dibujo}
          finalConservadoDelCircuito={preparado.finalSeparado}
          miPosicion={gps.posicion ? { lat: gps.posicion.lat, lon: gps.posicion.lon } : null}
          encuadre={ficha.rectangulo} pantallaCompleta fondosDisponibles={fondosDisponibles}
          forzarCentradoEn={centrarGps} sinMapaDescargado={fondosDisponibles.length === 0} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 p-3 pb-safe-4">
        {gps.posicionVieja ? <p role="alert" className="pointer-events-auto rounded-xl border border-ambar-borde bg-ambar-fondo p-2 text-lg text-ambar-texto">
          Hace {gps.segundosSinNoticias} segundos que el GPS no da novedades. Tu punto puede estar desactualizado.
        </p> : null}
        {gps.estado === "pidiendo" ? <p role="status" className="pointer-events-auto rounded-xl border border-borde bg-superficie p-2 text-lg text-texto">
          Buscando tu posición con el GPS…
        </p> : null}
        {gps.error ? <p role="alert" className="pointer-events-auto rounded-xl border border-rojo-borde bg-superficie p-2 text-lg text-rojo-texto">{gps.error}</p> : null}
        <div className="pointer-events-auto flex items-center gap-2">
          <BotonRedondo etiqueta="Salir de la navegación" onClick={() => requestExit()}>{ICONOS_DEL_CERRO.salir}</BotonRedondo>
          <span className="flex-1" />
          <BotonRedondo etiqueta="Centrar en mi ubicación" onClick={() => setCentrarGps(Date.now())}>{ICONOS_DEL_CERRO.centrar}</BotonRedondo>
        </div>
      </div>
    </div>
    <ModalDeSalida open={open} onCancel={cancelExit} onConfirm={confirmExit} />
  </>;
}
