"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Boton } from "@/components/ui/boton";
import { Enlace } from "@/components/ui/enlace";
import { Tarjeta } from "@/components/ui/tarjeta";
import { FiltrosDeSalidas } from "@/components/salidas/filtros-de-salidas";
import { CalendarioDeSalidas } from "@/components/salidas/calendario-de-salidas";
import { AvisoDeRegistros } from "@/components/salidas/aviso-de-registros";
import { BotonRedondo } from "@/components/ui/boton-redondo";
import { TarjetaDeSalida } from "@/components/salidas/tarjeta-de-salida";
import { useHaySenal } from "@/hooks/use-hay-senal";
import type { PaginaDeSalidas } from "@/lib/salidas/datos";
import {
  direccionDeSalidas,
  filtrosPuestos,
  type FiltrosDeSalidas as Filtros,
} from "@/lib/salidas/filtros";
import type { PerfilBreve } from "@/types/database";

/**
 * La lista de salidas.
 *
 * **Salidas es 100 % con internet.** La lista llega armada del servidor, con
 * los filtros ya aplicados por la base; acá solo se dibuja. Si la señal se va
 * con la pantalla abierta, lo que ya se ve queda a la vista y desaparecen las
 * acciones que necesitan internet.
 *
 * Cargar una salida es el botón «+» flotante, que pone el armazón.
 */

type Props = {
  miPerfilId: string | null;
  resultado: PaginaDeSalidas;
  filtros: Filtros;
  /** Los usuarios, para filtrar por quién fue y nombrar los filtros puestos. */
  perfiles: PerfilBreve[];
};

export function PantallaDeSalidas({ miPerfilId, resultado, filtros, perfiles }: Props) {
  const router = useRouter();
  const haySenal = useHaySenal();
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  const diaElegido = filtros.desde && filtros.desde === filtros.hasta ? filtros.desde : null;

  const nombreDe = (perfilId: string) =>
    perfiles.find((perfil) => perfil.id === perfilId)?.nombre ?? "alguien que ya no está";
  const puestos = filtrosPuestos(filtros, nombreDe);
  const hayFiltros = puestos.length > 0;

  return (
    <div className="space-y-4 pb-16">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold uppercase text-texto">Salidas</h1>
        {haySenal ? (
          <div className="flex items-center gap-2">
            <BotonRedondo etiqueta="Ver los días con salidas" onClick={() => setCalendarioAbierto(true)}>
              <path d="M7 3v3M17 3v3M4 9h16M5 5.5h14a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" />
            </BotonRedondo>
            <Boton
              variante={hayFiltros ? "principal" : "secundario"}
              onClick={() => setFiltrosAbiertos(true)}
              aria-label={hayFiltros ? `Filtrar, ${puestos.length} puestos` : "Filtrar"}
            >
              {hayFiltros ? `Filtrar (${puestos.length})` : "Filtrar"}
            </Boton>
          </div>
        ) : null}
      </div>

      {hayFiltros ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Filtros puestos">
          {puestos.map((puesto) => (
            <li key={puesto.clave}>
              <span className="inline-flex h-10 items-center gap-1 rounded-full border border-acento-borde bg-verde-fondo pl-3.5 text-sm font-semibold text-verde-texto">
                {puesto.etiqueta}
                <Enlace
                  href={direccionDeSalidas(puesto.sinEste)}
                  aria-label={`Sacar el filtro ${puesto.etiqueta}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-lg leading-none hover:bg-superficie-alta"
                >
                  ×
                </Enlace>
              </span>
            </li>
          ))}
          <li>
            <Enlace href="/salidas" variante="secundario" className="rounded-full">
              Limpiar todo
            </Enlace>
          </li>
        </ul>
      ) : null}

      <AvisoDeRegistros />

      {!haySenal ? (
        <Tarjeta franja="ambar">
          <p className="text-base leading-6 text-texto">
            Sin señal. Salidas funciona solo con internet: lo que ves se cargó antes de
            perderla. Para cargar, editar o filtrar, esperá a tener señal.
          </p>
        </Tarjeta>
      ) : null}

      {!resultado.ok ? (
        <Tarjeta franja="rojo" className="space-y-3">
          <p role="alert" className="text-base leading-6 text-texto">
            No se pudo traer la lista de salidas: {resultado.motivo}
          </p>
          <Boton variante="secundario" onClick={() => router.refresh()}>
            Volver a intentar
          </Boton>
        </Tarjeta>
      ) : resultado.salidas.length === 0 ? (
        <Tarjeta>
          <p className="text-base leading-6 text-texto-suave">
            {hayFiltros
              ? "Ninguna salida cumple con todos los filtros. Sacá alguno para ver más."
              : resultado.pagina > 1
                ? "No hay salidas más antiguas."
                : "Todavía nadie cargó una salida. Cargá la primera con el botón «+» de abajo a la derecha."}
          </p>
        </Tarjeta>
      ) : (
        <ul className="space-y-4">
          {resultado.salidas.map((salida) => (
            <li key={salida.id}>
              <TarjetaDeSalida
                salida={salida}
                puedeEditar={haySenal && salida.perfil.id === miPerfilId}
              />
            </li>
          ))}
        </ul>
      )}

      {resultado.ok && (resultado.pagina > 1 || resultado.hayMas) ? (
        <div className="flex justify-between gap-3">
          {resultado.pagina > 1 ? (
            <Enlace href={direccionDeSalidas(filtros, resultado.pagina - 1)} variante="secundario">
              Más recientes
            </Enlace>
          ) : (
            <span />
          )}
          {resultado.hayMas ? (
            <Enlace href={direccionDeSalidas(filtros, resultado.pagina + 1)} variante="secundario">
              Más antiguas
            </Enlace>
          ) : null}
        </div>
      ) : null}

      <CalendarioDeSalidas
        abierto={calendarioAbierto}
        alCerrar={() => setCalendarioAbierto(false)}
        diaInicial={filtros.desde}
        diaElegido={diaElegido}
        alElegirDia={(dia) => {
          setCalendarioAbierto(false);
          router.push(direccionDeSalidas({ ...filtros, desde: dia, hasta: dia }));
        }}
      />

      <FiltrosDeSalidas
        abierto={filtrosAbiertos}
        alCerrar={() => setFiltrosAbiertos(false)}
        filtros={filtros}
        perfiles={perfiles}
        alAplicar={(elegidos) => {
          setFiltrosAbiertos(false);
          router.push(direccionDeSalidas(elegidos));
        }}
      />
    </div>
  );
}
