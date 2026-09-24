"use client";

import { useState, type ReactNode } from "react";
import { Emergente, BotonDeEmergente } from "@/components/ui/emergente";
import { Boton } from "@/components/ui/boton";
import { Desplegable } from "@/components/ui/desplegable";
import {
  CLASE_DE_TITULO_DE_SECCION,
  Opciones,
  type Opcion,
} from "@/components/ui/opciones";
import { InsigniaDeActividad } from "@/components/rutas/insignias-de-actividad";
import {
  CLASE_DE_COLOR_DE_ESFUERZO,
  CirculoDeTecnica,
  DibujoDeVelocimetro,
} from "@/components/rutas/indicadores-de-exigencia";
import { mostrarActividad, mostrarEsfuerzo } from "@/lib/rutas/actividades";
import {
  CIRCULOS_DE_TECNICA,
  SIN_FILTROS,
  dificultadMaxima,
  problemaDelLargo,
  type EstadoDelMapa,
  type FiltrosDeRutas as Filtros,
} from "@/lib/rutas/filtros";
import { vibrarAlTocar } from "@/lib/vibracion";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";
import {
  ACTIVIDADES_RUTA,
  NIVELES_ESFUERZO,
  type ActividadRuta,
  type NivelEsfuerzo,
  type Zona,
} from "@/types/database";

/**
 * La emergente para filtrar la lista de rutas.
 *
 * Todo lo que se elige acá se ve igual que en la tarjeta de la ruta: las
 * insignias de actividad, los circulitos de la técnica y el velocímetro del
 * esfuerzo. Así el filtro no hay que aprenderlo.
 *
 * Lo elegido no toca la lista hasta apretar «Ver rutas», pero el botón ya
 * dice cuántas van a quedar.
 */

type FiltrosDeRutasProps = {
  abierto: boolean;
  alCerrar: () => void;
  filtros: Filtros;
  alAplicar: (filtros: Filtros) => void;
  zonas: Zona[];
  /** Cuántas rutas quedarían con estos filtros. */
  contar: (filtros: Filtros) => number;
};

const OPCIONES_DE_MAPA: Opcion<EstadoDelMapa>[] = [
  { valor: "todos", etiqueta: "Da igual" },
  { valor: "completo", etiqueta: "Completo" },
  { valor: "falta", etiqueta: "Falta bajar" },
];

function alternar<T>(lista: T[], valor: T): T[] {
  return lista.includes(valor)
    ? lista.filter((cada) => cada !== valor)
    : [...lista, valor];
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-2 border-0 p-0">
      <legend className={`mb-2 p-0 ${CLASE_DE_TITULO_DE_SECCION}`}>
        {titulo}
      </legend>
      {children}
    </fieldset>
  );
}

const CLASE_DE_TOQUE = [
  CLASE_DE_RESPUESTA_AL_TOQUE,
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde",
].join(" ");

function CasilleroDeKm({
  id,
  etiqueta,
  valor,
  alCambiar,
  invalido,
}: {
  id: string;
  etiqueta: string;
  valor: string;
  alCambiar: (valor: string) => void;
  invalido: boolean;
}) {
  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      aria-label={etiqueta}
      aria-invalid={invalido || undefined}
      value={valor}
      onChange={(evento) => alCambiar(evento.target.value)}
      placeholder="—"
      className={[
        "h-12 w-20 rounded-xl border bg-fondo px-2 text-center text-base font-semibold tabular-nums text-texto",
        "focus:outline-none focus:ring-2 focus:ring-acento-borde",
        invalido ? "border-rojo-borde" : "border-borde-fuerte",
      ].join(" ")}
    />
  );
}

