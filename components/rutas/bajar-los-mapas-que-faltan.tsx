"use client";

import { Boton } from "@/components/ui/boton";
import { mostrarPeso, pesoAproximadoDelMapa } from "@/lib/mapas/descarga";
import { useBajarEnFila } from "@/hooks/use-bajar-en-fila";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { useMapasBajados } from "@/hooks/use-mapa-del-sector";
import {
  claveDeMapa,
  NOMBRE_DEL_TIPO,
  TIPOS_DE_MAPA,
  type TipoDeMapa,
} from "@/lib/offline/mapas";
import type { Sector } from "@/types/database";
import type { SectorNecesario } from "@/lib/cobertura";

function enKm(metros: number): string {
  return `${(metros / 1000).toFixed(1).replace(".", ",")} km`;
}

function TildeChico() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 text-verde-icono"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

/**
 * Bajar, desde el Circuito, los mapas que le faltan.
 *
 * **Para que no haya que ir a buscarlos a otra pantalla.** El usuario está
 * mirando la ruta que va a hacer y ahí mismo ve qué le falta y lo baja.
 *
 * Se bajan **de a uno y en orden**: varios a la vez pelean por la misma
 * conexión y no terminan antes, solo se ve peor. Si uno se corta, se frena la
 * fila y se dice cuál falló y por qué; los que ya entraron quedan bajados.
 */

type PropiedadesDeBajarLosQueFaltan = {
  sectoresNecesarios: SectorNecesario[];
};

export function BajarLosMapasQueFaltan({
  sectoresNecesarios,
}: PropiedadesDeBajarLosQueFaltan) {
  const bajados = useMapasBajados();
  const enElCelular = new Set(bajados.map((cada) => claveDeMapa(cada.sectorId, cada.tipo)));
  const tiene = (sector: Sector, tipo: TipoDeMapa) =>
    enElCelular.has(claveDeMapa(sector.id, tipo));

  /** Por cada tipo, los sectores de la ruta a los que les falta ese mapa. */
  const faltanDe = (tipo: TipoDeMapa) =>
    sectoresNecesarios.map((cada) => cada.sector).filter((sector) => !tiene(sector, tipo));
  const { bajando, fallo, bajarEstos } = useBajarEnFila();
  const haySenal = useHaySenal();

  // Sin señal no hay nada que bajar: los botones se van. Lo que falta lo sigue
  // diciendo la lista, que es información y esa no se esconde nunca.

  const pesoDeTodos = (tipo: TipoDeMapa) =>
    faltanDe(tipo).reduce(
      (suma, sector) => suma + pesoAproximadoDelMapa(sector.rectangulo, undefined, tipo),
      0,
    );

  const enFila = bajando !== null;

  return (
    <div className="space-y-2">
      {sectoresNecesarios.length > 0 ? (
        <ul className="space-y-1.5">
          {sectoresNecesarios.map((necesario) => {
            const { sector, estado, metros } = necesario;
            const esteBajando = bajando?.sectorId === sector.id;

            return (
              <li
                key={sector.id}
                className="flex min-h-14 items-center gap-2 rounded-xl border border-borde-suave bg-fondo px-3 py-2"
              >
                {estado === "descargado" ? <TildeChico /> : null}
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <span className="truncate text-sm text-texto font-medium">
                    {sector.nombre}
                  </span>
                  <span className="text-xs text-texto-suave">
                    {enKm(metros)}
                  </span>
                </div>

                {esteBajando ? (
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-texto-suave">
                    {NOMBRE_DEL_TIPO[bajando.tipo]}:{" "}
                    {bajando.total > 0
                      ? `${bajando.resueltos} de ${bajando.total}`
                      : "empezando…"}
                  </span>
                ) : (
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {TIPOS_DE_MAPA.map((tipo) =>
                      tiene(sector, tipo) ? (
                        <span key={tipo} className="text-xs text-texto-suave">
                          {NOMBRE_DEL_TIPO[tipo]}: en el celular
                        </span>
                      ) : haySenal ? (
                        <button
                          key={tipo}
                          type="button"
                          disabled={enFila}
                          onClick={() => void bajarEstos([{ sector, tipo }])}
                          className="min-h-9 rounded-lg border border-acento-borde bg-acento px-3 py-1.5 text-xs font-semibold text-acento-texto transition-colors hover:bg-acento-hover disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {NOMBRE_DEL_TIPO[tipo]} ·{" "}
                          {mostrarPeso(pesoAproximadoDelMapa(sector.rectangulo, undefined, tipo))}
                        </button>
                      ) : null,
                    )}
                    {!haySenal && estado === "falta_descargar" ? (
                      <span className="text-xs text-texto-suave">falta bajar mapa</span>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}

      {fallo ? (
        <p className="rounded-xl bg-rojo-fondo px-3 py-2 text-sm leading-6 text-rojo-texto">
          «{fallo.nombre}» quedó a medio bajar: {fallo.motivo} Lo que entró queda
          guardado, así que reintentar tarda menos.
        </p>
      ) : null}

      {haySenal && sectoresNecesarios.length > 1 ? (
        <div className="flex flex-wrap justify-end gap-2">
          {TIPOS_DE_MAPA.map((tipo) => {
            const faltan = faltanDe(tipo);
            if (faltan.length < 2) return null;
            return (
              <Boton
                key={tipo}
                variante="secundario"
                disabled={enFila}
                onClick={() => void bajarEstos(faltan.map((sector) => ({ sector, tipo })))}
              >
                {enFila
                  ? "Bajando…"
                  : `${NOMBRE_DEL_TIPO[tipo]}, todos (${faltan.length}) · ${mostrarPeso(pesoDeTodos(tipo))}`}
              </Boton>
            );
          })}
        </div>
      ) : null}

    </div>
  );
}
