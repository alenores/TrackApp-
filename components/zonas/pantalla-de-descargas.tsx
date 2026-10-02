"use client";

import { useMemo, useState } from "react";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { useMapasBajados } from "@/hooks/use-mapa-del-sector";
import { borrarElMapaDelSector, mostrarPeso } from "@/lib/mapas/descarga";
import { claveDeMapa, NOMBRE_DEL_TIPO, type TipoDeMapa } from "@/lib/offline/mapas";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useDialogos } from "@/components/ui/dialogos";

/**
 * La pestaña Descargas de Mapas: los mapas que hay en este celular, cuánto
 * ocupan y cómo sacarlos.
 *
 * Lee solo lo guardado en el celular, así que anda sin señal. Sacar un mapa
 * también anda sin señal: libera el espacio de verdad y queda anotado para
 * avisarle a la base cuando vuelva la señal (decisión 021).
 *
 * Los carteles de «abriendo» y «sin datos» los pone la pantalla de Mapas.
 */
export function PantallaDeDescargas() {
  const { paquete } = useDatosDeLaApp();
  const mapas = useMapasBajados();
  const { confirmar, avisar } = useDialogos();
  /** El mapa que se está borrando, con `claveDeMapa`: un sector puede tener dos. */
  const [borrando, setBorrando] = useState<string | null>(null);

  const sectores = useMemo(() => paquete?.sectores ?? [], [paquete]);
  const zonas = useMemo(() => paquete?.zonas ?? [], [paquete]);

  const mapasConNombre = useMemo(
    () =>
      mapas
        .map((mapa) => {
          const sector = sectores.find((cada) => cada.id === mapa.sectorId);
          const zona = sector ? zonas.find((cada) => cada.id === sector.zonaId) : undefined;
          return {
            ...mapa,
            nombreDelSector: sector?.nombre ?? "Un sector que ya no existe",
            nombreDeLaZona: zona?.nombre ?? "",
          };
        })
        .sort(
          (a, b) =>
            a.nombreDeLaZona.localeCompare(b.nombreDeLaZona) ||
            a.nombreDelSector.localeCompare(b.nombreDelSector) ||
            a.tipo.localeCompare(b.tipo),
        ),
    [mapas, sectores, zonas],
  );

  const pesoTotal = useMemo(() => mapas.reduce((total, mapa) => total + mapa.bytes, 0), [mapas]);

  const alBorrar = async (sectorId: number, tipo: TipoDeMapa, nombreDelSector: string) => {
    const seguro = await confirmar({
      titulo: "¿Sacar este mapa del celular?",
      mensaje: `El mapa ${NOMBRE_DEL_TIPO[tipo].toLowerCase()} de «${nombreDelSector}» se borra del celular y libera su espacio. Para volver a tenerlo vas a necesitar señal.`,
      textoDeAceptar: "Sacar el mapa",
      destructivo: true,
    });
    if (!seguro) return;

    setBorrando(claveDeMapa(sectorId, tipo));
    try {
      const resultado = await borrarElMapaDelSector(sectorId, sectores, tipo);
      if (!resultado.ok) {
        await avisar({ titulo: "El mapa no se sacó del todo", mensaje: resultado.motivo });
      }
    } finally {
      setBorrando(null);
    }
  };

  if (mapas.length === 0) {
    return (
      <Tarjeta className="space-y-1">
        <p className="text-base font-medium text-texto">No tenés ningún mapa bajado en este celular.</p>
        <p className="text-base leading-6 text-texto-suave">
          Los mapas que bajes desde una ruta o un sector para usar sin señal aparecen acá.
        </p>
      </Tarjeta>
    );
  }

  return (
    <div className="max-w-2xl space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Tarjeta tono="alta" className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">Mapas bajados</p>
          <p className="text-2xl font-bold tabular-nums text-texto">{mapas.length}</p>
        </Tarjeta>
        <Tarjeta tono="alta" className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">Espacio usado</p>
          <p className="text-2xl font-bold tabular-nums text-texto">{mostrarPeso(pesoTotal)}</p>
        </Tarjeta>
      </div>

      <ul className="space-y-3">
        {mapasConNombre.map((mapa) => {
          const clave = claveDeMapa(mapa.sectorId, mapa.tipo);
          return (
            <li key={clave}>
              <Tarjeta className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-texto">{mapa.nombreDelSector}</p>
                  {mapa.nombreDeLaZona ? (
                    <p className="truncate text-sm text-texto-suave">{mapa.nombreDeLaZona}</p>
                  ) : null}
                  <p className="mt-1 text-sm text-texto-suave">
                    {NOMBRE_DEL_TIPO[mapa.tipo]} · <span className="tabular-nums">{mostrarPeso(mapa.bytes)}</span>
                  </p>
                </div>
                <Boton
                  variante="destructivo"
                  disabled={borrando !== null}
                  onClick={() => void alBorrar(mapa.sectorId, mapa.tipo, mapa.nombreDelSector)}
                >
                  {borrando === clave ? "Sacando…" : "Sacar"}
                </Boton>
              </Tarjeta>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
