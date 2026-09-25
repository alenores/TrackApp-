"use client";

import Link from "next/link";
import { BajarLosMapasQueFaltan } from "@/components/rutas/bajar-los-mapas-que-faltan";
import { Tarjeta } from "@/components/ui/tarjeta";
import { coberturaCompleta, type Cobertura } from "@/lib/cobertura";
import { useHaySenal } from "@/hooks/use-hay-senal";
import type { Zona } from "@/types/database";

/**
 * El mapa de una ruta: qué sectores cruza y si están en el celular.
 *
 * **Este bloque existe para que no haya sorpresas en el cerro.** Todo lo que
 * dice se sabe en casa, con señal. Aparece igual en la ruta y al subirla.
 *
 * Tiene tres estados y ninguno queda mudo:
 *   - está todo listo;
 *   - falta bajar el mapa de algún sector;
 *   - hay un pedazo de ruta que no cae en ningún sector.
 */

type BloqueDeCoberturaProps = {
  cobertura: Cobertura;
  /** Las zonas que la ruta toca. Puede no tocar ninguna, o tocar cinco. */
  zonas: Zona[];
  /** El id de zona al que mandar para crear el sector que falta, si se sabe. */
  zonaParaCrearSector?: number | null;
};

function enKm(metros: number): string {
  return `${(metros / 1000).toFixed(1).replace(".", ",")} km`;
}

export function BloqueDeCobertura({
  cobertura,
  zonas,
  zonaParaCrearSector = null,
}: BloqueDeCoberturaProps) {
  // Crear una zona o un sector escribe en la base: sin señal esos botones no
  // existen. El aviso de que falta mapa sí queda: eso es información.
  const haySenal = useHaySenal();
  const hayHueco = cobertura.metrosSinCobertura > 0;
  const faltanBajar = cobertura.sectores
    .filter((cada) => cada.estado === "falta_descargar")
    .map((cada) => cada.sector);
  const listo = coberturaCompleta(cobertura);

  const franja = hayHueco
    ? "rojo"
    : listo
      ? "verde"
      : "ambar";
  const metrosCubiertos = Math.max(
    0,
    cobertura.metrosTotales - cobertura.metrosSinCobertura,
  );

  return (
    <Tarjeta franja={franja} className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
        El mapa de esta ruta
      </h2>

      <div className="flex items-start gap-3">
        {hayHueco ? (
          <IconoProblema />
        ) : listo ? (
          <IconoListo />
        ) : (
          <IconoAviso />
        )}

        <div className="min-w-0 flex-1">
          {hayHueco ? (
            <>
              <p className="text-base font-semibold text-rojo-texto">
                Hay un pedazo sin mapa
              </p>
              <p className="mt-1 text-sm leading-6 text-texto-suave">
                <strong className="font-semibold text-rojo-texto">
                  {enKm(cobertura.metrosSinCobertura)}
                </strong>{" "}
                de esta ruta caen fuera de todo sector. Ahí el punto azul se va a
                ver igual, pero sin mapa atrás.
              </p>
            </>
          ) : listo ? (
            <>
              <p className="text-base font-semibold text-texto">
                Podés salir sin señal
              </p>
              <p className="mt-1 text-sm leading-6 text-texto-suave">
                {cobertura.sectores.length === 1
                  ? "El sector que cruza esta ruta está descargado en este celular."
                  : `Los ${cobertura.sectores.length} sectores que cruza esta ruta están descargados en este celular.`}
              </p>
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-ambar-texto">
                {faltanBajar.length === 1
                  ? "Te falta un mapa para esta ruta"
                  : `Te faltan ${faltanBajar.length} mapas para esta ruta`}
              </p>
            </>
          )}
        </div>
      </div>

      {cobertura.metrosTotales > 0 ? (
        <div className="flex items-center gap-3">
          <div className="flex h-2 flex-1 gap-0.5 overflow-hidden rounded-full">
            <div
              className="rounded-l-full bg-acento-hover"
              style={{ flexGrow: Math.max(metrosCubiertos, 1) }}
            />
            {hayHueco ? (
              <div
                className="rounded-r-full bg-rojo"
                style={{ flexGrow: cobertura.metrosSinCobertura }}
              />
            ) : null}
          </div>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-texto-suave">
            {enKm(metrosCubiertos)} de {enKm(cobertura.metrosTotales)}
          </span>
        </div>
      ) : null}

      {/*
        Las zonas son información, no veredicto: dicen si el territorio por
        donde pasa la ruta ya está organizado. Una ruta puede no tocar ninguna,
        o tocar cinco.
      */}
      <div className="space-y-1.5">
        {zonas.length === 0 ? (
          <p className="rounded-lg border border-borde-suave bg-fondo px-3 py-2 text-sm leading-6 text-texto-suave">
            Esta ruta no cae en ninguna zona tuya. Podés hacerla igual: la zona
            es para organizarte, no para salir.
          </p>
        ) : (
          zonas.map((zona) => (
            <div
              key={zona.id}
              className="flex items-center gap-2 rounded-lg border border-borde-suave bg-fondo px-3 py-2 text-sm text-texto"
            >
              <span
                aria-hidden
                className="h-3.5 w-5 shrink-0 rounded-[2px] border-2 border-dashed border-borde-fuerte"
              />
              <span className="min-w-0 flex-1 truncate">{zona.nombre}</span>
              <span className="shrink-0 text-xs text-texto-suave">zona</span>
            </div>
          ))
        )}
      </div>

      <BajarLosMapasQueFaltan
        sectoresNecesarios={cobertura.sectores}
      />

      {haySenal && hayHueco && zonaParaCrearSector !== null ? (
        <Link
          href={`/zonas/${zonaParaCrearSector}/sectores/nueva`}
          className="flex min-h-14 w-full items-center justify-center rounded-xl border border-borde-fuerte bg-superficie-alta px-5 text-base font-semibold text-texto transition-colors hover:bg-superficie"
        >
          Crear un sector que lo cubra
        </Link>
      ) : null}

      {/* Sin zona no hay dónde crear el sector: primero va la zona. */}
      {haySenal && hayHueco && zonaParaCrearSector === null ? (
        <Link
          href="/zonas/nueva"
          className="flex min-h-14 w-full items-center justify-center rounded-xl border border-borde-fuerte bg-superficie-alta px-5 text-base font-semibold text-texto transition-colors hover:bg-superficie"
        >
          Crear una zona acá
        </Link>
      ) : null}
    </Tarjeta>
  );
}

function IconoListo() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 h-6 w-6 shrink-0 text-verde-icono"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.5 2.5 5-5.5" />
    </svg>
  );
}

function IconoAviso() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 h-6 w-6 shrink-0 text-ambar-icono"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3.5 21 19H3Z" />
      <path d="M12 10v4" />
      <path d="M12 17.2v.1" />
    </svg>
  );
}

function IconoProblema() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 h-6 w-6 shrink-0 text-rojo"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5" />
      <path d="M12 16.4v.1" />
    </svg>
  );
}



