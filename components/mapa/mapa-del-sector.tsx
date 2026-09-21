"use client";

import { useState } from "react";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useDialogos } from "@/components/ui/dialogos";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { useMapaDelSector } from "@/hooks/use-mapa-del-sector";
import { fechaEnPalabras } from "@/lib/fechas";
import { mostrarPeso, pesoAproximadoDelMapa } from "@/lib/mapas/descarga";
import { sectoresConFotosSinBajar } from "@/lib/anotaciones/descarga";
import type { Anotacion, Sector } from "@/types/database";

/**
 * El mapa de un sector: bajarlo, verlo y sacarlo.
 *
 * Tiene cuatro estados y **ninguno queda mudo**: no bajado, bajando, bajado y
 * cortado a medias. El que más importa es el último: si una descarga se corta,
 * acá se dice qué pasó de verdad y qué hacer, porque enterarse en el cerro no
 * es enterarse.
 *
 * Hoy solo existe el mapa simple. El satelital se suma cuando exista, y ahí
 * aparece el selector entre los dos. **No se dibuja una opción que todavía no
 * funciona**: sería prometer algo que falla al tocarlo.
 */

type PropiedadesDelMapaDelSector = {
  sector: Sector;
  /**
   * Todos los sectores, para poder sacar el mapa sin llevarse el del vecino.
   * Los sectores vecinos comparten pedazos.
   */
  todosLosSectores: Sector[];
  /** Todas las anotaciones: sus fotos bajan junto con el mapa del sector. */
  anotaciones: Anotacion[];
};

