"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { usePuedeAdministrar } from "@/hooks/use-puede-administrar";
import { ListaDeZonas } from "@/components/zonas/lista-de-zonas";
import { MapaGeneralDeZonas } from "@/components/zonas/mapa-general-de-zonas";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { sectoresPorZona } from "@/lib/mapas/general";

type Propiedades = { soyAdministrador: boolean };
type Pestana = "zonas" | "mapa";

/** El módulo Mapas: lista de zonas y vista general de Córdoba. */
export function PantallaDeZonas({ soyAdministrador }: Propiedades) {
  const puedeAdministrar = usePuedeAdministrar(soyAdministrador);
  const { paquete, estado, aviso } = useDatosDeLaApp();
  const [pestana, setPestana] = useState<Pestana>("mapa");

  const zonas = useMemo(() => paquete?.zonas ?? [], [paquete]);
  const sectores = useMemo(() => paquete?.sectores ?? [], [paquete]);
  const anotaciones = useMemo(() => paquete?.anotaciones ?? [], [paquete]);
  const cantidades = useMemo(() => sectoresPorZona(sectores), [sectores]);

  const alMoverEntrePestanas = (evento: KeyboardEvent<HTMLDivElement>) => {
    const siguiente = evento.key === "ArrowRight" || evento.key === "ArrowLeft"
      ? pestana === "mapa" ? "zonas" : "mapa"
      : evento.key === "End"
        ? "mapa"
        : evento.key === "Home"
          ? "zonas"
          : null;
    if (!siguiente) return;
    evento.preventDefault();
    setPestana(siguiente);
    evento.currentTarget.querySelector<HTMLButtonElement>(`#pestana-${siguiente}`)?.focus();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold uppercase text-texto">Mapas</h1>
      <div role="tablist" aria-label="Vistas de mapas" className="flex gap-2" onKeyDown={alMoverEntrePestanas}>
        <Boton role="tab" id="pestana-zonas" aria-controls="panel-zonas" aria-selected={pestana === "zonas"}
          tabIndex={pestana === "zonas" ? 0 : -1}
          variante={pestana === "zonas" ? "principal" : "fantasma"} onClick={() => setPestana("zonas")}>
          Zonas
        </Boton>
        <Boton role="tab" id="pestana-mapa" aria-controls="panel-mapa" aria-selected={pestana === "mapa"}
          tabIndex={pestana === "mapa" ? 0 : -1}
          variante={pestana === "mapa" ? "principal" : "fantasma"} onClick={() => setPestana("mapa")}>
          Mapa
        </Boton>
      </div>

      {estado === "abriendo" ? (
        <Tarjeta className="py-8 text-center text-base text-texto-suave">
          <p role="status">Abriendo los mapas…</p>
        </Tarjeta>
      ) : estado === "sin_datos" ? (
        <Tarjeta franja="ambar" className="space-y-2">
          <p className="text-base font-medium text-texto">Todavía no hay nada guardado en este celular.</p>
          <p role="alert" className="text-base leading-6 text-texto-suave">
            {aviso ?? "Conectate a internet una vez para ver las zonas y los puntos guardados."}
          </p>
        </Tarjeta>
      ) : (
        <>
          {estado === "incompleto" && aviso ? (
            <Tarjeta franja="ambar">
              <p role="alert" className="text-base leading-6 text-ambar-texto">
                Los mapas pueden estar incompletos: {aviso}. Recargá para intentar de nuevo.
              </p>
            </Tarjeta>
          ) : null}
          {pestana === "zonas" ? (
            <div role="tabpanel" id="panel-zonas" aria-labelledby="pestana-zonas" className="max-w-3xl">
              {estado === "sin_senal" ? (
                <Tarjeta className="mb-4">
                  <p className="text-base text-texto-suave">Sin señal. Estás viendo lo último que quedó guardado en el celular.</p>
                </Tarjeta>
              ) : null}
              <ListaDeZonas zonas={zonas} soyAdministrador={puedeAdministrar}
                sectoresPorZona={cantidades} />
            </div>
          ) : (
            <div role="tabpanel" id="panel-mapa" aria-labelledby="pestana-mapa">
              <MapaGeneralDeZonas zonas={zonas} anotaciones={anotaciones} sectoresPorZona={cantidades} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
