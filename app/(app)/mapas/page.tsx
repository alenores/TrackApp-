"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { useMapasBajados } from "@/hooks/use-mapa-del-sector";
import { borrarElMapaDelSector, mostrarPeso } from "@/lib/mapas/descarga";
import { claveDeMapa, NOMBRE_DEL_TIPO, type TipoDeMapa } from "@/lib/offline/mapas";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { useDialogos } from "@/components/ui/dialogos";

export default function PantallaDeMapas() {
  const { paquete, estado, aviso } = useDatosDeLaApp();
  const mapas = useMapasBajados();
  const { confirmar, avisar } = useDialogos();
  /** El mapa que se está borrando, con `claveDeMapa`: un sector puede tener dos. */
  const [borrando, setBorrando] = useState<string | null>(null);

  const sectores = paquete?.sectores ?? [];
  const zonas = paquete?.zonas ?? [];

  // Armamos la lista cruzando lo guardado en el celular con lo que vino de la base
  const mapasConInfo = useMemo(() => {
    return mapas
      .map((mapa) => {
        const sector = sectores.find((s) => s.id === mapa.sectorId);
        const zona = sector ? zonas.find((z) => z.id === sector.zonaId) : undefined;
        return {
          ...mapa,
          nombreSector: sector?.nombre ?? "Sector desconocido",
          nombreZona: zona?.nombre ?? "Zona desconocida",
          zonaNombre: zona?.nombre ?? "",
          sectorNombre: sector?.nombre ?? "",
        };
      })
      .sort((a, b) => {
        // Ordenar por nombre de Zona y luego por nombre de Sector
        const difZona = a.zonaNombre.localeCompare(b.zonaNombre);
        if (difZona !== 0) return difZona;
        const difSector = a.sectorNombre.localeCompare(b.sectorNombre);
        if (difSector !== 0) return difSector;
        return a.tipo.localeCompare(b.tipo);
      });
  }, [mapas, sectores, zonas]);

  const pesoTotal = useMemo(
    () => mapas.reduce((total, mapa) => total + mapa.bytes, 0),
    [mapas]
  );

  const handleBorrar = async (sectorId: number, tipo: TipoDeMapa, nombreSector: string) => {
    const seguro = await confirmar({
      titulo: "¿Borrar este mapa?",
      mensaje: `El mapa ${tipo} de "${nombreSector}" se va a borrar de tu celular para liberar espacio. Vas a necesitar señal para volver a bajarlo.`,
      textoDeAceptar: "Borrar mapa",
      destructivo: true,
    });

    if (!seguro) return;

    setBorrando(claveDeMapa(sectorId, tipo));
    try {
      const resultado = await borrarElMapaDelSector(sectorId, sectores, tipo);
      if (!resultado.ok) {
        await avisar({
          titulo: "No se pudo borrar del todo",
          mensaje: resultado.motivo,
        });
      }
    } finally {
      setBorrando(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/fondo-mapas-sierras.webp"
          alt="Fondo de mapas"
          fill
          className="object-cover object-center opacity-30"
          priority
        />
      </div>
      <div className="flex flex-col gap-3 max-w-2xl mx-auto p-4 md:p-6 lg:p-8 w-full relative z-10">
        <div>
        <h1 className="min-w-0 flex-1 truncate text-2xl font-bold uppercase text-texto">
          Mapas descargados
        </h1>
      </div>

      {estado === "abriendo" ? (
        <Tarjeta className="py-8 text-center text-base text-texto-suave">
          Abriendo los mapas…
        </Tarjeta>
      ) : estado === "sin_datos" ? (
        <Tarjeta franja="ambar" className="space-y-2">
          <p className="text-base font-medium text-texto">
            Todavía no hay nada guardado en este celular.
          </p>
          <p className="text-sm leading-6 text-texto-suave">
            {aviso ??
              "Conectate a internet una vez y los mapas quedarán guardados para usarlos sin señal."}
          </p>
        </Tarjeta>
      ) : mapas.length === 0 ? (
        <Tarjeta className="text-center py-10">
          <p className="text-texto-suave font-medium">
            No tenés ningún mapa descargado en este celular.
          </p>
          <p className="text-sm text-texto-suave mt-2">
            Los mapas que bajes para usar sin señal van a aparecer acá.
          </p>
        </Tarjeta>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-2">
            <Tarjeta tono="alta" className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
                Mapas guardados
              </p>
              <p className="text-2xl font-bold tabular-nums text-texto">
                {mapas.length}
              </p>
            </Tarjeta>
            <Tarjeta tono="alta" className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
                Espacio usado
              </p>
              <p className="text-2xl font-bold tabular-nums text-texto">
                {mostrarPeso(pesoTotal)}
              </p>
            </Tarjeta>
          </div>

          <div className="space-y-3">
            {mapasConInfo.map((mapa) => {
              const clave = claveDeMapa(mapa.sectorId, mapa.tipo);
              const estaBorrando = borrando === clave;
              
              return (
                <Tarjeta key={clave} className="relative pr-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="absolute right-2 top-2">
                    <button
                      type="button"
                      disabled={estaBorrando || borrando !== null}
                      onClick={() => handleBorrar(mapa.sectorId, mapa.tipo, mapa.nombreSector)}
                      className="p-2 text-rojo-texto hover:bg-rojo-fondo rounded-lg transition-colors disabled:opacity-50"
                      aria-label="Borrar mapa"
                      title="Borrar mapa"
                    >
                      {estaBorrando ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-rojo-texto border-t-transparent" />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M3 6h18" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-texto">
                      {mapa.nombreSector}
                    </p>
                    <p className="truncate text-sm text-texto-suave">
                      {mapa.nombreZona}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs font-medium text-texto-suave">
                      <span className="bg-fondo border border-borde-suave rounded-md px-2 py-1">
                        {NOMBRE_DEL_TIPO[mapa.tipo]}
                      </span>
                      <span className="bg-fondo border border-borde-suave rounded-md px-2 py-1 tabular-nums">
                        {mostrarPeso(mapa.bytes)}
                      </span>
                    </div>
                  </div>
                </Tarjeta>
              );
            })}
          </div>
        </>
      )}
    </div>
    </>
  );
}
