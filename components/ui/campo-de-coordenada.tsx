"use client";

import { mostrarCoordenada, type LecturaDeCoordenada } from "@/lib/coordenadas";

/**
 * El campo donde se pega una coordenada.
 *
 * El usuario no escribe coordenadas: las copia de Google Maps. Así que el
 * campo acepta cualquier cosa —el link, los números sueltos, los grados— y
 * muestra en el momento qué entendió. Lo importante no es el campo: es el
 * cartel de abajo, que dice de dónde salieron los números.
 */

type CampoDeCoordenadaProps = {
  id: string;
  etiqueta: string;
  ayuda?: string;
  valor: string;
  lectura: LecturaDeCoordenada;
  alCambiar: (texto: string) => void;
};

export function CampoDeCoordenada({
  id,
  etiqueta,
  ayuda,
  valor,
  lectura,
  alCambiar,
}: CampoDeCoordenadaProps) {
  const avisoId = `${id}-aviso`;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-texto-suave">
        {etiqueta}
      </label>

      <input
        id={id}
        type="text"
        inputMode="text"
        autoComplete="off"
        value={valor}
        onChange={(evento) => alCambiar(evento.target.value)}
        placeholder="Pegá el link de Maps o los dos números"
        aria-describedby={avisoId}
        aria-invalid={lectura.clase === "error" ? true : undefined}
        className={[
          "min-h-14 w-full rounded-xl border bg-fondo px-4 py-3 text-base text-texto",
          "placeholder:text-texto-suave/50 focus:outline-none focus:ring-2 focus:ring-acento-borde",
          lectura.clase === "error"
            ? "border-rojo-borde"
            : "border-borde-fuerte focus:border-acento-borde",
        ].join(" ")}
      />

      <div id={avisoId} aria-live="polite">
        {lectura.clase === "vacio" ? (
          <p className="text-sm leading-6 text-texto-suave">
            {ayuda ??
              "En Google Maps tocá el punto, dale a Compartir y pegá el link acá."}
          </p>
        ) : null}

        {lectura.clase === "error" ? (
          <div className="flex items-start gap-2 rounded-xl border border-rojo-borde bg-rojo-fondo px-3 py-3">
            <IconoDeProblema />
            <div className="min-w-0">
              <p role="alert" className="text-sm font-semibold text-rojo-texto">
                {lectura.titulo}
              </p>
              <p className="mt-1 text-sm leading-6 text-texto-suave">
                {lectura.detalle}
              </p>
            </div>
          </div>
        ) : null}

        {lectura.clase === "leida" ? (
          <div
            className={[
              "flex items-start gap-2 rounded-xl border px-3 py-3",
              lectura.aviso
                ? "border-ambar-borde bg-ambar-fondo"
                : "border-verde-borde bg-verde-fondo",
            ].join(" ")}
          >
            {lectura.aviso ? <IconoDeAviso /> : <IconoDeListo />}
            <div className="min-w-0 flex-1">
              <p
                className={[
                  "text-sm font-semibold",
                  lectura.aviso ? "text-ambar-texto" : "text-verde-texto",
                ].join(" ")}
              >
                {lectura.aviso ? "Ojo con estos números" : "Leído"}
              </p>
              <p className="mt-1 text-base font-semibold tracking-wide text-dato tabular-nums">
                {mostrarCoordenada(lectura.lat, lectura.lon)}
              </p>
              <p className="mt-1 text-sm leading-6 text-texto-suave">
                {lectura.aviso ?? lectura.deDonde}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function IconoDeListo() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 h-5 w-5 shrink-0 text-verde-icono"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

function IconoDeAviso() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 h-5 w-5 shrink-0 text-ambar-icono"
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

function IconoDeProblema() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 h-5 w-5 shrink-0 text-rojo"
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
