"use client";

import { useEffect, useRef, useState } from "react";
import { Boton } from "@/components/ui/boton";
import {
  bajarElMapaDelSector,
  mostrarPeso,
  pesoAproximadoDelMapa,
} from "@/lib/mapas/descarga";
import { fuenteDelServidor } from "@/lib/mapas/fuente-del-servidor";
import type { Sector } from "@/types/database";

/**
 * Bajar, desde la ruta, los mapas que le faltan.
 *
 * **Para que no haya que ir a buscarlos a otra pantalla.** El usuario está
 * mirando la ruta que va a hacer y ahí mismo ve qué le falta y lo baja.
 *
 * Se bajan **de a uno y en orden**: varios a la vez pelean por la misma
 * conexión y no terminan antes, solo se ve peor. Si uno se corta, se frena la
 * fila y se dice cuál falló y por qué; los que ya entraron quedan bajados.
 */

type PropiedadesDeBajarLosQueFaltan = {
  sectoresQueFaltan: Sector[];
};

type Bajando = { sectorId: number; resueltos: number; total: number };
type Fallo = { nombre: string; motivo: string };

export function BajarLosMapasQueFaltan({
  sectoresQueFaltan,
}: PropiedadesDeBajarLosQueFaltan) {
  const [bajando, setBajando] = useState<Bajando | null>(null);
  const [fallo, setFallo] = useState<Fallo | null>(null);
  const canceladorRef = useRef<AbortController | null>(null);
  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
      canceladorRef.current?.abort();
    };
  }, []);

  if (sectoresQueFaltan.length === 0) return null;

  const pesoDeTodos = sectoresQueFaltan.reduce(
    (suma, sector) => suma + pesoAproximadoDelMapa(sector.rectangulo),
    0,
  );

  const bajarEstos = async (sectores: Sector[]) => {
    canceladorRef.current?.abort();
    const cancelador = new AbortController();
    canceladorRef.current = cancelador;
    setFallo(null);

    for (const sector of sectores) {
      if (cancelador.signal.aborted) break;
      setBajando({ sectorId: sector.id, resueltos: 0, total: 0 });

      const resultado = await bajarElMapaDelSector({
        sector,
        tipo: "simple",
        fuente: fuenteDelServidor(),
        senal: cancelador.signal,
        avisarAvance: ({ resueltos, total }) => {
          if (montadoRef.current) setBajando({ sectorId: sector.id, resueltos, total });
        },
      });

      if (!montadoRef.current) return;
      if (resultado.estado === "cancelada") break;

      if (resultado.estado === "incompleta") {
        setFallo({ nombre: sector.nombre, motivo: resultado.motivo });
        break;
      }
    }

    if (montadoRef.current) setBajando(null);
  };

  const enFila = bajando !== null;

  return (
    <div className="space-y-2">
      <ul className="space-y-1.5">
        {sectoresQueFaltan.map((sector) => {
          const esteBajando = bajando?.sectorId === sector.id;

          return (
            <li
              key={sector.id}
              className="flex min-h-14 items-center gap-2 rounded-xl border border-borde-suave bg-fondo px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-texto">
                {sector.nombre}
              </span>

              {esteBajando ? (
                <span className="shrink-0 text-xs font-semibold tabular-nums text-texto-suave">
                  {bajando.total > 0
                    ? `${bajando.resueltos} de ${bajando.total}`
                    : "empezando…"}
                </span>
              ) : (
                <button
                  type="button"
                  disabled={enFila}
                  onClick={() => void bajarEstos([sector])}
                  className="min-h-11 shrink-0 rounded-lg border border-acento-borde bg-acento px-3.5 py-2 text-sm font-semibold text-acento-texto transition-colors hover:bg-acento-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Bajar · {mostrarPeso(pesoAproximadoDelMapa(sector.rectangulo))}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {fallo ? (
        <p className="rounded-xl bg-rojo-fondo px-3 py-2 text-sm leading-6 text-rojo-texto">
          «{fallo.nombre}» quedó a medio bajar: {fallo.motivo} Lo que entró queda
          guardado, así que reintentar tarda menos.
        </p>
      ) : null}

      {sectoresQueFaltan.length > 1 ? (
        <Boton
          anchoCompleto
          disabled={enFila}
          onClick={() => void bajarEstos(sectoresQueFaltan)}
        >
          {enFila
            ? "Bajando…"
            : `Bajar los ${sectoresQueFaltan.length} que faltan · ${mostrarPeso(pesoDeTodos)}`}
        </Boton>
      ) : null}
    </div>
  );
}
