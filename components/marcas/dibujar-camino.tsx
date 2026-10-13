"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { FeatureCollection, LineString } from "geojson";
import { crearCaminoNuevo } from "@/app/actions/caminos";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { AreaDeTexto } from "@/components/ui/area-de-texto";
import { Boton } from "@/components/ui/boton";
import { BotonVolver } from "@/components/ui/boton-volver";
import { Campo } from "@/components/ui/campo";
import { Opciones } from "@/components/ui/opciones";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useDialogos } from "@/components/ui/dialogos";
import { useCerrarConAtras } from "@/hooks/use-cerrar-con-atras";
import { ACTIVIDADES } from "@/lib/rutas/actividades";
import { LARGO_MAXIMO_DE_LA_DESCRIPCION, LARGO_MAXIMO_DEL_NOMBRE } from "@/lib/caminos/datos";
import { CORDOBA_COMPLETA } from "@/lib/mapas/general";
import { ponerAlDiaDespuesDeGuardar } from "@/lib/offline/puesta-al-dia";
import type { ActividadRuta } from "@/types/database";

/**
 * **Dibujar un Camino a mano**, sobre el mapa propio (decisión 052).
 *
 * Primero la línea, de a un toque por punto; después el nombre y las
 * actividades, y recién ahí se guarda. Largo, alturas y desnivel no se cargan:
 * los calcula la app con el relieve del terreno al guardar (decisión 049). Si
 * la línea queda corrida, después se corrige como el mismo Camino.
 *
 * Nunca sobre Google: su imagen no se usa para crear coordenadas (decisión
 * 050).
 */

const PUNTOS_MINIMOS = 2;

