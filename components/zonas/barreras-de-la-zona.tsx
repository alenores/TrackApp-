"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { traerTranquerasYAlambradosDeLaZona } from "@/app/actions/territorio";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { ponerAlDiaDespuesDeGuardar } from "@/lib/offline/puesta-al-dia";

/**
 * Después de guardar una zona nueva o agrandada, la app trae sola las
 * tranqueras y los alambrados de OpenStreetMap (decisión 052). Nadie lo pide:
 * esto solo cuenta qué está pasando y cómo terminó.
 *
 * Si OpenStreetMap no contesta se dice acá, en casa y con señal, con el
 * motivo y para reintentar: en el cerro no hay sorpresas.
 */
type Etapa = { clase: "trayendo" } | { clase: "listo"; resumen: string } | { clase: "fallo"; motivo: string };

export function BarrerasDeLaZona({ zonaId, alSeguir }: { zonaId: number; alSeguir: () => void }) {
  const [etapa, setEtapa] = useState<Etapa>({ clase: "trayendo" });
  const pidio = useRef(false);

  const traer = useCallback(async () => {
    setEtapa({ clase: "trayendo" });
    try {
      const resultado = await traerTranquerasYAlambradosDeLaZona(zonaId);
      if (!resultado.ok) {
        setEtapa({ clase: "fallo", motivo: resultado.error });
        return;
      }
      await ponerAlDiaDespuesDeGuardar();
      setEtapa({ clase: "listo", resumen: resultado.datos.resumen });
    } catch (causa) {
      setEtapa({ clase: "fallo", motivo: `No se trajeron las tranqueras ni los alambrados: ${causa instanceof Error ? causa.message : String(causa)}. Revisá la señal.` });
    }
  }, [zonaId]);

  useEffect(() => {
    if (pidio.current) return;
    pidio.current = true;
    void traer();
  }, [traer]);

  if (etapa.clase === "trayendo") {
    return (
      <Tarjeta className="space-y-2">
        <p role="status" className="text-base font-medium text-texto">La zona quedó guardada.</p>
        <p className="text-base text-texto-suave">Trayendo las tranqueras y los alambrados de OpenStreetMap… Puede tardar un minuto.</p>
      </Tarjeta>
    );
  }
  if (etapa.clase === "listo") {
    return (
      <Tarjeta franja="verde" className="space-y-3">
        <p role="status" className="text-base text-texto">La zona quedó guardada. {etapa.resumen}</p>
        <Boton anchoCompleto onClick={alSeguir}>Ir a la zona</Boton>
      </Tarjeta>
    );
  }
  return (
    <Tarjeta franja="ambar" className="space-y-3">
      <p role="alert" className="text-base text-texto">La zona quedó guardada, pero faltan las tranqueras y los alambrados. {etapa.motivo}</p>
      <p className="text-base text-texto-suave">Reintentá ahora, con señal: sin esto, en el cerro no vas a ver las tranqueras de OpenStreetMap.</p>
      <div className="flex gap-2">
        <Boton anchoCompleto onClick={() => void traer()}>Reintentar</Boton>
        <Boton variante="secundario" anchoCompleto onClick={alSeguir}>Seguir sin ellas</Boton>
      </div>
    </Tarjeta>
  );
}
