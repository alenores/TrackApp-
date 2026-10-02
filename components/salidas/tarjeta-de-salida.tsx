"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Boton, clasesDeBoton } from "@/components/ui/boton";
import { Emergente } from "@/components/ui/emergente";
import { Tarjeta } from "@/components/ui/tarjeta";
import { InsigniasDeActividad } from "@/components/rutas/insignias-de-actividad";
import { mostrarDesnivel, mostrarEsfuerzo, mostrarLargo } from "@/lib/rutas/actividades";
import { diaEnPalabras } from "@/lib/fechas";
import type { Salida } from "@/types/database";

/**
 * Una salida en la lista: la portada, quién fue, qué hicieron y los números.
 *
 * Solo dibuja. Borrar lo decide la pantalla, que sabe si hay señal.
 */

type Props = {
  salida: Salida;
  /** Está la acción de borrar: es de quien la mira y hay señal. */
  puedeBorrar: boolean;
  borrando: boolean;
  alBorrar: () => void;
};

export function TarjetaDeSalida({ salida, puedeBorrar, borrando, alBorrar }: Props) {
  const [fotoAbierta, setFotoAbierta] = useState<string | null>(null);
  const [portada, ...resto] = salida.fotos;

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
    <Tarjeta className="space-y-4 overflow-hidden">
      {portada ? (
        <button
          type="button"
          onClick={() => setFotoAbierta(portada)}
          aria-label="Ver la portada en grande"
          className="-mx-4 -mt-4 block w-[calc(100%+2rem)] cursor-zoom-in"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={portada}
            alt={`Portada de «${salida.titulo}»`}
            loading="lazy"
            className="max-h-80 w-full bg-fondo object-cover"
          />
        </button>
      ) : null}

      <div className="space-y-1">
        <h2 className="text-lg font-semibold leading-tight text-texto">{salida.titulo}</h2>
        <p className="text-sm text-texto-suave">{diaEnPalabras(salida.fecha)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-2">
          <Avatar src={salida.perfil.avatarUrl} name={salida.perfil.nombre} size="sm" />
          <span className="text-base font-medium text-texto">{salida.perfil.nombre}</span>
        </div>
        {salida.companeros.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-texto-suave">con</span>
            <div className="flex -space-x-2">
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
            <span className="text-sm text-texto-suave">
              {salida.companeros.map((companero) => companero.nombre).join(", ")}
            </span>
          </div>
        ) : null}
      </div>

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

      {salida.descripcion ? (
        <p className="whitespace-pre-line text-base leading-7 text-texto">{salida.descripcion}</p>
      ) : null}

      {resto.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {resto.map((foto, indice) => (
            <button
              key={foto}
              type="button"
              onClick={() => setFotoAbierta(foto)}
              aria-label={`Ver la foto ${indice + 2} en grande`}
              className="cursor-zoom-in overflow-hidden rounded-xl border border-borde-suave"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto} alt="" loading="lazy" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {salida.archivoUrl || puedeBorrar ? (
        <div className="flex flex-wrap gap-2">
          {salida.archivoUrl ? (
            <a href={salida.archivoUrl} download className={clasesDeBoton("secundario")}>
              Bajar el archivo GPS
            </a>
          ) : null}
          {puedeBorrar ? (
            <Boton variante="destructivo" disabled={borrando} onClick={alBorrar}>
              {borrando ? "Borrando…" : "Borrar"}
            </Boton>
          ) : null}
        </div>
      ) : null}

      <Emergente
        abierto={fotoAbierta !== null}
        alCerrar={() => setFotoAbierta(null)}
        titulo={salida.titulo}
        ancho="amplio"
      >
        {fotoAbierta ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fotoAbierta} alt={`Foto de «${salida.titulo}»`} className="w-full rounded-xl" />
        ) : null}
      </Emergente>
    </Tarjeta>
  );
}
