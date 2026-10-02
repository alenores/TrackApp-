"use client";

import { Avatar } from "@/components/ui/avatar";
import { Enlace } from "@/components/ui/enlace";
import { InsigniasDeActividad } from "@/components/rutas/insignias-de-actividad";
import { mostrarDesnivel, mostrarEsfuerzo, mostrarLargo } from "@/lib/rutas/actividades";
import { dibujarLinea } from "@/lib/salidas/linea";
import { diaEnPalabras } from "@/lib/fechas";
import type { Salida } from "@/types/database";

/**
 * Las partes con que se dibuja una salida. Las usan la tarjeta de la lista y
 * la ficha, así las dos muestran lo mismo de la misma forma.
 */

/** La zona de la portada donde se dibuja la línea, en un cuadrado de 320. */
const ZONA_DE_LA_LINEA = { x: 108, y: 72, ancho: 140, alto: 196 };

/**
 * La portada, a la manera de Strava: la foto cuadrada con el título y el día
 * arriba, los números apilados a la izquierda y la línea de la salida en el
 * medio, directo sobre la foto.
 *
 * Todo lo de encima va claro sobre degradés oscuros, igual en modo sol y en
 * modo noche: la foto no cambia con el modo. Sin foto, el mismo dibujo va
 * sobre un fondo oscuro fijo.
 *
 * `margenDeTarjeta` la pega a los bordes cuando va adentro de una tarjeta.
 */
export function PortadaDeSalida({
  salida,
  margenDeTarjeta = false,
}: {
  salida: Salida;
  margenDeTarjeta?: boolean;
}) {
  const portada = salida.fotos[0];
  const dibujo = salida.linea ? dibujarLinea(salida.linea, ZONA_DE_LA_LINEA) : null;

  const numeros = [
    salida.largoKm !== null ? { nombre: "Largo", valor: mostrarLargo(salida.largoKm) } : null,
    salida.desnivelPositivoM !== null
      ? { nombre: "Subida", valor: mostrarDesnivel(salida.desnivelPositivoM, "positivo") }
      : null,
    salida.nivelEsfuerzo !== null
      ? { nombre: "Esfuerzo", valor: mostrarEsfuerzo(salida.nivelEsfuerzo) }
      : null,
  ].filter((numero) => numero !== null);

  return (
    <div
      className={[
        "relative aspect-square overflow-hidden bg-sobre-foto-fondo",
        margenDeTarjeta ? "-mx-4 -mt-4" : "rounded-2xl",
      ].join(" ")}
    >
      {portada ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={portada}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}

      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-sobre-foto-degrade/80 via-sobre-foto-degrade/45 to-sobre-foto-degrade/20"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-sobre-foto-degrade/70 to-transparent"
      />

      {dibujo ? (
        <svg
          viewBox="0 0 320 320"
          aria-hidden
          className="absolute inset-0 h-full w-full"
        >
          <path
            d={dibujo.trazo}
            fill="none"
            className="stroke-sobre-foto-degrade"
            strokeOpacity={0.55}
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={dibujo.trazo}
            fill="none"
            className="stroke-sobre-foto-linea"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx={dibujo.inicio[0]}
            cy={dibujo.inicio[1]}
            r={5.5}
            className="fill-sobre-foto-texto stroke-sobre-foto-degrade"
            strokeWidth={1.5}
          />
          <circle
            cx={dibujo.fin[0]}
            cy={dibujo.fin[1]}
            r={5.5}
            className="fill-sobre-foto-linea stroke-sobre-foto-texto"
            strokeWidth={2}
          />
        </svg>
      ) : null}

      <div className="absolute left-4 right-16 top-3.5 space-y-0.5">
        <h2 className="text-lg font-bold leading-tight text-sobre-foto-texto drop-shadow">
          {salida.titulo}
        </h2>
        <p className="text-sm font-medium text-sobre-foto-texto-suave drop-shadow">
          {diaEnPalabras(salida.fecha)}
        </p>
      </div>

      {numeros.length > 0 ? (
        <dl className="absolute left-4 top-1/2 flex -translate-y-1/3 flex-col gap-3.5">
          {numeros.map((numero) => (
            <div key={numero.nombre}>
              <dt className="text-xs font-medium uppercase tracking-[0.06em] text-sobre-foto-texto-suave drop-shadow">
                {numero.nombre}
              </dt>
              <dd className="text-xl font-bold leading-tight tabular-nums text-sobre-foto-texto drop-shadow">
                {numero.valor}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

/** «Alejandro», «Alejandro y Diego», «Alejandro y 2 más». */
export function quienesFueron(salida: Salida): string {
  const cuantos = salida.companeros.length;
  if (cuantos === 0) return salida.perfil.nombre;
  if (cuantos === 1) return `${salida.perfil.nombre} y ${salida.companeros[0].nombre}`;
  return `${salida.perfil.nombre} y ${cuantos} más`;
}

/** Las caras de los que fueron, una encima de la otra, y sus nombres resumidos. */
export function ParticipantesDeSalida({ salida }: { salida: Salida }) {
  const personas = [salida.perfil, ...salida.companeros];
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex shrink-0 -space-x-2">
        {personas.map((persona) => (
          <Avatar
            key={persona.id || "autor"}
            src={persona.avatarUrl}
            name={persona.nombre}
            size="sm"
            className="ring-2 ring-superficie"
          />
        ))}
      </div>
      <span className="min-w-0 truncate text-sm text-texto-suave">{quienesFueron(salida)}</span>
    </div>
  );
}

/** Quién la cargó y, en la fila de abajo, con quién fue. Para la ficha. */
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

/** Qué hicieron y todos los números que haya. Para la ficha. */
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
