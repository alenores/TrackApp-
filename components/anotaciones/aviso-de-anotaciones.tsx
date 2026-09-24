"use client";

import { useEffect, useState } from "react";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { usePendientes } from "@/hooks/use-pendientes";
import { pedirQueSeSubaYa } from "@/hooks/use-subir-pendientes";
import {
  cuantasFotosChicasFaltan,
  ponerAlDiaLasFotosChicas,
} from "@/lib/anotaciones/descarga";
import type { Anotacion } from "@/types/database";

/**
 * Lo que el inicio tiene que decir de las anotaciones, **en casa y con señal**.
 *
 * Dos cosas distintas, cada una en su tarjeta:
 *   - lo que marcaste sin señal y todavía no subió, con el motivo si falló;
 *   - las fotos de anotaciones que no están en el celular, que en el cerro no
 *     vas a poder ver.
 *
 * Sin señal se van los botones y queda la información.
 */

type Props = { anotaciones: Anotacion[] };

export function AvisoDeAnotaciones({ anotaciones }: Props) {
  const haySenal = useHaySenal();
  const pendientes = usePendientes().filter((cada) => !cada.terminada);
  const [fotosQueFaltan, setFotosQueFaltan] = useState(0);
  const [bajando, setBajando] = useState(false);
  const [falloDeFotos, setFalloDeFotos] = useState<string | null>(null);
  const [vuelta, setVuelta] = useState(0);

  useEffect(() => {
    let vigente = true;
    void cuantasFotosChicasFaltan(anotaciones).then((cuantas) => {
      if (vigente) setFotosQueFaltan(cuantas);
    });
    return () => {
      vigente = false;
    };
  }, [anotaciones, vuelta]);

  const bajarLasFotos = async () => {
    setBajando(true);
    setFalloDeFotos(null);
    const avance = await ponerAlDiaLasFotosChicas(anotaciones);
    setBajando(false);
    if (avance.motivo) {
      setFalloDeFotos(
        `Quedaron ${avance.total - avance.bajadas} sin bajar: ${avance.motivo} Probá de nuevo con mejor señal.`,
      );
    }
    setVuelta((cada) => cada + 1);
  };

  const conError = pendientes.filter((cada) => cada.ultimoError);

  return (
    <>
      {pendientes.length > 0 ? (
        <Tarjeta franja="ambar" className="space-y-3">
          <p className="text-base font-semibold text-texto">
            {pendientes.length === 1
              ? "Tenés una anotación marcada sin señal que todavía no se subió"
              : `Tenés ${pendientes.length} anotaciones marcadas sin señal que todavía no se subieron`}
          </p>
          <p className="text-sm leading-6 text-texto-suave">
            {pendientes.length === 1
              ? "Está guardada en este celular y se ve en tu mapa. Los demás la van a ver cuando se suba. "
              : "Están guardadas en este celular y se ven en tu mapa. Los demás las van a ver cuando se suban. "}
            {haySenal ? "Con señal se suben solas." : "Se suben solas apenas tengas señal."}
          </p>

          {conError.length > 0 ? (
            <ul className="space-y-2">
              {conError.map((cada) => (
                <li
                  key={cada.codigo}
                  role="alert"
                  className="rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-2 text-sm leading-6 text-ambar-texto"
                >
                  {cada.ultimoError}
                </li>
              ))}
            </ul>
          ) : null}

          {haySenal && conError.length > 0 ? (
            <Boton variante="secundario" anchoCompleto onClick={pedirQueSeSubaYa}>
              Probar de nuevo
            </Boton>
          ) : null}
        </Tarjeta>
      ) : null}

      {fotosQueFaltan > 0 ? (
        <Tarjeta franja="ambar" className="space-y-3">
          <p className="text-base font-semibold text-texto">
            {fotosQueFaltan === 1
              ? "Falta una foto de anotación en este celular"
              : `Faltan ${fotosQueFaltan} fotos de anotaciones en este celular`}
          </p>
          <p className="text-sm leading-6 text-texto-suave">
            Sin señal no las vas a poder ver. Bajalas ahora, desde casa: son
            livianas, pensadas para la pantalla del celular.
          </p>

          {falloDeFotos ? (
            <p role="alert" className="rounded-xl bg-ambar-fondo px-3 py-2 text-sm leading-6 text-ambar-texto">
              {falloDeFotos}
            </p>
          ) : null}

          {haySenal ? (
            <Boton
              variante="secundario"
              anchoCompleto
              disabled={bajando}
              onClick={() => void bajarLasFotos()}
            >
              {bajando ? "Bajando las fotos…" : "Bajar las fotos"}
            </Boton>
          ) : null}
        </Tarjeta>
      ) : null}
    </>
  );
}
