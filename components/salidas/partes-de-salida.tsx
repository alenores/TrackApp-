"use client";

import { Avatar } from "@/components/ui/avatar";
import { Enlace } from "@/components/ui/enlace";
import { mostrarDesnivel, mostrarEsfuerzo, mostrarLargo } from "@/lib/rutas/actividades";
import { PROPORCION_DE_LA_PORTADA_DE_SALIDA } from "@/lib/fotos/preparar";
import { dibujarLinea } from "@/lib/salidas/linea";
import { diaEnPalabras } from "@/lib/fechas";
import type { Salida } from "@/types/database";

/**
 * Las partes con que se dibuja una salida. Las usan la tarjeta de la lista y
 * la ficha, así las dos muestran lo mismo de la misma forma.
 */

/** El lienzo de la portada: 320 de ancho, y el alto que da su proporción. */
const ANCHO_DEL_LIENZO = 320;
const ALTO_DEL_LIENZO = Math.round(ANCHO_DEL_LIENZO / PROPORCION_DE_LA_PORTADA_DE_SALIDA);

/**
 * Dónde se dibuja la línea: chica, centrada, debajo de los números. Es una
 * firma del recorrido, no un mapa: si fuera grande taparía la foto.
 */
const ZONA_DE_LA_LINEA = { x: 130, y: 146, ancho: 60, alto: 50 };

/** El velo que aparta los números de la foto sin apagarla. */
const VELO_DEL_CENTRO =
  "radial-gradient(ellipse at 50% 55%, color-mix(in srgb, var(--sobre-foto-degrade) 35%, transparent) 0%, transparent 70%)";

/**
 * La portada, a la manera de Strava: un bloque liviano y centrado con los
 * números en fila y, debajo, una firma chica y fina del recorrido. El título y
 * el día, arriba a la izquierda. La foto casi no se oscurece: queda de fondo,
 * entremezclada con los datos, no tapada por ellos (pedido de Ale, 2026-10-02).
 *
 * Todo lo de encima va claro, igual en modo sol y en modo noche: la foto no
 * cambia con el modo. Sin foto, lo mismo va sobre un fondo oscuro fijo.
 *
 * `margenDeTarjeta` la pega a los bordes cuando va adentro de una tarjeta.
 * `conDatos={false}` deja solo la foto, el título y el día: en la ficha los
 * números y la línea van afuera.
 */
export function PortadaDeSalida({
  salida,
  margenDeTarjeta = false,
  conDatos = true,
}: {
  salida: Salida;
  margenDeTarjeta?: boolean;
  conDatos?: boolean;
}) {
  const portada = salida.fotos[0];
  const dibujo =
    conDatos && salida.linea ? dibujarLinea(salida.linea, ZONA_DE_LA_LINEA) : null;

  const numeros = !conDatos ? [] : [
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
        "relative overflow-hidden bg-sobre-foto-fondo",
        margenDeTarjeta ? "-mx-4 -mt-4" : "rounded-2xl",
      ].join(" ")}
      style={{ aspectRatio: PROPORCION_DE_LA_PORTADA_DE_SALIDA }}
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

      {numeros.length > 0 || dibujo ? (
        <div aria-hidden className="absolute inset-0" style={{ background: VELO_DEL_CENTRO }} />
      ) : null}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[28%] bg-gradient-to-b from-sobre-foto-degrade/45 to-transparent"
      />

      {dibujo ? (
        <svg
          viewBox={`0 0 ${ANCHO_DEL_LIENZO} ${ALTO_DEL_LIENZO}`}
          aria-hidden
          className="absolute inset-0 h-full w-full drop-shadow"
        >
          {/* El grosor no crece con la foto: fina en el celular y en la computadora. */}
          <path
            d={dibujo.trazo}
            fill="none"
            className="stroke-sobre-foto-linea"
            strokeOpacity={0.9}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}

      <div className="absolute left-3.5 right-16 top-2.5">
        <h2 className="truncate text-base font-semibold leading-tight text-sobre-foto-texto drop-shadow">
          {salida.titulo}
        </h2>
        <p className="text-xs font-medium text-sobre-foto-texto-suave drop-shadow">
          {diaEnPalabras(salida.fecha)}
        </p>
      </div>

      {numeros.length > 0 ? (
        <dl className="absolute inset-x-0 top-[44%] flex -translate-y-1/2 justify-center gap-6 px-3 text-center drop-shadow">
          {numeros.map((numero) => (
            <div key={numero.nombre}>
              <dt className="text-xs font-medium uppercase leading-4 tracking-[0.08em] text-sobre-foto-texto-suave">
                {numero.nombre}
              </dt>
              <dd className="text-lg font-semibold leading-6 tabular-nums text-sobre-foto-texto">
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

/** Todos los números que haya, en dos columnas. Para la ficha. */
export function NumerosDeSalida({ salida }: { salida: Salida }) {
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

  if (numeros.length === 0) return null;

  return (
    <dl className="grid min-w-0 flex-1 grid-cols-2 content-center gap-3 rounded-xl border border-borde-suave bg-fondo px-3 py-3">
      {numeros.map((numero) => (
        <div key={numero.nombre}>
          <dt className="text-xs text-texto-suave">{numero.nombre}</dt>
          <dd className="mt-0.5 text-base font-semibold tabular-nums text-texto">{numero.valor}</dd>
        </div>
      ))}
    </dl>
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
