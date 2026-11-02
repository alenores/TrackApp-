"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { FeatureCollection, LineString } from "geojson";
import { crearCaminoNuevo } from "@/app/actions/caminos";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { BuscadorDelMapa } from "@/components/marcas/buscador-del-mapa";
import { LineasDelTerritorio } from "@/components/mapas/lineas-del-territorio";
import { useAlMarcar } from "@/hooks/use-al-marcar";
import { AreaDeTexto } from "@/components/ui/area-de-texto";
import { Boton } from "@/components/ui/boton";
import { EncabezadoDeMapas } from "@/components/mapas/pantalla-de-mapas";
import { Campo } from "@/components/ui/campo";
import { MapaConPanel } from "@/components/ui/mapa-con-panel";
import { Tarjeta } from "@/components/ui/tarjeta";
import { SALIR_SIN_GUARDAR, useDialogos } from "@/components/ui/dialogos";
import { useCerrarConAtras } from "@/hooks/use-cerrar-con-atras";
import { ElegirActividades } from "@/components/rutas/elegir-actividades";
import { LARGO_MAXIMO_DE_LA_DESCRIPCION, LARGO_MAXIMO_DEL_NOMBRE } from "@/lib/caminos/datos";
import { CORDOBA_COMPLETA } from "@/lib/mapas/general";
import type { VistaDelMapa } from "@/lib/mapas/vista";
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
 * 050). Abre en satelital y deja visibles las marcas que ya existen, de
 * referencia.
 */

const PUNTOS_MINIMOS = 2;

export function DibujarCamino({ alVolver, vistaInicial = null }: {
  alVolver: (mensaje: string | null, dondeEstaba?: VistaDelMapa | null) => void;
  vistaInicial?: VistaDelMapa | null;
}) {
  const { confirmar } = useDialogos();
  const marcar = useAlMarcar();
  const [puntos, setPuntos] = useState<number[][]>([]);
  const [paso, setPaso] = useState<"linea" | "datos">("linea");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [actividades, setActividades] = useState<ActividadRuta[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Traba inmediata: dos toques no crean dos Caminos.
  const ocupado = useRef(false);
  // El lugar que se está mirando, para que al guardar el mapa no vuelva a Córdoba.
  const dondeEstaba = useRef<VistaDelMapa | null>(vistaInicial);

  const linea = useMemo<FeatureCollection<LineString> | null>(() => puntos.length < PUNTOS_MINIMOS ? null : {
    type: "FeatureCollection",
    features: [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: puntos } }],
  }, [puntos]);

  const listo = nombre.trim().length > 0 && actividades.length > 0 && puntos.length >= PUNTOS_MINIMOS;

  const volver = async () => {
    if (guardando) return;
    if (puntos.length > 0) {
      const seguro = await confirmar(SALIR_SIN_GUARDAR);
      if (!seguro) return;
    }
    alVolver(null, dondeEstaba.current);
  };

  // El atrás del celular pregunta lo mismo que el botón de volver: lo
  // dibujado no se pierde de un toque.
  const volverRef = useRef(volver);
  useLayoutEffect(() => { volverRef.current = volver; });
  const alAtras = useCallback(() => void volverRef.current(), []);
  useCerrarConAtras(true, alAtras);

  const guardar = async () => {
    if (!listo || ocupado.current) return;
    // Antes de guardar: si el mapa se mueve mientras espera, este lugar ya quedó.
    const lugar = dondeEstaba.current;
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
        : `Camino «${resultado.datos.nombre}» guardado.`, lugar);
    } catch (causa) {
      setError(`No se pudo guardar el Camino: ${causa instanceof Error ? causa.message : String(causa)}. Revisá la señal y volvé a intentar.`);
    } finally {
      ocupado.current = false;
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-3">
      <EncabezadoDeMapas titulo="Marcas" subtitulo="Camino nuevo" alVolver={() => void volver()} volverDeshabilitado={guardando} />

      <MapaConPanel
        panelPrimeroEnComputadora
        mapa={
          <CargadorDeMapa
            enVivo
            llenarElAltoEnLaComputadora
            fondoInicial="satelital"
            vista={marcar.vista ? null : vistaInicial}
            encuadre={marcar.vista ?? (vistaInicial ? null : CORDOBA_COMPLETA)}
            viaje={marcar.viaje}
            encuadrarSoloAlAbrir
            rectangulos={marcar.rectangulos}
            caminos={marcar.dibujoDeCaminos}
            anotaciones={marcar.anotaciones}
            mostrarFichaAnotacion={false}
            controlesAdicionales={
              <BuscadorDelMapa
                zonas={marcar.zonas}
                sectores={marcar.sectores}
                caminosSinLinea={marcar.caminosSinLinea}
                caminos={marcar.caminos}
                anotaciones={marcar.anotaciones}
                cargandoCaminos={marcar.cargandoCaminos}
                alElegir={marcar.ir}
              />
            }
            recorrido={linea}
            alMoverVista={(vista) => { dondeEstaba.current = vista; }}
            verticesDeCamino={puntos}
            alMoverVerticeDeCamino={paso === "linea" ? (indice, lon, lat) =>
              setPuntos((actuales) => actuales.map((punto, cada) => cada === indice ? [lon, lat] : punto)) : undefined}
            marcandoPunto={paso === "linea"}
            alMarcarPunto={(lon, lat) => setPuntos((actuales) => [...actuales, [lon, lat]])}
          />
        }
        debajoDelMapa={paso === "linea" ? (
          <p className="text-sm leading-6 text-texto-suave">
            Tocá el mapa por donde va el Camino, de a un punto por vez y en orden. Un punto ya puesto se mueve arrastrándolo.
          </p>
        ) : null}
        panel={paso === "linea" ? (
          <div className="space-y-3">
          <LineasDelTerritorio valor={marcar.lineas} alElegir={marcar.setLineas} />
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
          </div>
        ) : (
          <div className="space-y-3">
          <LineasDelTerritorio valor={marcar.lineas} alElegir={marcar.setLineas} />
          <Tarjeta className="space-y-4">
            <h3 className="text-lg font-semibold text-texto">Los datos del Camino</h3>
            <fieldset disabled={guardando} className="min-w-0 space-y-4">
              <Campo label="Nombre" obligatorio id="nombre-del-camino-nuevo" value={nombre} maxLength={LARGO_MAXIMO_DEL_NOMBRE}
                onChange={(evento) => setNombre(evento.target.value)} />
              <AreaDeTexto label="Descripción" id="descripcion-del-camino-nuevo" value={descripcion}
                maxLength={LARGO_MAXIMO_DE_LA_DESCRIPCION} onChange={(evento) => setDescripcion(evento.target.value)} />
              <ElegirActividades etiqueta="Actividades" modo="varias" obligatorio
                elegidas={actividades}
                alTocar={(actividad) => setActividades((actuales) => actuales.includes(actividad)
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
            </fieldset>
          </Tarjeta>
          </div>
        )}
      />
    </div>
  );
}
