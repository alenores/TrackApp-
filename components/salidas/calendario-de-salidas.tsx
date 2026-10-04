"use client";

import { useEffect, useState } from "react";
import { diasConSalidas } from "@/app/actions/salidas";
import { BotonRedondo } from "@/components/ui/boton-redondo";
import { Emergente } from "@/components/ui/emergente";
import { hoyEnCordoba } from "@/lib/salidas/reglas";
import {
  DIAS_DE_LA_SEMANA,
  limitesDelMes,
  mesDe,
  mesVecino,
  nombreDelMes,
  semanasDelMes,
  type Mes,
} from "@/lib/salidas/calendario";

/**
 * El calendario de salidas: un mes por vez, con una marca en los días que
 * hubo salidas. Lo dibuja la app, no el sistema del celular. Tocar un día
 * marcado muestra las salidas de ese día.
 */

type Props = {
  abierto: boolean;
  alCerrar: () => void;
  /** El mes con que abre: el del filtro puesto, o el de hoy. */
  diaInicial: string | null;
  diaElegido: string | null;
  alElegirDia: (dia: string) => void;
};

type Marcas =
  | { estado: "cargando" }
  | { estado: "listo"; dias: Set<string> }
  | { estado: "fallo"; motivo: string };

export function CalendarioDeSalidas({ abierto, alCerrar, diaInicial, diaElegido, alElegirDia }: Props) {
  const [mes, setMes] = useState<Mes>(() => mesDe(diaInicial ?? hoyEnCordoba()));
  const [intento, setIntento] = useState(0);
  // Lo último que llegó, con el mes al que corresponde. Mientras no coincide
  // con el que se mira, se está buscando.
  const [llegado, setLlegado] = useState<{ clave: string; marcas: Marcas } | null>(null);
  const clave = `${mes.anio}-${mes.mes}-${intento}`;
  const marcas: Marcas = llegado?.clave === clave ? llegado.marcas : { estado: "cargando" };

  useEffect(() => {
    if (!abierto) return;
    let vigente = true;
    const { desde, hasta } = limitesDelMes(mes);
    void diasConSalidas(desde, hasta)
      .then((resultado) => {
        if (!vigente) return;
        setLlegado({
          clave,
          marcas: resultado.ok
            ? { estado: "listo", dias: new Set(resultado.datos) }
            : { estado: "fallo", motivo: resultado.error },
        });
      })
      .catch((causa) => {
        if (!vigente) return;
        setLlegado({
          clave,
          marcas: { estado: "fallo", motivo: causa instanceof Error ? causa.message : String(causa) },
        });
      });
    return () => {
      vigente = false;
    };
  }, [abierto, mes, clave]);

  const hoy = hoyEnCordoba();

  return (
    <Emergente abierto={abierto} alCerrar={alCerrar} titulo="Días con salidas">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <BotonRedondo etiqueta="Mes anterior" onClick={() => setMes((actual) => mesVecino(actual, -1))}>
            <path d="m14.5 6-6 6 6 6" />
          </BotonRedondo>
          <p className="text-base font-semibold text-texto">{nombreDelMes(mes)}</p>
          <BotonRedondo etiqueta="Mes siguiente" onClick={() => setMes((actual) => mesVecino(actual, 1))}>
            <path d="m9.5 6 6 6-6 6" />
          </BotonRedondo>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {DIAS_DE_LA_SEMANA.map((inicial, indice) => (
            <span key={indice} className="py-1 text-xs font-semibold text-texto-suave">
              {inicial}
            </span>
          ))}
          {semanasDelMes(mes).flat().map((dia, indice) => {
            if (!dia) return <span key={`hueco-${indice}`} />;
            const tieneSalidas = marcas.estado === "listo" && marcas.dias.has(dia);
            const elegido = dia === diaElegido;
            return (
              <button
                key={dia}
                type="button"
                disabled={!tieneSalidas}
                onClick={() => alElegirDia(dia)}
                aria-label={tieneSalidas ? `Ver las salidas del ${Number(dia.slice(8))}` : undefined}
                className={[
                  "relative flex h-10 flex-col items-center justify-center rounded-xl text-sm tabular-nums",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde",
                  elegido
                    ? "bg-acento font-semibold text-acento-texto"
                    : tieneSalidas
                      ? "bg-verde-fondo font-semibold text-verde-texto hover:bg-superficie-alta"
                      : "text-texto-suave",
                  dia === hoy && !elegido ? "ring-1 ring-borde-fuerte" : "",
                ].join(" ")}
              >
                {Number(dia.slice(8))}
                {tieneSalidas ? (
                  <span
                    aria-hidden
                    className={`absolute bottom-1 h-1 w-1 rounded-full ${elegido ? "bg-acento-texto" : "bg-verde-texto"}`}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        {marcas.estado === "cargando" ? (
          <p role="status" className="text-sm text-texto-suave">Buscando los días con salidas…</p>
        ) : marcas.estado === "fallo" ? (
          <div role="alert" className="space-y-2">
            <p className="text-sm leading-6 text-rojo-texto">
              No se pudieron marcar los días: {marcas.motivo}
            </p>
            <button
              type="button"
              onClick={() => setIntento((cuantos) => cuantos + 1)}
              className="text-sm font-semibold text-texto underline"
            >
              Volver a intentar
            </button>
          </div>
        ) : marcas.dias.size === 0 ? (
          <p className="text-sm text-texto-suave">Este mes no hubo salidas.</p>
        ) : (
          <p className="text-sm text-texto-suave">
            {marcas.dias.size === 1 ? "Un día con salidas." : `${marcas.dias.size} días con salidas.`} Tocá uno
            para verlas.
          </p>
        )}
      </div>
    </Emergente>
  );
}