export function FiltrosDeRutas({
  abierto,
  alCerrar,
  filtros,
  alAplicar,
  zonas,
  contar,
}: FiltrosDeRutasProps) {
  const [borrador, setBorrador] = useState<Filtros>(filtros);
  const [estabaAbierto, setEstabaAbierto] = useState(abierto);

  // Cada vez que se abre, arranca desde lo que está aplicado en la lista.
  if (abierto !== estabaAbierto) {
    setEstabaAbierto(abierto);
    if (abierto) setBorrador(filtros);
  }

  const cambiar = (parcial: Partial<Filtros>) =>
    setBorrador((antes) => ({ ...antes, ...parcial }));

  const problema = problemaDelLargo(borrador);
  const cuantas = problema ? 0 : contar(borrador);
  const textoDeAplicar = problema
    ? "Revisá el largo"
    : cuantas === 0
      ? "Ninguna ruta"
      : `Ver ${cuantas} ruta${cuantas === 1 ? "" : "s"}`;

  return (
    <Emergente
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Filtrar rutas"
      acciones={
        <>
          <Boton
            variante="secundario"
            className="shrink-0 px-5"
            onClick={() => setBorrador(SIN_FILTROS)}
          >
            Limpiar
          </Boton>
          <BotonDeEmergente
            variante="principal"
            disabled={problema !== null || cuantas === 0}
            onClick={() => {
              alAplicar(borrador);
              alCerrar();
            }}
          >
            {textoDeAplicar}
          </BotonDeEmergente>
        </>
      }
    >
      <div className="space-y-6">
        {zonas.length > 0 ? (
          <Desplegable
            etiqueta="Zona"
            opciones={zonas.map((zona) => ({ valor: zona.id, etiqueta: zona.nombre }))}
            elegida={borrador.zonaId}
            alElegir={(zonaId) => cambiar({ zonaId })}
            textoDeNinguna="Todas las zonas"
          />
        ) : null}

        <Seccion titulo="Para qué sirve">
          <div className="flex flex-wrap gap-x-1">
            {ACTIVIDADES_RUTA.map((tipo: ActividadRuta) => {
              const elegida = borrador.actividades.includes(tipo);
              return (
                <button
                  key={tipo}
                  type="button"
                  aria-pressed={elegida}
                  aria-label={mostrarActividad(tipo).etiqueta}
                  onPointerDown={() => vibrarAlTocar()}
                  onClick={() =>
                    cambiar({ actividades: alternar(borrador.actividades, tipo) })
                  }
                  className={`flex min-h-14 items-center rounded-full px-0.5 ${CLASE_DE_TOQUE}`}
                >
                  <InsigniaDeActividad tipo={tipo} tamano="mediano" apagada={!elegida} />
                </button>
              );
            })}
          </div>
        </Seccion>

        <Seccion titulo="Largo en km">
          <div className="flex items-center gap-2 text-base text-texto-suave">
            <label htmlFor="filtro-largo-desde">Desde</label>
            <CasilleroDeKm
              id="filtro-largo-desde"
              etiqueta="Largo desde, en km"
              valor={borrador.largoDesde}
              alCambiar={(largoDesde) => cambiar({ largoDesde })}
              invalido={problema !== null}
            />
            <label htmlFor="filtro-largo-hasta">hasta</label>
            <CasilleroDeKm
              id="filtro-largo-hasta"
              etiqueta="Largo hasta, en km"
              valor={borrador.largoHasta}
              alCambiar={(largoHasta) => cambiar({ largoHasta })}
              invalido={problema !== null}
            />
            <span>km</span>
          </div>
          {problema ? (
            <p role="alert" className="text-sm leading-6 text-rojo-texto">
              {problema}
            </p>
          ) : null}
        </Seccion>

        <Seccion titulo="Dificultad técnica">
          <div className="-ml-3 flex items-center">
            {Array.from({ length: CIRCULOS_DE_TECNICA }).map((_, i) => {
              const circulo = i + 1;
              return (
                <button
                  key={circulo}
                  type="button"
                  aria-pressed={circulo <= borrador.circulosDeTecnica}
                  aria-label={`Dificultad hasta ${dificultadMaxima(circulo)}`}
                  onPointerDown={() => vibrarAlTocar()}
                  onClick={() =>
                    cambiar({
                      circulosDeTecnica:
                        borrador.circulosDeTecnica === circulo ? 0 : circulo,
                    })
                  }
                  className={`flex h-14 w-14 items-center justify-center rounded-full ${CLASE_DE_TOQUE}`}
                >
                  <CirculoDeTecnica
                    lleno={circulo <= borrador.circulosDeTecnica}
                    className="h-7 w-7"
                  />
                </button>
              );
            })}
          </div>
        </Seccion>

        <Seccion titulo="Esfuerzo">
          <div className="grid grid-cols-4 gap-1.5">
            {NIVELES_ESFUERZO.map((nivel: NivelEsfuerzo) => {
              const elegido = borrador.esfuerzos.includes(nivel);
              return (
                <button
                  key={nivel}
                  type="button"
                  aria-pressed={elegido}
                  onPointerDown={() => vibrarAlTocar()}
                  onClick={() => cambiar({ esfuerzos: alternar(borrador.esfuerzos, nivel) })}
                  className={[
                    CLASE_DE_TOQUE,
                    CLASE_DE_COLOR_DE_ESFUERZO[nivel],
                    "flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-xl border-2 bg-fondo px-1 text-sm font-bold leading-tight",
                    elegido ? "border-current bg-superficie-alta" : "border-borde",
                  ].join(" ")}
                >
                  <DibujoDeVelocimetro esfuerzo={nivel} className="h-5 w-9" />
                  {mostrarEsfuerzo(nivel)}
                </button>
              );
            })}
          </div>
        </Seccion>

        <Opciones
          etiqueta="Mapa en el celular"
          opciones={OPCIONES_DE_MAPA}
          elegidas={[borrador.mapa]}
          alElegir={(mapa) => cambiar({ mapa })}
          columnas={3}
          titulo="seccion"
        />
      </div>
    </Emergente>
  );
}
