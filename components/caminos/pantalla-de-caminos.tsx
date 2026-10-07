"use client";

import { useState } from "react";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { TraerCaminosDeAfuera } from "@/components/caminos/traer-caminos-de-afuera";
import { EditorDeCamino } from "@/components/caminos/editor-de-camino";
import type { CaminoSinLinea } from "@/lib/caminos/datos";
import { mostrarActividad } from "@/lib/rutas/actividades";

type Propiedades = {
  caminos: CaminoSinLinea[];
  puedeSumar: boolean;
  miPerfilId: string | null;
  esAdministrador: boolean;
};

export function PantallaDeCaminos({ caminos, puedeSumar, miPerfilId, esAdministrador }: Propiedades) {
  const [trayendo, setTrayendo] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  if (trayendo) return <TraerCaminosDeAfuera alVolver={() => setTrayendo(false)} />;
  if (editandoId !== null) return <EditorDeCamino id={editandoId} alVolver={() => setEditandoId(null)} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-texto">Caminos del mapa</h2>
        {puedeSumar ? <Boton onClick={() => setTrayendo(true)}>Traer de afuera</Boton> : null}
      </div>
      {!puedeSumar ? <p className="text-base text-texto-suave">Podés consultar los Caminos. Solo Administrador y Premium pueden sumarlos o cambiarlos.</p> : null}
      {caminos.length === 0 ? (
        <Tarjeta><p className="text-base text-texto-suave">Todavía no hay Caminos en el mapa.</p></Tarjeta>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {caminos.map((camino) => (
            <Tarjeta key={camino.id} className="space-y-2">
              <h3 className="text-lg font-semibold text-texto">{camino.nombre}</h3>
              <p className="text-base text-texto-suave">{(camino.largoM / 1000).toFixed(1).replace(".", ",")} km · {camino.partes.length} {camino.partes.length === 1 ? "parte" : "partes"}</p>
              <p className="text-base text-texto">{camino.actividades.map((actividad) => mostrarActividad(actividad).etiqueta).join(" · ")}</p>
              {puedeSumar && (esAdministrador || camino.perfilId === miPerfilId) ? (
                <Boton variante="secundario" onClick={() => setEditandoId(camino.id)}>Editar Camino</Boton>
              ) : null}
            </Tarjeta>
          ))}
        </div>
      )}
    </div>
  );
}
