"use client";

import { useState } from "react";
import { Emergente, BotonDeEmergente } from "@/components/ui/emergente";
import type { Zona } from "@/types/database";

export type FiltrosRutas = {
  zonaId: number | null;
  actividad: string | null;
  km: "todos" | "corta" | "media" | "larga";
  dificultad: number | null;
  esfuerzo: number | null;
  mapa: "todos" | "completo" | "falta";
};

export const FILTROS_POR_DEFECTO: FiltrosRutas = {
  zonaId: null,
  actividad: null,
  km: "todos",
  dificultad: null,
  esfuerzo: null,
  mapa: "todos",
};

type FiltrosDeRutasProps = {
  abierto: boolean;
  alCerrar: () => void;
  filtros: FiltrosRutas;
  alAplicar: (filtros: FiltrosRutas) => void;
  zonas: Zona[];
};

const ACTIVIDADES = [
  { id: "trekking", label: "Trekking" },
  { id: "trail_running", label: "Trail Running" },
  { id: "bici", label: "Bici" },
  { id: "moto", label: "Moto / Cuatri" },
  { id: "4x4", label: "4x4" },
  { id: "caballo", label: "Caballo" },
];

function BotonFiltro({
  label,
  activo,
  onClick,
}: {
  label: string;
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-medium transition-colors border ${
        activo
          ? "border-acento-borde bg-verde-fondo text-verde-texto"
          : "border-borde bg-superficie text-texto-suave hover:bg-superficie-alta hover:text-texto"
      }`}
    >
      {label}
    </button>
  );
}

export function FiltrosDeRutas({
  abierto,
  alCerrar,
  filtros,
  alAplicar,
  zonas,
}: FiltrosDeRutasProps) {
  const [draft, setDraft] = useState<FiltrosRutas>(filtros);

  const hayCambios = JSON.stringify(draft) !== JSON.stringify(filtros);
  const esPorDefecto = JSON.stringify(draft) === JSON.stringify(FILTROS_POR_DEFECTO);

  return (
    <Emergente
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Filtros"
      acciones={
        <>
          <BotonDeEmergente
            variante="principal"
            onClick={() => {
              alAplicar(draft);
              alCerrar();
            }}
          >
            {hayCambios ? "Aplicar filtros" : "Cerrar"}
          </BotonDeEmergente>
          {!esPorDefecto && (
            <BotonDeEmergente
              variante="destructivo"
              onClick={() => {
                setDraft(FILTROS_POR_DEFECTO);
                alAplicar(FILTROS_POR_DEFECTO);
                alCerrar();
              }}
            >
              Borrar filtros
            </BotonDeEmergente>
          )}
        </>
      }
    >
      <div className="p-4 space-y-8 overflow-y-auto max-h-[60vh]">
        
        {/* Zonas */}
        {zonas.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-texto uppercase tracking-widest">Zona</h3>
            <div className="flex flex-wrap gap-2">
              <BotonFiltro
                label="Todas"
                activo={draft.zonaId === null}
                onClick={() => setDraft({ ...draft, zonaId: null })}
              />
              {zonas.map((z) => (
                <BotonFiltro
                  key={z.id}
                  label={z.nombre}
                  activo={draft.zonaId === z.id}
                  onClick={() => setDraft({ ...draft, zonaId: z.id })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Vehículo / Actividad */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-texto uppercase tracking-widest">Actividad</h3>
          <div className="flex flex-wrap gap-2">
            <BotonFiltro
              label="Todas"
              activo={draft.actividad === null}
              onClick={() => setDraft({ ...draft, actividad: null })}
            />
            {ACTIVIDADES.map((a) => (
              <BotonFiltro
                key={a.id}
                label={a.label}
                activo={draft.actividad === a.id}
                onClick={() => setDraft({ ...draft, actividad: a.id })}
              />
            ))}
          </div>
        </div>

        {/* Distancia */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-texto uppercase tracking-widest">Distancia</h3>
          <div className="flex flex-wrap gap-2">
            <BotonFiltro
              label="Cualquiera"
              activo={draft.km === "todos"}
              onClick={() => setDraft({ ...draft, km: "todos" })}
            />
            <BotonFiltro
              label="Menos de 5 km"
              activo={draft.km === "corta"}
              onClick={() => setDraft({ ...draft, km: "corta" })}
            />
            <BotonFiltro
              label="Entre 5 y 20 km"
              activo={draft.km === "media"}
              onClick={() => setDraft({ ...draft, km: "media" })}
            />
            <BotonFiltro
              label="Más de 20 km"
              activo={draft.km === "larga"}
              onClick={() => setDraft({ ...draft, km: "larga" })}
            />
          </div>
        </div>

        {/* Dificultad */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-texto uppercase tracking-widest">Dificultad Técnica</h3>
          <div className="flex flex-wrap gap-2">
            <BotonFiltro
              label="Cualquiera"
              activo={draft.dificultad === null}
              onClick={() => setDraft({ ...draft, dificultad: null })}
            />
            {[1, 2, 3, 4].map((d) => (
              <BotonFiltro
                key={d}
                label={`Nivel ${d}`}
                activo={draft.dificultad === d}
                onClick={() => setDraft({ ...draft, dificultad: d })}
              />
            ))}
          </div>
        </div>

        {/* Esfuerzo */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-texto uppercase tracking-widest">Esfuerzo Físico</h3>
          <div className="flex flex-wrap gap-2">
            <BotonFiltro
              label="Cualquiera"
              activo={draft.esfuerzo === null}
              onClick={() => setDraft({ ...draft, esfuerzo: null })}
            />
            {[1, 2, 3, 4].map((e) => (
              <BotonFiltro
                key={e}
                label={`Nivel ${e}`}
                activo={draft.esfuerzo === e}
                onClick={() => setDraft({ ...draft, esfuerzo: e })}
              />
            ))}
          </div>
        </div>

        {/* Mapa */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-texto uppercase tracking-widest">Estado del Mapa</h3>
          <div className="flex flex-wrap gap-2">
            <BotonFiltro
              label="Cualquiera"
              activo={draft.mapa === "todos"}
              onClick={() => setDraft({ ...draft, mapa: "todos" })}
            />
            <BotonFiltro
              label="100% Offline"
              activo={draft.mapa === "completo"}
              onClick={() => setDraft({ ...draft, mapa: "completo" })}
            />
            <BotonFiltro
              label="Falta descargar"
              activo={draft.mapa === "falta"}
              onClick={() => setDraft({ ...draft, mapa: "falta" })}
            />
          </div>
        </div>

      </div>
    </Emergente>
  );
}
