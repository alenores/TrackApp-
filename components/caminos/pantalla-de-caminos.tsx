"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { retirarCamino } from "@/app/actions/caminos";
import { BotonAgregar } from "@/components/ui/boton-agregar";
import { MenuDeAcciones } from "@/components/ui/menu-de-acciones";
import { useDialogos } from "@/components/ui/dialogos";
import { Tarjeta } from "@/components/ui/tarjeta";
import { TraerCaminosDeAfuera } from "@/components/caminos/traer-caminos-de-afuera";
import { EditorDeCamino } from "@/components/caminos/editor-de-camino";
import type { CaminoSinLinea } from "@/lib/caminos/datos";
import { mostrarActividad } from "@/lib/rutas/actividades";
import { ponerAlDiaDespuesDeGuardar } from "@/lib/offline/puesta-al-dia";

type Propiedades = {
  caminos: CaminoSinLinea[];
  puedeSumar: boolean;
  miPerfilId: string | null;
  esAdministrador: boolean;
};

export function PantallaDeCaminos({ caminos, puedeSumar, miPerfilId, esAdministrador }: Propiedades) {
  const [trayendo, setTrayendo] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const router = useRouter();
  const { confirmar, avisar } = useDialogos();

  const eliminar = async (camino: CaminoSinLinea) => {
    const seguro = await confirmar({ titulo: `¿Retirar «${camino.nombre}»?`,
      mensaje: "Dejará de verse en el mapa. Esta acción no se puede deshacer desde la app.",
      textoDeAceptar: "Retirar Camino", destructivo: true });
    if (!seguro) return;
    try {
      const resultado = await retirarCamino(camino.id, camino.actualizadoEn);
      if (!resultado.ok) { await avisar({ titulo: "No se retiró el Camino", mensaje: resultado.error }); return; }
      await ponerAlDiaDespuesDeGuardar();
      router.refresh();
    } catch (error) {
      await avisar({ titulo: "No se retiró el Camino",
        mensaje: `${error instanceof Error ? error.message : String(error)}. Probá de nuevo con señal.` });
    }
  };

  if (trayendo) return <TraerCaminosDeAfuera alVolver={() => setTrayendo(false)} />;
  if (editandoId !== null) return <EditorDeCamino id={editandoId} alVolver={() => setEditandoId(null)} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-texto">Caminos del mapa</h2>
        {puedeSumar ? <BotonAgregar etiqueta="Agregar Camino" alTocar={() => setTrayendo(true)} /> : null}
      </div>
      {!puedeSumar ? <p className="text-base text-texto-suave">Podés consultar los Caminos. Solo Administrador y Premium pueden sumarlos o cambiarlos.</p> : null}
      {caminos.length === 0 ? (
        <Tarjeta><p className="text-base text-texto-suave">Todavía no hay Caminos en el mapa.</p></Tarjeta>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {caminos.map((camino) => (
            <Tarjeta key={camino.id} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold text-texto">{camino.nombre}</h3>
                {puedeSumar && (esAdministrador || camino.perfilId === miPerfilId) ?
                  <MenuDeAcciones etiqueta={`Opciones de ${camino.nombre}`}
                    acciones={[
                      { etiqueta: "Editar", alElegir: () => setEditandoId(camino.id) },
                      { etiqueta: "Eliminar", destructiva: true, alElegir: () => void eliminar(camino) },
                    ]} /> : null}
              </div>
              <p className="text-base text-texto-suave">{(camino.largoM / 1000).toFixed(1).replace(".", ",")} km · {camino.partes.length} {camino.partes.length === 1 ? "parte" : "partes"}</p>
              <p className="text-base text-texto">{camino.actividades.map((actividad) => mostrarActividad(actividad).etiqueta).join(" · ")}</p>
            </Tarjeta>
          ))}
        </div>
      )}
    </div>
  );
}