export function DibujarCamino({ alVolver }: { alVolver: (mensaje: string | null) => void }) {
  const { confirmar } = useDialogos();
  const [puntos, setPuntos] = useState<number[][]>([]);
  const [paso, setPaso] = useState<"linea" | "datos">("linea");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [actividades, setActividades] = useState<ActividadRuta[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Traba inmediata: dos toques no crean dos Caminos.
  const ocupado = useRef(false);

  const linea = useMemo<FeatureCollection<LineString> | null>(() => puntos.length < PUNTOS_MINIMOS ? null : {
    type: "FeatureCollection",
    features: [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: puntos } }],
  }, [puntos]);

  const listo = nombre.trim().length > 0 && actividades.length > 0 && puntos.length >= PUNTOS_MINIMOS;

  const volver = async () => {
    if (guardando) return;
    if (puntos.length > 0) {
      const seguro = await confirmar({
        titulo: "¿Dejar el Camino sin guardar?",
        mensaje: "Se pierde lo que dibujaste.",
        textoDeAceptar: "Dejarlo",
        destructivo: true,
      });
      if (!seguro) return;
    }
    alVolver(null);
  };

  // El atrás del celular pregunta lo mismo que el botón de volver: lo
  // dibujado no se pierde de un toque.
  const volverRef = useRef(volver);
  useLayoutEffect(() => { volverRef.current = volver; });
  const alAtras = useCallback(() => void volverRef.current(), []);
  useCerrarConAtras(true, alAtras);

  const guardar = async () => {
    if (!listo || ocupado.current) return;
    ocupado.current = true;
    setGuardando(true);
    setError(null);
    try {
      const resultado = await crearCaminoNuevo({ nombre: nombre.trim(), descripcion: descripcion.trim() || null, actividades, coordenadas: puntos });
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      const puesta = await ponerAlDiaDespuesDeGuardar();
      alVolver(puesta.clase === "fallo"
        ? `El Camino «${resultado.datos.nombre}» quedó guardado, pero todavía no aparece en este celular: ${puesta.motivo}. Recargá con conexión.`
        : `Camino «${resultado.datos.nombre}» guardado.`);
    } catch (causa) {
      setError(`No se pudo guardar el Camino: ${causa instanceof Error ? causa.message : String(causa)}. Revisá la señal y volvé a intentar.`);
    } finally {
      ocupado.current = false;
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BotonVolver alVolver={() => void volver()} disabled={guardando} />
        <h2 className="text-xl font-bold text-texto">Camino nuevo</h2>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_minmax(20rem,26rem)]">
        <div className="space-y-2">
          <CargadorDeMapa
            enVivo
            principal
            encuadre={CORDOBA_COMPLETA}
            encuadrarSoloAlAbrir
            recorrido={linea}
            verticesDeCamino={puntos}
            alMoverVerticeDeCamino={paso === "linea" ? (indice, lon, lat) =>
              setPuntos((actuales) => actuales.map((punto, cada) => cada === indice ? [lon, lat] : punto)) : undefined}
            marcandoPunto={paso === "linea"}
            alMarcarPunto={(lon, lat) => setPuntos((actuales) => [...actuales, [lon, lat]])}
          />
          {paso === "linea" ? (
            <p className="text-sm leading-6 text-texto-suave">
              Tocá el mapa por donde va el Camino, de a un punto por vez y en orden. Un punto ya puesto se mueve arrastrándolo.
            </p>
          ) : null}
        </div>

        {paso === "linea" ? (
          <Tarjeta className="space-y-3">
            <h3 className="text-lg font-semibold text-texto">La línea</h3>
            <p className="text-base text-texto">
              {puntos.length === 0
                ? "Todavía sin puntos."
                : puntos.length < PUNTOS_MINIMOS
                  ? "1 punto: falta al menos uno más."
                  : `${puntos.length} puntos.`}
            </p>
            <div className="flex gap-2">
              <Boton variante="secundario" anchoCompleto disabled={puntos.length === 0}
                onClick={() => setPuntos((actuales) => actuales.slice(0, -1))}>Deshacer el último</Boton>
              <Boton variante="secundario" anchoCompleto disabled={puntos.length === 0}
                onClick={async () => {
                  const seguro = await confirmar({ titulo: "¿Empezar de nuevo?", mensaje: "Se borran todos los puntos de la línea.", textoDeAceptar: "Empezar de nuevo", destructivo: true });
                  if (seguro) setPuntos([]);
                }}>Empezar de nuevo</Boton>
            </div>
            <Boton anchoCompleto disabled={puntos.length < PUNTOS_MINIMOS} onClick={() => setPaso("datos")}>
              Terminé la línea
            </Boton>
          </Tarjeta>
        ) : (
          <Tarjeta className="space-y-4">
            <h3 className="text-lg font-semibold text-texto">Los datos del Camino</h3>
            <fieldset disabled={guardando} className="min-w-0 space-y-4">
              <Campo label="Nombre" id="nombre-del-camino-nuevo" value={nombre} maxLength={LARGO_MAXIMO_DEL_NOMBRE}
                onChange={(evento) => setNombre(evento.target.value)} />
              <AreaDeTexto label="Descripción (opcional)" id="descripcion-del-camino-nuevo" value={descripcion}
                maxLength={LARGO_MAXIMO_DE_LA_DESCRIPCION} onChange={(evento) => setDescripcion(evento.target.value)} />
              <Opciones etiqueta="Actividades" ayuda="Elegí al menos una. Después podés cambiarlas." multiple columnas={3}
                opciones={ACTIVIDADES.map((actividad) => ({ valor: actividad.tipo, etiqueta: actividad.etiqueta }))}
                elegidas={actividades}
                alElegir={(actividad) => setActividades((actuales) => actuales.includes(actividad)
                  ? actuales.filter((cada) => cada !== actividad) : [...actuales, actividad])} />
              <p className="text-sm leading-6 text-texto-suave">
                El largo, las alturas y el desnivel los calcula la app con el relieve del terreno al guardar.
                Arranca entero «por explorar»: después lo clasificás por partes.
              </p>
              {error ? <p role="alert" className="rounded-xl bg-rojo-fondo px-3 py-2 text-base leading-6 text-rojo-texto">{error}</p> : null}
              <div className="flex gap-2">
                <Boton variante="secundario" anchoCompleto onClick={() => setPaso("linea")}>Volver a la línea</Boton>
                <Boton anchoCompleto disabled={!listo} onClick={() => void guardar()}>
                  {guardando ? "Guardando…" : "Guardar el Camino"}
                </Boton>
              </div>
              {!nombre.trim() || actividades.length === 0 ? (
                <p className="text-base text-ambar-texto">
                  {!nombre.trim() ? "Falta el nombre." : ""} {actividades.length === 0 ? "Falta elegir al menos una actividad." : ""}
                </p>
              ) : null}
            </fieldset>
          </Tarjeta>
        )}
      </div>
    </div>
  );
}
