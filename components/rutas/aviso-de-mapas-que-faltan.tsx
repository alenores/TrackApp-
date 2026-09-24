"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useHaySenal } from "@/hooks/use-hay-senal";
import {
  bajarElMapaDelSector,
  mostrarPeso,
  pesoAproximadoDelMapa,
} from "@/lib/mapas/descarga";
import { fuenteDelServidor } from "@/lib/mapas/fuente-del-servidor";
import { comoLista, sectoresDeLasRutas } from "@/lib/mapas/lo-que-falta";
import type { MapaPerdido, RutaSinMapa } from "@/lib/mapas/lo-que-falta";
import { NOMBRE_DEL_TIPO, TIPOS_DE_MAPA, type TipoDeMapa } from "@/lib/offline/mapas";
import type { Sector } from "@/types/database";

/**
 * Lo que le falta a este celular, dicho en el inicio.
 *
 * **Es el único momento en que el usuario tiene señal y está en su casa.**
 * Enterarse a mitad de camino de que el mapa no está no es un aviso, es una
 * sorpresa, y en la montaña una sorpresa es un problema.
 *
 * Son dos avisos distintos y se ven distinto a propósito:
 *
 * - **Perdiste mapas que tenías.** Franja ámbar, arriba de todo. El usuario creía
 *   que los tenía: es lo urgente.
 * - **Nunca bajaste estos.** Tarjeta común, sin franja. No pasó nada malo, es
 *   una tarea pendiente.
 *
 * Sin señal se van los botones y queda toda la información: lo que se esconde es
 * la acción, nunca el dato.
 */

type PropiedadesDelAviso = {
  perdidos: MapaPerdido[];
  rutas: RutaSinMapa[];
  /** Por qué no se pudo revisar, cuando no se pudo. Nunca se traga. */
  aviso: string | null;
};

type Bajando = { nombre: string; resueltos: number; total: number };
type Fallo = { nombre: string; motivo: string };

type Pendiente = { sector: Sector; tipo: TipoDeMapa };

