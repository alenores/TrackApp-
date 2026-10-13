"use client";

import { useState } from "react";
import { BotonDeEmergente, Emergente } from "@/components/ui/emergente";
import { Boton } from "@/components/ui/boton";
import { OpcionDeEmergente } from "@/components/ui/opcion-de-emergente";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { useMapasBajados } from "@/hooks/use-mapa-del-sector";
import { useBajarEnFila, type PendienteDeBajar } from "@/hooks/use-bajar-en-fila";
import { mostrarPeso, pesoAproximadoDelMapa } from "@/lib/mapas/descarga";
import { claveDeMapa, NOMBRE_DEL_TIPO, TIPOS_DE_MAPA } from "@/lib/offline/mapas";
import type { Sector } from "@/types/database";

/**
 * El título «Sectores / Mapas» de una zona y su «Descargar todo».
 *
 * Cada sector es un mapa que se puede descargar. «Descargar todo» pregunta
 * simple, satelital o ambos, y baja **solo lo que falta**, de a uno, igual que
 * bajarlos uno por uno. Decisión de Ale del 2026-10-13.
 */

type Eleccion = "simple" | "satelital" | "ambos";

const ETIQUETA: Record<Eleccion, string> = { simple: "Simple", satelital: "Satelital", ambos: "Ambos" };

export function SectoresYMapas({ sectores }: { sectores: Sector[] }) {
  const haySenal = useHaySenal();
  const bajados = useMapasBajados();
  const enElCelular = new Set(bajados.map((cada) => claveDeMapa(cada.sectorId, cada.tipo)));
  const [eligiendo, setEligiendo] = useState(false);
  const { bajando, fallo, terminados, bajarEstos } = useBajarEnFila();

  const faltan = (eleccion: Eleccion): PendienteDeBajar[] => {
    const tipos = eleccion === "ambos" ? [...TIPOS_DE_MAPA] : [eleccion];
    return sectores.flatMap((sector) => tipos
      .filter((tipo) => !enElCelular.has(claveDeMapa(sector.id, tipo)))
      .map((tipo) => ({ sector, tipo })));
  };
  const peso = (pendientes: PendienteDeBajar[]) =>
    pendientes.reduce((suma, { sector, tipo }) => suma + pesoAproximadoDelMapa(sector.rectangulo, undefined, tipo), 0);
  const queFalta = (pendientes: PendienteDeBajar[]) => {
    if (pendientes.length === 0) return "Ya están todos en el celular.";
    const cuantos = new Set(pendientes.map(({ sector }) => sector.id)).size;
    return `${cuantos === 1 ? "1 sector" : `${cuantos} sectores`} · ${mostrarPeso(peso(pendientes))}`;
  };

  const elegir = (eleccion: Eleccion) => {
    setEligiendo(false);
    void bajarEstos(faltan(eleccion));
  };

  // Sin señal no se puede bajar: el botón se va, la lista de sectores sigue.
  const mostrarBoton = haySenal && sectores.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
          {sectores.length === 0 ? "Sectores / Mapas" : `Sectores / Mapas (${sectores.length})`}
        </h2>
        {mostrarBoton ? (
          <Boton variante="secundario" disabled={bajando !== null} onClick={() => setEligiendo(true)}>
            Descargar todo
          </Boton>
        ) : null}
      </div>

      {bajando ? (
        <Tarjeta className="space-y-1">
          <p role="status" className="text-base text-texto">
            Bajando {bajando.numero} de {bajando.deCuantos}: «{bajando.nombre}», {NOMBRE_DEL_TIPO[bajando.tipo].toLowerCase()}
            {bajando.total > 0 ? ` · ${Math.floor((bajando.resueltos / bajando.total) * 100)} %` : "…"}
          </p>
          <p className="text-sm text-texto-suave">Podés seguir usando la app; no cierres esta pantalla hasta que termine.</p>
        </Tarjeta>
      ) : null}
      {fallo ? (
        <Tarjeta franja="rojo">
          <p role="alert" className="text-base leading-6 text-rojo-texto">
            «{fallo.nombre}» quedó a medio bajar: {fallo.motivo} Lo que entró queda guardado; tocá «Descargar todo» para seguir, tarda menos.
          </p>
        </Tarjeta>
      ) : null}
      {terminados !== null && !bajando && !fallo ? (
        <Tarjeta franja="verde">
          <p role="status" className="text-base text-texto">
            {terminados === 0 ? "No faltaba ningún mapa: ya estaban todos en el celular." : `Listo: ${terminados === 1 ? "se bajó 1 mapa" : `se bajaron ${terminados} mapas`}.`}
          </p>
        </Tarjeta>
      ) : null}

      <Emergente abierto={eligiendo} alCerrar={() => setEligiendo(false)}
        titulo="Descargar todos los mapas" descripcion="Se bajan solo los que te faltan, de a uno."
        acciones={<BotonDeEmergente onClick={() => setEligiendo(false)}>Cancelar</BotonDeEmergente>}>
        <div className="space-y-2">
          {(["simple", "satelital", "ambos"] as const).map((eleccion) => {
            const pendientes = faltan(eleccion);
            return <OpcionDeEmergente key={eleccion} titulo={ETIQUETA[eleccion]} detalle={queFalta(pendientes)}
              deshabilitada={pendientes.length === 0} alTocar={() => elegir(eleccion)} />;
          })}
        </div>
      </Emergente>
    </div>
  );
}
