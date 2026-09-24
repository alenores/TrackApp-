"use client";

import { Emergente, BotonDeEmergente } from "@/components/ui/emergente";
import { Boton } from "@/components/ui/boton";
import { CLASE_DE_TITULO_DE_SECCION } from "@/components/ui/opciones";
import { vibrarAlTocar } from "@/lib/vibracion";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";
import { hexDeLaRuta } from "@/lib/rutas/colores";
import type { RutasParaElegir } from "@/lib/navegacion/mapa-libre";
import type { RutaResumen } from "@/types/database";

/**
 * Qué rutas se ven en el mapa libre: todas, ninguna o algunas.
 *
 * Las de la zona donde estás van primero; las de zonas lejanas, después.
 * Es del cerro: cada renglón es de 64, para tocarlo con guantes.
 */

type Props = {
  abierto: boolean;
  alCerrar: () => void;
  eleccion: RutasParaElegir;
  apagadas: Set<number>;
  alCambiar: (apagadas: Set<number>) => void;
};

function Renglon({
  ruta,
  prendida,
  alTocar,
}: {
  ruta: RutaResumen;
  prendida: boolean;
  alTocar: () => void;
}) {
  return (
    <li className="border-b border-borde last:border-b-0">
      <button
        type="button"
        aria-pressed={prendida}
        onPointerDown={() => vibrarAlTocar()}
        onClick={alTocar}
        className={[
          CLASE_DE_RESPUESTA_AL_TOQUE,
          "flex min-h-16 w-full items-center gap-3 px-3 text-left text-lg text-texto",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-acento-borde",
        ].join(" ")}
      >
        <span
          aria-hidden
          className={[
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2",
            prendida ? "border-acento-borde bg-acento text-acento-texto" : "border-borde-fuerte",
          ].join(" ")}
        >
          {prendida ? (
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </span>
        <span
          aria-hidden
          className="h-1.5 w-6 shrink-0 rounded-full"
          style={{ backgroundColor: hexDeLaRuta(ruta.color) }}
        />
        <span className="min-w-0 flex-1 truncate">{ruta.nombre}</span>
      </button>
    </li>
  );
}

function Grupo({
  titulo,
  rutas,
  apagadas,
  alternar,
}: {
  titulo: string;
  rutas: RutaResumen[];
  apagadas: Set<number>;
  alternar: (id: number) => void;
}) {
  if (rutas.length === 0) return null;

  return (
    <section className="space-y-2">
      <h3 className={CLASE_DE_TITULO_DE_SECCION}>{titulo}</h3>
      <ul className="overflow-hidden rounded-xl border border-borde-fuerte bg-fondo">
        {rutas.map((ruta) => (
          <Renglon
            key={ruta.id}
            ruta={ruta}
            prendida={!apagadas.has(ruta.id)}
            alTocar={() => alternar(ruta.id)}
          />
        ))}
      </ul>
    </section>
  );
}

export function ElegirRutasDelMapa({ abierto, alCerrar, eleccion, apagadas, alCambiar }: Props) {
  const todas = [...eleccion.deTuZona, ...eleccion.otras];

  const alternar = (id: number) => {
    const nuevas = new Set(apagadas);
    if (nuevas.has(id)) nuevas.delete(id);
    else nuevas.add(id);
    alCambiar(nuevas);
  };

  return (
    <Emergente
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Rutas en el mapa"
      acciones={
        <BotonDeEmergente variante="principal" paraNavegacion onClick={alCerrar}>
          Listo
        </BotonDeEmergente>
      }
    >
      {todas.length === 0 ? (
        <p className="text-lg leading-7 text-texto-suave">
          No hay rutas guardadas en el celular.
        </p>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2">
            <Boton variante="secundario" paraNavegacion onClick={() => alCambiar(new Set())}>
              Todas
            </Boton>
            <Boton
              variante="secundario"
              paraNavegacion
              onClick={() => alCambiar(new Set(todas.map((ruta) => ruta.id)))}
            >
              Ninguna
            </Boton>
          </div>

          <Grupo
            titulo={eleccion.zona ? `En tu zona · ${eleccion.zona.nombre}` : ""}
            rutas={eleccion.deTuZona}
            apagadas={apagadas}
            alternar={alternar}
          />
          <Grupo
            titulo={eleccion.zona ? "Otras zonas" : "Todas las rutas"}
            rutas={eleccion.otras}
            apagadas={apagadas}
            alternar={alternar}
          />
        </div>
      )}
    </Emergente>
  );
}
