"use client";

import { Avatar } from "@/components/ui/avatar";
import { Enlace } from "@/components/ui/enlace";
import { InsigniasDeActividad } from "@/components/rutas/insignias-de-actividad";
import { mostrarDesnivel, mostrarEsfuerzo, mostrarLargo } from "@/lib/rutas/actividades";
import { diaEnPalabras } from "@/lib/fechas";
import type { Salida } from "@/types/database";

/**
 * Las partes con que se dibuja una salida. Las usan la tarjeta de la lista y
 * la ficha, así las dos muestran lo mismo de la misma forma.
 */

/**
 * La portada con el título y el día escritos encima, sobre un degradé oscuro.
 * Sin portada, el título va solo, en el color normal del texto.
 *
 * `margenDeTarjeta` la pega a los bordes cuando va adentro de una tarjeta.
 */
export function PortadaDeSalida({
  salida,
  margenDeTarjeta = false,
  conLugarParaBoton = false,
}: {
  salida: Salida;
  margenDeTarjeta?: boolean;
  /** Deja libre la esquina de arriba a la derecha para el botón de tres puntitos. */
  conLugarParaBoton?: boolean;
}) {
  const portada = salida.fotos[0];

  if (!portada) {
    return (
      <div className={["space-y-1", conLugarParaBoton ? "pr-12" : ""].join(" ")}>
        <h2 className="text-lg font-semibold leading-tight text-texto">{salida.titulo}</h2>
        <p className="text-sm text-texto-suave">{diaEnPalabras(salida.fecha)}</p>
      </div>
    );
  }

  return (
    <div
      className={[
        "relative aspect-[16/9] overflow-hidden bg-fondo",
        margenDeTarjeta ? "-mx-4 -mt-4" : "rounded-2xl",
      ].join(" ")}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={portada}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-sobre-foto-degrade via-sobre-foto-degrade/30 to-transparent"
      />
      <div className="absolute inset-x-0 bottom-0 space-y-1 px-4 pb-3.5">
        <h2 className="text-lg font-bold leading-tight text-sobre-foto-texto drop-shadow-sm">
          {salida.titulo}
        </h2>
        <p className="text-sm font-medium text-sobre-foto-texto-suave">{diaEnPalabras(salida.fecha)}</p>
      </div>
    </div>
  );
}

/** Quién la cargó y, en la fila de abajo, con quién fue. */
export function PersonasDeSalida({ salida }: { salida: Salida }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Avatar src={salida.perfil.avatarUrl} name={salida.perfil.nombre} size="sm" />
        <span className="text-base font-medium text-texto">{salida.perfil.nombre}</span>
      </div>
      {salida.companeros.length > 0 ? (
        <div className="flex items-center gap-2">
          <div className="flex shrink-0 -space-x-2">
            {salida.companeros.map((companero) => (
              <Avatar
                key={companero.id}
                src={companero.avatarUrl}
                name={companero.nombre}
                size="sm"
                className="ring-2 ring-superficie"
              />
            ))}
          </div>
          <span className="min-w-0 text-sm leading-5 text-texto-suave">
            con {salida.companeros.map((companero) => companero.nombre).join(", ")}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/** Qué hicieron y los números que haya. Lo que no se cargó no se muestra. */
export function DatosDeSalida({ salida }: { salida: Salida }) {
  const numeros = [
    salida.largoKm !== null ? { nombre: "Largo", valor: mostrarLargo(salida.largoKm) } : null,
    salida.desnivelPositivoM !== null
      ? { nombre: "Se subió", valor: mostrarDesnivel(salida.desnivelPositivoM, "positivo") }
      : null,
    salida.desnivelNegativoM !== null
      ? { nombre: "Se bajó", valor: mostrarDesnivel(salida.desnivelNegativoM, "negativo") }
      : null,
    salida.nivelEsfuerzo !== null
      ? { nombre: "Esfuerzo", valor: mostrarEsfuerzo(salida.nivelEsfuerzo) }
      : null,
  ].filter((numero) => numero !== null);

  return (
    <>
      <InsigniasDeActividad actividades={salida.actividades} tamano="mediano" />
      {numeros.length > 0 ? (
        <dl className="grid grid-cols-2 gap-3 rounded-xl border border-borde-suave bg-fondo px-3 py-3 sm:grid-cols-4">
          {numeros.map((numero) => (
            <div key={numero.nombre}>
              <dt className="text-xs text-texto-suave">{numero.nombre}</dt>
              <dd className="mt-0.5 text-base font-semibold tabular-nums text-texto">{numero.valor}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </>
  );
}

/**
 * Los tres puntitos: llevan a editar la salida. Borrar está adentro de la
 * edición, nunca a un toque desde la lista.
 *
 * `sobreFoto` lo dibuja claro sobre fondo oscuro, para ir encima de la portada.
 */
export function BotonDeOpcionesDeSalida({
  salidaId,
  sobreFoto,
}: {
  salidaId: number;
  sobreFoto: boolean;
}) {
  return (
    <Enlace
      href={`/salidas/${salidaId}/editar`}
      aria-label="Editar la salida"
      title="Editar la salida"
      className={[
        "flex h-10 w-10 items-center justify-center rounded-full",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde",
        sobreFoto
          ? "bg-sobre-foto-degrade/60 text-sobre-foto-texto"
          : "border border-borde bg-superficie text-texto-suave hover:bg-superficie-alta hover:text-texto",
      ].join(" ")}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
        <circle cx="5" cy="12" r="1.8" />
        <circle cx="12" cy="12" r="1.8" />
        <circle cx="19" cy="12" r="1.8" />
      </svg>
    </Enlace>
  );
}
