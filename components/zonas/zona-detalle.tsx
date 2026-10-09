"use client";

import { useState } from "react";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { usePuedeAdministrar } from "@/hooks/use-puede-administrar";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { TarjetaDeSector } from "@/components/zonas/tarjeta-de-sector";
import { BotonVolver } from "@/components/ui/boton-volver";
import { Tarjeta } from "@/components/ui/tarjeta";
import { sectoresEnElMapa } from "@/lib/mapas/rectangulos";
import { mostrarTamano } from "@/lib/territorio/tamano";
import { useDibujosDeCircuitos } from "@/hooks/use-dibujos-de-circuitos";
import { SelectorDeCircuitosEnMapa } from "@/components/zonas/selector-de-circuitos-en-mapa";
import { circuitosDeLaZona as circuitosDeLaZonaEnElPaquete } from "@/lib/navegacion/mapa-libre";
import { anotacionesParaMapaDelLugar } from "@/lib/anotaciones/lugar";

/**
 * Una zona con sus sectores.
 *
 * Lo que importa acá no es la lista: es **cuánto de la zona todavía no tiene
 * sector encima**. Ese hueco es lo que después deja un Circuito sin mapa, y se
 * tiene que ver en casa, no en el cerro.
 */

type ZonaDetalleProps = {
  zonaId: number;
  miPerfilId: string | null;
};

export function ZonaDetalle({ zonaId, miPerfilId }: ZonaDetalleProps) {
  const { paquete, estado } = useDatosDeLaApp();
  const puedeAdministrar = usePuedeAdministrar(miPerfilId !== null);

  const zona = paquete?.zonas.find((cada) => cada.id === zonaId) ?? null;
  const todosLosSectores = paquete?.sectores ?? [];
  const anotaciones = paquete?.anotaciones ?? [];
  const sectores = todosLosSectores.filter(
    (sector) => sector.zonaId === zonaId,
  );

  /**
   * Los Circuitos que pasan por la zona se piden **antes de los carteles de
   * abajo**: abriendo en frío, el paquete todavía no está y la pantalla sale
   * por el cartel de «abriendo». Pedirlos después de ese cartel hace que en el
   * primer dibujado no se pidan y en el segundo sí, y React rompe la pantalla.
   */
  const circuitosDeLaZona = zona ? circuitosDeLaZonaEnElPaquete(paquete?.circuitos ?? [], sectores, zona.rectangulo) : [];
  const [idsEncendidos, setIdsEncendidos] = useState<number[]>([]);
  const alternarCircuito = (id: number) => setIdsEncendidos((antes) =>
    antes.includes(id) ? antes.filter((cada) => cada !== id) : [...antes, id]);
  const circuitosPrendidos = useDibujosDeCircuitos(circuitosDeLaZona, idsEncendidos);

  if (estado === "abriendo") {
    return (
      <Tarjeta className="py-8 text-center text-base text-texto-suave">
        Abriendo la zona…
      </Tarjeta>
    );
  }

  if (!zona) {
    return (
      <Tarjeta franja="rojo" className="space-y-3">
        <p role="alert" className="text-base leading-6 text-rojo-texto">
          Esta zona no está en el celular. Puede que la hayan borrado, o que
          todavía no se haya guardado acá.
        </p>
        <BotonVolver
          destinoSiNoHayVuelta="/zonas"
          etiqueta="Volver a las zonas"
        />
      </Tarjeta>
    );
  }

  const soyElAutor = puedeAdministrar && miPerfilId === zona.perfilId;

  const anotacionesDelMapa = anotacionesParaMapaDelLugar(anotaciones, sectores, zona.rectangulo);

  return (
    <div className="space-y-5">
      {estado === "sin_senal" ? (
        <Tarjeta>
          <p className="text-sm font-medium text-texto-suave">
            Sin señal. Estás viendo lo último que quedó guardado en el celular.
          </p>
        </Tarjeta>
      ) : null}

      <div className={`relative ${zona.fotoUrl ? "overflow-hidden rounded-2xl bg-superficie-alta p-4 sm:p-5" : ""}`}>
        {zona.fotoUrl ? (
          <>
            <img
              src={zona.fotoUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/20 to-transparent" />
          </>
        ) : null}

        <div className={`relative z-10 flex items-center gap-3 ${zona.fotoUrl ? "mb-4" : ""}`}>
          <BotonVolver
            destinoSiNoHayVuelta="/zonas"
            etiqueta="Volver a las zonas"
            className={zona.fotoUrl ? "[&>span]:bg-black/40 [&>span]:text-white [&>span]:border-white/30" : ""}
          />
          <h1 className={`min-w-0 flex-1 truncate text-2xl font-bold uppercase ${zona.fotoUrl ? "text-white drop-shadow-md" : "text-texto"}`}>
            {zona.nombre}
          </h1>
        </div>

        <div className={`relative z-10 mt-5 px-1 text-sm ${zona.fotoUrl ? "text-slate-200 drop-shadow-sm" : "text-texto-suave"}`}>
          {zona.descripcion ? (
            <p className="whitespace-pre-wrap break-words mb-2 text-base">
              {zona.descripcion}
            </p>
          ) : null}
          <p>Le da a la zona: <span className={`font-semibold ${zona.fotoUrl ? "text-white drop-shadow-sm" : "text-texto"}`}>{mostrarTamano(zona.rectangulo)}</span></p>
        </div>
      </div>

      <Tarjeta className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
          Dónde queda
        </h2>
        <CargadorDeMapa
          enVivo
          consultaGoogle
          principal
          otrosCircuitos={circuitosPrendidos}
          controlesAdicionales={
            <SelectorDeCircuitosEnMapa
              circuitos={circuitosDeLaZona}
              idsEncendidos={idsEncendidos}
              alternar={alternarCircuito}
            />
          }
          anotaciones={anotacionesDelMapa}
          encuadre={zona.rectangulo}
          rectangulos={[
            { rectangulo: zona.rectangulo, clase: "zona" },
            ...sectoresEnElMapa(sectores),
          ]}
        />
        <p className="text-sm leading-6 text-texto-suave">
          {sectores.length === 0
            ? "El recuadro es la zona. Todavía no tiene ningún sector encima."
            : `El recuadro grande es la zona; los de adentro, sus ${sectores.length === 1 ? "sector" : `${sectores.length} sectores`}.`}
        </p>
      </Tarjeta>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between gap-3 px-1">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
            {sectores.length === 0
              ? "Sectores"
              : `Sectores (${sectores.length})`}
          </h2>
        </div>

        {sectores.length === 0 ? null : (
          <div className="space-y-3">
            {sectores.map((sector) => (
              <TarjetaDeSector
                key={sector.id}
                sector={sector}
                todosLosSectores={todosLosSectores}
                soyAdministrador={puedeAdministrar && miPerfilId === sector.perfilId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