export function MapaDelSector({
  sector,
  todosLosSectores,
  anotaciones,
}: PropiedadesDelMapaDelSector) {
  const { mapa, paso, fallaDeFotos, bajar, cancelar, sacar } = useMapaDelSector(
    sector,
    anotaciones,
  );
  // Bajar necesita señal. Sacar no: el espacio se libera acá mismo.
  const haySenal = useHaySenal();
  const { confirmar, avisar } = useDialogos();
  const [sacando, setSacando] = useState(false);

  const alSacar = async () => {
    const seguro = await confirmar({
      titulo: `¿Sacar el mapa de «${sector.nombre}»?`,
      mensaje:
        "Se libera el espacio que ocupa. Para volver a tenerlo vas a necesitar señal, así que no lo saques si estás por salir.",
      textoDeAceptar: "Sacar",
      destructivo: true,
    });
    if (!seguro) return;

    setSacando(true);
    const resultado = await sacar(todosLosSectores);
    setSacando(false);

    if (!resultado.ok) {
      await avisar({ titulo: "El mapa se sacó a medias", mensaje: resultado.motivo });
    }
  };

  if (paso.paso === "bajando") {
    const porcentaje = paso.total > 0 ? Math.round((paso.resueltos / paso.total) * 100) : 0;

    return (
      <Tarjeta tono="alta" className="space-y-3">
        <Rotulo>El mapa de este sector</Rotulo>
        <p className="text-base font-semibold text-texto">Bajando el mapa simple…</p>

        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-superficie">
            <div
              className="h-full rounded-full bg-acento-borde transition-[width]"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-texto-suave">
            {paso.total > 0 ? `${paso.resueltos} de ${paso.total}` : "empezando"}
          </span>
        </div>

        <p className="text-sm leading-6 text-texto-suave">
          No cierres la app hasta que termine. Tarda unos segundos.
        </p>

        <Boton variante="secundario" anchoCompleto onClick={cancelar}>
          Cancelar
        </Boton>
      </Tarjeta>
    );
  }

  if (paso.paso === "fallo") {
    return (
      <Tarjeta tono="alta" franja="rojo" className="space-y-3">
        <div className="flex items-start gap-3">
          <IconoProblema />
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-rojo-texto">
              El mapa quedó a medio bajar
            </p>
            <p className="mt-1 text-sm leading-6 text-texto-suave">
              Entraron {paso.resueltos} de {paso.total} pedazos y se cortó: {paso.motivo}
            </p>
          </div>
        </div>

        <p className="rounded-xl bg-rojo-fondo px-3 py-2 text-sm leading-6 text-rojo-texto">
          Volvé a intentar con señal. Lo que ya entró queda guardado, así que la
          próxima vez tarda menos.
        </p>

        {haySenal ? (
          <Boton anchoCompleto onClick={() => void bajar("simple")}>
            Intentar de nuevo
          </Boton>
        ) : null}
      </Tarjeta>
    );
  }

  if (mapa) {
    // El mapa puede estar bajado y aun así faltar una foto que se agregó
    // después. Se dice acá, con señal, no en el cerro.
    const fotosQueFaltan =
      sectoresConFotosSinBajar([sector], anotaciones, [mapa])[0]?.cuantas ?? 0;

    return (
      <Tarjeta
        tono="alta"
        franja={fotosQueFaltan > 0 ? "ambar" : "verde"}
        className="space-y-3"
      >
        <div className="flex items-start gap-3">
          {fotosQueFaltan > 0 ? <IconoAviso /> : <IconoListo />}
          <div className="min-w-0 flex-1">
            {fotosQueFaltan > 0 ? (
              <>
                <p className="text-base font-semibold text-ambar-texto">
                  {fotosQueFaltan === 1
                    ? "Falta bajar una foto de anotación"
                    : `Faltan bajar ${fotosQueFaltan} fotos de anotación`}
                </p>
                <p className="mt-1 text-sm leading-6 text-texto-suave">
                  El mapa está en el celular, pero esas fotos se agregaron
                  después. Sin señal no las vas a poder ver.
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-semibold text-texto">
                  Podés salir sin señal
                </p>
                <p className="mt-1 text-sm leading-6 text-texto-suave">
                  El mapa simple de este sector está en este celular.
                </p>
              </>
            )}
          </div>
        </div>

        {fallaDeFotos ? (
          <p
            role="alert"
            className="rounded-xl bg-ambar-fondo px-3 py-2 text-sm leading-6 text-ambar-texto"
          >
            {fallaDeFotos}
          </p>
        ) : null}

        {fotosQueFaltan > 0 && haySenal ? (
          <Boton anchoCompleto onClick={() => void bajar("simple")}>
            Bajar las fotos que faltan
          </Boton>
        ) : null}

        <dl className="grid grid-cols-2 gap-2 border-t border-borde pt-3">
          <div>
            <dt className="text-xs text-texto-suave">Ocupa</dt>
            <dd className="mt-0.5 text-base font-semibold tabular-nums text-texto">
              {mostrarPeso(mapa.bytes)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-texto-suave">Bajado el</dt>
            <dd className="mt-0.5 text-base font-semibold text-texto">
              {fechaEnPalabras(mapa.bajadoEn)}
            </dd>
          </div>
        </dl>

        <Boton
          variante="destructivo"
          anchoCompleto
          disabled={sacando}
          onClick={() => void alSacar()}
        >
          {sacando ? "Sacando…" : "Sacar del celular"}
        </Boton>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta tono="alta" franja="ambar" className="space-y-3">
      <Rotulo>El mapa de este sector</Rotulo>
      <p className="text-base font-semibold text-texto">Todavía no lo bajaste</p>
      <p className="text-sm leading-6 text-texto-suave">
        Bajalo ahora, desde casa. En el cerro no vas a tener con qué. Pesa{" "}
        <strong className="font-semibold text-dato">
          {mostrarPeso(pesoAproximadoDelMapa(sector.rectangulo))}
        </strong>{" "}
        más o menos.
      </p>

      {haySenal ? (
        <Boton anchoCompleto onClick={() => void bajar("simple")}>
          Bajar el mapa
        </Boton>
      ) : null}
    </Tarjeta>
  );
}

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
      {children}
    </h3>
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
