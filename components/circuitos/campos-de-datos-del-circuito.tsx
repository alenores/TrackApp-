"use client";

import { AreaDeTexto } from "@/components/ui/area-de-texto";
import { Boton } from "@/components/ui/boton";
import { IndicadorTecnica, VelocimetroEsfuerzo } from "@/components/rutas/indicadores-de-exigencia";
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
      {/* Los mismos dibujos que la tarjeta del Circuito: lo que se elige acá es lo que se ve allá. */}
      <div role="radiogroup" aria-label="Técnica" className="space-y-1.5">
        <p className="text-sm font-medium text-texto-suave">Técnica — cuánto hay que saber, del 1 al 10</p>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((valor) => {
            const elegida = datos.tecnica === valor;
            return (
              <Boton key={valor} role="radio" aria-checked={elegida} variante={elegida ? "principal" : "secundario"} disabled={deshabilitado}
                className="flex-col gap-1 py-1.5" onClick={() => cambiar({ tecnica: elegida ? null : valor })}>
                <span className="text-base font-semibold">{valor}</span>
                <IndicadorTecnica tecnica={valor} />
              </Boton>
            );
          })}
        </div>
      </div>
      <div role="radiogroup" aria-label="Esfuerzo" className="space-y-1.5">
        <p className="text-sm font-medium text-texto-suave">Esfuerzo — cuánto cansa</p>
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
