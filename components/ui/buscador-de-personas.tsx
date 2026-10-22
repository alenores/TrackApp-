"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Campo } from "@/components/ui/campo";
import { buscarPersonas } from "@/lib/perfiles/buscar";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";
import type { PerfilBreve } from "@/types/database";

/**
 * Elegir personas buscándolas por nombre, para los filtros: Participantes en
 * Salidas y Creado por en Circuitos. Una lista de botones con todos los
 * usuarios se vuelve eterna; acá se escribe y aparecen los que coinciden,
 * cada uno con su foto. Las elegidas quedan debajo, con su foto y su cruz.
 *
 * Busca sobre los usuarios que ya llegaron al celular: no sale a internet.
 */

type Props = {
  etiqueta: string;
  ayuda?: string;
  id: string;
  personas: PerfilBreve[];
  elegidas: string[];
  alCambiar: (elegidas: string[]) => void;
};

export function BuscadorDePersonas({ etiqueta, ayuda, id, personas, elegidas, alCambiar }: Props) {
  const [texto, setTexto] = useState("");
  const resultado = buscarPersonas(personas, texto, elegidas);
  const nombreDe = (perfilId: string) => personas.find((persona) => persona.id === perfilId);

  return (
    <div className="space-y-2">
      <Campo
        label={etiqueta}
        ayuda={ayuda}
        id={id}
        type="search"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        placeholder="Escribí un nombre"
        autoComplete="off"
        spellCheck={false}
        maxLength={60}
      />

      {texto.trim() ? (
        <div className="overflow-hidden rounded-xl border border-borde bg-superficie">
          {resultado.lista.length === 0 ? (
            <p role="status" className="px-3 py-2 text-base text-texto-suave">
              Nadie se llama así. Probá con otro nombre.
            </p>
          ) : (
            <ul aria-label={`${etiqueta}: resultados`}>
              {resultado.lista.map((persona, indice) => (
                <li key={persona.id} className={indice > 0 ? "border-t border-borde" : ""}>
                  <button
                    type="button"
                    onClick={() => {
                      alCambiar([...elegidas, persona.id]);
                      setTexto("");
                    }}
                    className={`${CLASE_DE_RESPUESTA_AL_TOQUE} flex min-h-10 w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-superficie-alta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-acento-borde`}
                  >
                    <Avatar src={persona.avatarUrl} name={persona.nombre} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-base font-semibold text-texto">{persona.nombre}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {resultado.hayMas ? (
            <p role="status" className="border-t border-borde px-3 py-2 text-base text-texto-suave">
              Hay más. Seguí escribiendo para achicar la lista.
            </p>
          ) : null}
        </div>
      ) : null}
      {elegidas.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label={`${etiqueta} elegidos`}>
          {elegidas.map((perfilId) => {
            const persona = nombreDe(perfilId);
            const nombre = persona?.nombre ?? "alguien que ya no está";
            return (
              <li key={perfilId}>
                <span className="inline-flex h-10 items-center gap-1.5 rounded-full border border-acento-borde bg-verde-fondo pl-1 text-sm font-semibold text-verde-texto">
                  <Avatar src={persona?.avatarUrl} name={nombre} size="sm" className="h-8 w-8" />
                  {nombre}
                  <button
                    type="button"
                    onClick={() => alCambiar(elegidas.filter((cada) => cada !== perfilId))}
                    aria-label={`Sacar a ${nombre}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-lg leading-none hover:bg-superficie-alta"
                  >
                    ×
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

    </div>
  );
}
