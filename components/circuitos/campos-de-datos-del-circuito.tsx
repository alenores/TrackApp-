"use client";

import { AreaDeTexto } from "@/components/ui/area-de-texto";
import { Boton } from "@/components/ui/boton";
import { CirculoDeTecnica, VelocimetroEsfuerzo } from "@/components/rutas/indicadores-de-exigencia";
import { Tarjeta } from "@/components/ui/tarjeta";
import { LARGO_MAXIMO_DE_LOS_TEXTOS, type DatosDelCircuito } from "@/lib/circuitos/datos";
import { NIVELES_ESFUERZO } from "@/types/database";

/**
 * Lo que se carga a mano en un Circuito: técnica, esfuerzo, qué llevar,
 * complicaciones y comentario (decisión 049). Todo puede quedar sin cargar.
 * El largo y el desnivel no están acá: se calculan solos.
 */


export function CamposDeDatosDelCircuito({ datos, alCambiar, deshabilitado = false }: {
  datos: DatosDelCircuito;
  /** Recibe solo lo que cambió: así dos cambios seguidos no se pisan. */
  alCambiar: (cambio: Partial<DatosDelCircuito>) => void;
  deshabilitado?: boolean;
}) {
  const cambiar = alCambiar;
  return (
    <Tarjeta className="space-y-4">
      <h2 className="text-xl font-bold text-texto">Datos del Circuito</h2>
      <p className="text-base text-texto-suave">El largo y el desnivel se calculan solos al guardar, con la línea del Circuito y el relieve del terreno.</p>
      {/* Diez circulitos: el que se toca se llena, y también todos los de la izquierda. */}
      <div role="radiogroup" aria-label="Técnica" className="space-y-1.5">
        <p className="text-sm font-medium text-texto-suave">Técnica</p>
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, indice) => {
            const valor = indice + 1;
            const elegida = datos.tecnica === valor;
            const lleno = datos.tecnica !== null && valor <= datos.tecnica;
            return (
              <button
                key={valor}
                type="button"
                role="radio"
                aria-checked={elegida}
                aria-label={`${valor} de 10`}
                disabled={deshabilitado}
                onClick={() => cambiar({ tecnica: elegida ? null : valor })}
                className="flex h-8 min-w-0 flex-1 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde disabled:opacity-50"
              >
                <CirculoDeTecnica lleno={lleno} className="h-5 w-5" />
              </button>
            );
          })}
        </div>
      </div>
      <div role="radiogroup" aria-label="Esfuerzo" className="space-y-1.5">
        <p className="text-sm font-medium text-texto-suave">Esfuerzo</p>
        <div className="grid grid-cols-4 gap-2">
          {NIVELES_ESFUERZO.map((nivel) => {
            const elegido = datos.nivelEsfuerzo === nivel;
            return (
              <Boton key={nivel} role="radio" aria-checked={elegido} variante={elegido ? "principal" : "secundario"} disabled={deshabilitado}
                className="py-1.5" onClick={() => cambiar({ nivelEsfuerzo: elegido ? null : nivel })}>
                <VelocimetroEsfuerzo esfuerzo={nivel} />
              </Boton>
            );
          })}
        </div>
      </div>
      <AreaDeTexto
        label="Qué llevar"
        id="que-llevar-del-circuito"
        rows={2}
        maxLength={LARGO_MAXIMO_DE_LOS_TEXTOS}
        disabled={deshabilitado}
        value={datos.queLlevar ?? ""}
        onChange={(evento) => cambiar({ queLlevar: evento.target.value })}
        placeholder="Agua, abrigo, repuestos: lo que no puede faltar."
      />
      <AreaDeTexto
        label="Complicaciones"
        id="complicaciones-del-circuito"
        rows={2}
        maxLength={LARGO_MAXIMO_DE_LOS_TEXTOS}
        disabled={deshabilitado}
        value={datos.complicaciones ?? ""}
        onChange={(evento) => cambiar({ complicaciones: evento.target.value })}
        placeholder="Vados, tranqueras, tramos que se ponen feos."
      />
      <AreaDeTexto
        label="Comentario"
        id="comentario-del-circuito"
        rows={3}
        maxLength={LARGO_MAXIMO_DE_LOS_TEXTOS}
        disabled={deshabilitado}
        value={datos.comentario ?? ""}
        onChange={(evento) => cambiar({ comentario: evento.target.value })}
      />
    </Tarjeta>
  );
}
