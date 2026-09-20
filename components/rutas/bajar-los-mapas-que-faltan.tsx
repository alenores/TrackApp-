"use client";

import { useEffect, useRef, useState } from "react";
import { Boton } from "@/components/ui/boton";
import {
  bajarElMapaDelSector,
  mostrarPeso,
  pesoAproximadoDelMapa,
} from "@/lib/mapas/descarga";
import { fuenteDelServidor } from "@/lib/mapas/fuente-del-servidor";
import type { SectorConFotosSinBajar } from "@/lib/anotaciones/descarga";
import type { Anotacion, Sector } from "@/types/database";

/**
 * Bajar, desde la ruta, los mapas que le faltan.
 *
 * **Para que no haya que ir a buscarlos a otra pantalla.** El usuario está
 * mirando la ruta que va a hacer y ahí mismo ve qué le falta y lo baja.
 *
 * Se bajan **de a uno y en orden**: varios a la vez pelean por la misma
 * conexión y no terminan antes, solo se ve peor. Si uno se corta, se frena la
 * fila y se dice cuál falló y por qué; los que ya entraron quedan bajados.
 *
 * Con cada mapa bajan las fotos de las anotaciones de ese sector. Cuando a un
 * sector ya bajado se le agregó una foto después, se ofrece acá mismo volver a
 * bajarlo: los pedazos de mapa ya están, así que es solo la foto.
 */

type PropiedadesDeBajarLosQueFaltan = {
  sectoresQueFaltan: Sector[];
  /** Todas las anotaciones del celular: de acá salen las fotos que hay que bajar. */
  anotaciones: Anotacion[];
  /** Sectores ya bajados a los que les falta alguna foto de anotación. */
  fotosPendientes: SectorConFotosSinBajar[];
};

type Bajando = { sectorId: number; resueltos: number; total: number };
type Fallo = { nombre: string; motivo: string };

export function BajarLosMapasQueFaltan({
  sectoresQueFaltan,
  anotaciones,
  fotosPendientes,
}: PropiedadesDeBajarLosQueFaltan) {
  const [bajando, setBajando] = useState<Bajando | null>(null);
  const [fallo, setFallo] = useState<Fallo | null>(null);
  const [fotosQueNoEntraron, setFotosQueNoEntraron] = useState<string | null>(null);
  const canceladorRef = useRef<AbortController | null>(null);
  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
      canceladorRef.current?.abort();
    };
  }, []);

  if (sectoresQueFaltan.length === 0 && fotosPendientes.length === 0) return null;

  const pesoDeTodos = sectoresQueFaltan.reduce(
    (suma, sector) => suma + pesoAproximadoDelMapa(sector.rectangulo),
    0,
  );

  const bajarEstos = async (sectores: Sector[]) => {
    canceladorRef.current?.abort();
    const cancelador = new AbortController();
    canceladorRef.current = cancelador;
    setFallo(null);
    setFotosQueNoEntraron(null);

    for (const sector of sectores) {
      if (cancelador.signal.aborted) break;
      setBajando({ sectorId: sector.id, resueltos: 0, total: 0 });

      const resultado = await bajarElMapaDelSector({
        sector,
        tipo: "simple",
        fuente: fuenteDelServidor(),
        anotaciones,
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

      // El mapa entró. Si alguna foto no, se dice acá mismo y no en el cerro.
      if (resultado.fotos.motivo) {
        setFotosQueNoEntraron(
          `De «${sector.nombre}» entró el mapa, pero quedaron ${
            resultado.fotos.total - resultado.fotos.bajadas
          } de ${resultado.fotos.total} fotos de anotación sin bajar: ${
            resultado.fotos.motivo
          } Probá de nuevo con mejor señal.`,
        );
      }
    }

    if (montadoRef.current) setBajando(null);
  };

  const enFila = bajando !== null;

  return (
    <div className="space-y-2">
      {sectoresQueFaltan.length > 0 ? (
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
      ) : null}

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

      {fotosPendientes.length > 0 ? (
        <div className="space-y-2 rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-3">
          <p className="text-sm leading-6 text-ambar-texto">
            {fotosPendientes.length === 1
              ? `A «${fotosPendientes[0].sector.nombre}» le agregaron ${
                  fotosPendientes[0].cuantas === 1
                    ? "una foto de anotación"
                    : `${fotosPendientes[0].cuantas} fotos de anotación`
                } después de que bajaras el mapa. Sin señal no las vas a poder ver.`
              : `Hay ${fotosPendientes.length} sectores con fotos de anotación que no están en el celular. Sin señal no las vas a poder ver.`}
          </p>

          <Boton
            variante="secundario"
            anchoCompleto
            disabled={enFila}
            onClick={() =>
              void bajarEstos(fotosPendientes.map((cada) => cada.sector))
            }
          >
            {enFila ? "Bajando…" : "Bajar las fotos que faltan"}
          </Boton>
        </div>
      ) : null}

      {fotosQueNoEntraron ? (
        <p
          role="alert"
          className="rounded-xl bg-ambar-fondo px-3 py-2 text-sm leading-6 text-ambar-texto"
        >
          {fotosQueNoEntraron}
        </p>
      ) : null}
    </div>
  );
}
