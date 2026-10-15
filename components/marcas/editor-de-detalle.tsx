"use client";

import { useEffect, useRef } from "react";
import { BuscadorDelMapa } from "@/components/marcas/buscador-del-mapa";
import { LineasDelTerritorio } from "@/components/mapas/lineas-del-territorio";
import { useAlMarcar } from "@/hooks/use-al-marcar";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { FormularioDeAnotacion } from "@/components/anotaciones/formulario-de-anotacion";
import { EncabezadoDeMapas } from "@/components/mapas/pantalla-de-mapas";
import { MapaConPanel } from "@/components/ui/mapa-con-panel";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useAnotaciones } from "@/hooks/use-anotaciones";
import { CORDOBA_COMPLETA } from "@/lib/mapas/general";
import { queEs } from "@/components/anotaciones/icono-de-anotacion";

/**
 * Marcar un punto o dibujar un trazo, o cambiar uno que ya está, desde
 * Marcas. Se dibuja **sobre el mapa propio**, nunca sobre Google (decisión
 * 050).
 *
 * Al guardar, cerrar o borrar vuelve a la lista con lo que pasó.
 */

export type QueEditar = { clase: "nuevo"; tipo: "punto" | "trazo" } | { clase: "existente"; id: number };

export function EditorDeDetalle({ que, alVolver }: { que: QueEditar; alVolver: (mensaje: string | null) => void }) {
  const anotar = useAnotaciones({ clase: "cordoba" });
  const marcar = useAlMarcar();
  const esNuevo = que.clase === "nuevo";
  const enfoqueAnterior = useRef(anotar.enfoque);
  const mostrarLugar = marcar.mostrar;
  const empezo = useRef(false);
  const huboFormulario = useRef(false);
  const datosListos = anotar.estado !== "abriendo" && anotar.estado !== "sin_datos";

  // Una coordenada escrita mueve el mapa de un salto, aunque antes se haya buscado un pueblo.
  useEffect(() => {
    if (!esNuevo || anotar.enfoque === enfoqueAnterior.current) return;
    enfoqueAnterior.current = anotar.enfoque;
    if (anotar.enfoque) mostrarLugar(anotar.enfoque);
  }, [anotar.enfoque, esNuevo, mostrarLugar]);

  // Arranca una sola vez, apenas están los datos: marcando lo nuevo o con lo
  // existente abierto en el formulario.
  useEffect(() => {
    if (empezo.current || !datosListos) return;
    empezo.current = true;
    if (que.clase === "existente" && !anotar.anotaciones.some((cada) => cada.id === que.id)) {
      alVolver("Esa marca ya no está en el mapa: alguien la borró. La lista ya está al día.");
      return;
    }
    if (que.clase === "existente") anotar.abrir(que.id);
    else if (que.tipo === "punto") anotar.empezarUnPunto();
    else anotar.empezarUnTrazo();
  }, [datosListos, que, anotar, alVolver]);

  // Guardado, borrado o cerrado: el formulario se fue y se vuelve a la lista.
  useEffect(() => {
    if (anotar.borrador !== null) {
      huboFormulario.current = true;
      return;
    }
    if (huboFormulario.current && !anotar.guardando) alVolver(anotar.mensaje);
  }, [anotar.borrador, anotar.guardando, anotar.mensaje, alVolver]);

  const borrador = anotar.borrador;
  const queHacer = anotar.marcando
    ? borrador?.tipo === "trazo"
      ? "Tocá el mapa por donde va el trazo, de a un punto por vez."
      : "Tocá el mapa donde está el lugar."
    : null;
  // Lo existente lleva su nombre, el mismo que en la lista de Marcas.
  const titulo = que.clase === "existente"
    ? anotar.seleccionado
      ? anotar.seleccionado.comentario?.trim() || queEs(anotar.seleccionado)
      : borrador?.tipo === "trazo" ? "Trazo" : "Punto"
    : que.tipo === "trazo" ? "Trazo nuevo" : "Punto nuevo";

  return (
    <div className="space-y-3">
      <EncabezadoDeMapas titulo="Marcas" subtitulo={titulo} alVolver={() => alVolver(null)} volverDeshabilitado={anotar.guardando} />
      {anotar.estado === "abriendo" ? (
        <Tarjeta><p role="status" className="text-base text-texto-suave">Abriendo las marcas…</p></Tarjeta>
      ) : anotar.estado === "sin_datos" ? (
        <Tarjeta franja="ambar">
          <p role="alert" className="text-base text-texto">{anotar.aviso ?? "No llegaron los datos de la app."} Recargá la pantalla para volver a intentar.</p>
        </Tarjeta>
      ) : (
        <MapaConPanel
          mapa={
            <CargadorDeMapa
              enVivo
              llenarElAltoEnLaComputadora
              encuadre={(esNuevo ? marcar.vista : null) ?? anotar.enfoque ?? CORDOBA_COMPLETA}
              viaje={esNuevo ? marcar.viaje : 0}
              rectangulos={esNuevo ? marcar.rectangulos : []}
              anotaciones={anotar.enElMapa}
              marcandoPunto={anotar.marcando}
              alMarcarPunto={anotar.alTocarElMapa}
              mostrarFichaAnotacion={false}
              controlesAdicionales={esNuevo ? (
                <BuscadorDelMapa
                  zonas={marcar.zonas}
                  sectores={marcar.sectores}
                  caminosSinLinea={marcar.caminosSinLinea}
                  caminos={marcar.caminos}
                  anotaciones={marcar.anotaciones}
                  cargandoCaminos={marcar.cargandoCaminos}
                  alElegir={marcar.ir}
                />
              ) : null}
            />
          }
          debajoDelMapa={queHacer ? <p className="text-sm leading-6 text-texto-suave">{queHacer}</p> : null}
          panel={
            <div className="space-y-3">
              {esNuevo ? <LineasDelTerritorio valor={marcar.lineas} alElegir={marcar.setLineas} /> : null}
              <FormularioDeAnotacion anotar={anotar} />
            </div>
          }
        />
      )}
    </div>
  );
}
