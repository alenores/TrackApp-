"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { usePuedeAdministrar } from "@/hooks/use-puede-administrar";
import { ListaDeZonas } from "@/components/zonas/lista-de-zonas";
import { MapaGeneralDeZonas } from "@/components/zonas/mapa-general-de-zonas";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { sectoresPorZona } from "@/lib/mapas/general";
import { AnotacionesDeCordoba } from "@/components/anotaciones/anotaciones-de-cordoba";
import { PantallaDeDescargas } from "@/components/zonas/pantalla-de-descargas";

type Propiedades = { soyAdministrador: boolean; pestañaInicial?: Pestana };
type Pestana = "zonas" | "mapa" | "anotaciones" | "descargas";

/** El módulo Mapas: lista de zonas y vista general de Córdoba. */
export function PantallaDeZonas({ soyAdministrador, pestañaInicial = "mapa" }: Propiedades) {
  const puedeAdministrar = usePuedeAdministrar(soyAdministrador);
  const { paquete, estado, aviso } = useDatosDeLaApp();
  const [pestana, setPestana] = useState<Pestana>(pestañaInicial);
  const pestanaActiva = pestana === "anotaciones" && !puedeAdministrar ? "mapa" : pestana;

  const zonas = useMemo(() => paquete?.zonas ?? [], [paquete]);
  const sectores = useMemo(() => paquete?.sectores ?? [], [paquete]);
  const anotaciones = useMemo(() => paquete?.anotaciones ?? [], [paquete]);
  const cantidades = useMemo(() => sectoresPorZona(sectores), [sectores]);

  const alMoverEntrePestanas = (evento: KeyboardEvent<HTMLDivElement>) => {
    const pestanas: Pestana[] = puedeAdministrar ? ["zonas", "mapa", "anotaciones", "descargas"] : ["zonas", "mapa", "descargas"];
    const indice = pestanas.indexOf(pestanaActiva);
    const siguiente = evento.key === "ArrowRight"
      ? pestanas[(indice + 1) % pestanas.length]
      : evento.key === "ArrowLeft"
        ? pestanas[(indice - 1 + pestanas.length) % pestanas.length]
        : evento.key === "End"
          ? pestanas[pestanas.length - 1]
          : evento.key === "Home"
            ? pestanas[0]
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
        <Boton role="tab" id="pestana-zonas" aria-controls="panel-zonas" aria-selected={pestanaActiva === "zonas"}
          tabIndex={pestanaActiva === "zonas" ? 0 : -1}
          variante={pestanaActiva === "zonas" ? "principal" : "fantasma"} onClick={() => setPestana("zonas")}>
          Zonas
        </Boton>
        <Boton role="tab" id="pestana-mapa" aria-controls="panel-mapa" aria-selected={pestanaActiva === "mapa"}
          tabIndex={pestanaActiva === "mapa" ? 0 : -1}
          variante={pestanaActiva === "mapa" ? "principal" : "fantasma"} onClick={() => setPestana("mapa")}>
          Mapa
        </Boton>
        {puedeAdministrar ? (
          <Boton role="tab" id="pestana-anotaciones" aria-controls="panel-anotaciones" aria-selected={pestanaActiva === "anotaciones"}
            tabIndex={pestanaActiva === "anotaciones" ? 0 : -1}
            variante={pestanaActiva === "anotaciones" ? "principal" : "fantasma"} onClick={() => setPestana("anotaciones")}>
            Anotaciones
          </Boton>
        ) : null}
        <Boton role="tab" id="pestana-descargas" aria-controls="panel-descargas" aria-selected={pestanaActiva === "descargas"}
          tabIndex={pestanaActiva === "descargas" ? 0 : -1}
          variante={pestanaActiva === "descargas" ? "principal" : "fantasma"} onClick={() => setPestana("descargas")}>
          Descargas
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
            {aviso ?? "Conectate a internet una vez para ver las zonas y las anotaciones guardadas."}
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
          {pestanaActiva === "zonas" ? (
            <div role="tabpanel" id="panel-zonas" aria-labelledby="pestana-zonas" className="max-w-3xl">
              {estado === "sin_senal" ? (
                <Tarjeta className="mb-4">
                  <p className="text-base text-texto-suave">Sin señal. Estás viendo lo último que quedó guardado en el celular.</p>
                </Tarjeta>
              ) : null}
              <ListaDeZonas zonas={zonas} soyAdministrador={puedeAdministrar}
                sectoresPorZona={cantidades} />
            </div>
          ) : pestanaActiva === "mapa" ? (
            <div role="tabpanel" id="panel-mapa" aria-labelledby="pestana-mapa">
              <MapaGeneralDeZonas zonas={zonas} anotaciones={anotaciones} sectoresPorZona={cantidades} />
            </div>
          ) : pestanaActiva === "anotaciones" ? (
            <div role="tabpanel" id="panel-anotaciones" aria-labelledby="pestana-anotaciones">
              <AnotacionesDeCordoba soyAdministrador={puedeAdministrar} />
            </div>
          ) : (
            <div role="tabpanel" id="panel-descargas" aria-labelledby="pestana-descargas">
              <PantallaDeDescargas />
            </div>
          )}
        </>
      )}
    </div>
  );
}