export function AvisoDeMapasQueFaltan({
  perdidos,
  rutas,
  aviso,
}: PropiedadesDelAviso) {
  const haySenal = useHaySenal();
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

  const sectoresSinBajar = useMemo(() => sectoresDeLasRutas(rutas), [rutas]);

  const pesoDeLosPerdidos = perdidos.reduce(
    (suma, cada) =>
      suma + pesoAproximadoDelMapa(cada.sector.rectangulo, undefined, cada.tipo),
    0,
  );
  const pesoDeLosNuevos = (tipo: TipoDeMapa) =>
    sectoresSinBajar.reduce(
      (suma, sector) => suma + pesoAproximadoDelMapa(sector.rectangulo, undefined, tipo),
      0,
    );

  const bajarEstos = async (pendientes: Pendiente[]) => {
    canceladorRef.current?.abort();
    const cancelador = new AbortController();
    canceladorRef.current = cancelador;
    setFallo(null);

    for (const { sector, tipo } of pendientes) {
      if (cancelador.signal.aborted) break;
      setBajando({ nombre: sector.nombre, resueltos: 0, total: 0 });

      const resultado = await bajarElMapaDelSector({
        sector,
        tipo,
        fuente: fuenteDelServidor(),
        senal: cancelador.signal,
        avisarAvance: ({ resueltos, total }) => {
          if (montadoRef.current) {
            setBajando({ nombre: sector.nombre, resueltos, total });
          }
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

  if (aviso) {
    return (
      <Tarjeta franja="ambar">
        <p role="alert" className="text-sm leading-6 text-texto-suave">
          {aviso}
        </p>
      </Tarjeta>
    );
  }

  if (perdidos.length === 0 && rutas.length === 0) return null;

  const enFila = bajando !== null;
  const unoSolo = perdidos.length === 1;
  const unaSolaRuta = rutas.length === 1;

  return (
    <div className="space-y-3">
      {perdidos.length > 0 ? (
        <Tarjeta franja="ambar" className="space-y-3">
          <div className="flex items-start gap-3">
            <TrianguloDeAviso />
            <div className="min-w-0 flex-1 space-y-1.5">
              <h2 className="text-base font-semibold leading-snug text-texto">
                {unoSolo
                  ? "Te falta un mapa que ya tenías bajado"
                  : `Te faltan ${perdidos.length} mapas que ya tenías bajados`}
              </h2>
              <p className="text-sm leading-6 text-texto-suave">
                El celular necesitó espacio y se{" "}
                {unoSolo ? "lo llevó" : "los llevó"}. Sin{" "}
                {unoSolo ? "él" : "ellos"}, en el cerro no vas a ver el terreno.{" "}
                {unoSolo ? "Bajalo" : "Bajalos"} de nuevo{" "}
                {haySenal ? "ahora que tenés señal." : "cuando tengas señal."}
              </p>
            </div>
          </div>

          <ul className="space-y-1.5">
            {perdidos.map(({ sector }) => (
              <li
                key={sector.id}
                className="flex items-center gap-2 rounded-lg border border-ambar-borde bg-ambar-fondo px-2.5 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ambar-texto">
                  {sector.nombre}
                </span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-ambar-texto">
                  {mostrarPeso(pesoAproximadoDelMapa(sector.rectangulo))}
                </span>
              </li>
            ))}
          </ul>

          {haySenal ? (
            <Boton
              anchoCompleto
              disabled={enFila}
              onClick={() =>
                void bajarEstos(
                  perdidos.map((cada) => ({
                    sector: cada.sector,
                    tipo: cada.tipo,
                  })),
                )
              }
            >
              {enFila
                ? avanceEnPalabras(bajando)
                : `Bajar${unoSolo ? "lo" : "los"} de nuevo · ${mostrarPeso(pesoDeLosPerdidos)}`}
            </Boton>
          ) : null}
        </Tarjeta>
      ) : null}

      {rutas.length > 0 ? (
        <Tarjeta className="space-y-3">
          <div className="flex items-start gap-3">
            <IconoDeMapa />
            <div className="min-w-0 flex-1 space-y-1.5">
              <h2 className="text-base font-semibold leading-snug text-texto">
                {unaSolaRuta
                  ? "Una ruta nunca tuvo el mapa bajado"
                  : `${rutas.length} rutas nunca tuvieron el mapa bajado`}
              </h2>
              <p className="text-sm leading-6 text-texto-suave">
                {comoLista(rutas.map((cada) => cada.ruta.nombre))}.{" "}
                {haySenal
                  ? `Si pensás ${unaSolaRuta ? "hacerla" : "hacerlas"}, bajá ${
                      unaSolaRuta ? "el mapa" : "los mapas"
                    } ahora.`
                  : `Vas a poder bajar ${
                      unaSolaRuta ? "el mapa" : "los mapas"
                    } cuando tengas señal.`}
              </p>
            </div>
          </div>

          {haySenal ? (
            enFila ? (
              <Boton variante="secundario" anchoCompleto disabled>
                {avanceEnPalabras(bajando)}
              </Boton>
            ) : (
              // El usuario elige: el simple, el satelital, o los dos tocando uno
              // y después el otro.
              <div className="grid grid-cols-2 gap-2">
                {TIPOS_DE_MAPA.map((tipo) => (
                  <Boton
                    key={tipo}
                    variante="secundario"
                    anchoCompleto
                    onClick={() =>
                      void bajarEstos(sectoresSinBajar.map((sector) => ({ sector, tipo })))
                    }
                  >
                    {`${NOMBRE_DEL_TIPO[tipo]} · ${mostrarPeso(pesoDeLosNuevos(tipo))}`}
                  </Boton>
                ))}
              </div>
            )
          ) : null}
        </Tarjeta>
      ) : null}

      {fallo ? (
        <p
          role="alert"
          className="rounded-xl bg-rojo-fondo px-3 py-2 text-sm leading-6 text-rojo-texto"
        >
          «{fallo.nombre}» quedó a medio bajar: {fallo.motivo} Lo que entró queda
          guardado, así que reintentar tarda menos.
        </p>
      ) : null}
    </div>
  );
}

function avanceEnPalabras(bajando: Bajando | null): string {
  if (!bajando) return "Bajando…";
  if (bajando.total === 0) return `Empezando «${bajando.nombre}»…`;

  return `«${bajando.nombre}»: ${bajando.resueltos} de ${bajando.total}`;
}

function TrianguloDeAviso() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="mt-0.5 h-5 w-5 shrink-0 text-ambar-icono"
    >
      <path
        d="M12 3 L22 20 H2 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M12 10 V14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17" r="1.15" fill="currentColor" />
    </svg>
  );
}

function IconoDeMapa() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="mt-0.5 h-5 w-5 shrink-0 text-texto-suave"
    >
      <path
        d="M4 7 L10 4 L15 7 L20 4 V17 L15 20 L10 17 L4 20 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M10 4 V17 M15 7 V20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}
