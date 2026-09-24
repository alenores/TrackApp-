"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TipoDeFondo } from "@/components/mapa/capas-base";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { FichaDeAnotacion } from "@/components/navegacion/ficha-de-anotacion";
import { ModalDeSalida } from "@/components/navegacion/modal-de-salida";
import { ElegirRutasDelMapa } from "@/components/navegacion/elegir-rutas-del-mapa";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useSalidaDeNavegacion } from "@/hooks/use-salida-de-navegacion";
import { usePantallaDespierta } from "@/hooks/use-pantalla-despierta";
import { usePaqueteGuardado } from "@/hooks/use-paquete-guardado";
import { useGps } from "@/hooks/use-gps";
import { useRecorridosDeRutas } from "@/hooks/use-rutas-en-area";
import { useMapasBajados, useSectoresConMapaBajado } from "@/hooks/use-mapa-del-sector";
import { vibrarAlTocar } from "@/lib/vibracion";
import { areaDeLasZonas, areaDeLoBajado, rutasParaElegir } from "@/lib/navegacion/mapa-libre";

/**
 * El mapa libre: todos los mapas bajados, todas las anotaciones y las rutas
 * que elijas, sin seguir ninguna en particular.
 *
 * **No consulta internet. Nunca. Por ningún motivo.** Es una pantalla del
 * cerro, con las mismas reglas que la navegación: todo sale del celular.
 */

const SALIDA = "/";

export function PantallaDeMapaLibre() {
  const { open, requestExit, cancelExit, confirmExit } = useSalidaDeNavegacion(SALIDA);
  const paquete = usePaqueteGuardado();
  const mapasBajados = useMapasBajados();
  const sectoresConMapa = useSectoresConMapaBajado();
  const {
    estado: estadoDelGps,
    error: errorDelGps,
    posicion,
    prender: prenderGps,
    segundosSinNoticias,
    posicionVieja,
  } = useGps();

  const [apagadas, setApagadas] = useState<Set<number>>(() => new Set());
  const [eligiendoRutas, setEligiendoRutas] = useState(false);
  const [anotacionTocada, setAnotacionTocada] = useState<number | null>(null);
  const [centrarGps, setCentrarGps] = useState(0);

  usePantallaDespierta(estadoDelGps === "andando");

  const rutas = useMemo(() => paquete?.rutas ?? [], [paquete]);
  const zonas = useMemo(() => paquete?.zonas ?? [], [paquete]);
  const anotaciones = paquete?.anotaciones ?? [];

  const idsEncendidos = useMemo(
    () => rutas.filter((ruta) => !apagadas.has(ruta.id)).map((ruta) => ruta.id),
    [rutas, apagadas],
  );
  const recorridos = useRecorridosDeRutas(rutas, idsEncendidos);

  const encuadre = useMemo(
    () =>
      areaDeLoBajado(paquete?.sectores ?? [], sectoresConMapa) ??
      areaDeLasZonas(paquete?.zonas ?? []),
    [paquete, sectoresConMapa],
  );

  const eleccion = useMemo(
    () => rutasParaElegir(rutas, zonas, posicion),
    [rutas, zonas, posicion],
  );

  // Con la primera posición del GPS, el mapa va a donde estás.
  const yaCentroRef = useRef(false);
  useEffect(() => {
    if (!posicion || yaCentroRef.current) return;
    yaCentroRef.current = true;
    setCentrarGps(Date.now());
  }, [posicion]);

  const abrirLaAnotacion = useCallback((anotacionId: number) => {
    vibrarAlTocar();
    setAnotacionTocada(anotacionId);
  }, []);
  const cerrarLaAnotacion = useCallback(() => setAnotacionTocada(null), []);
  const cerrarElegir = useCallback(() => setEligiendoRutas(false), []);

  if (!paquete) {
    return (
      <Tarjeta franja="ambar" className="space-y-3">
        <p className="text-lg font-medium text-texto">
          Todavía no hay nada guardado en este celular.
        </p>
        <p className="text-base leading-6 text-texto-suave">
          Abrí la app una vez con conexión y las rutas, las anotaciones y los
          mapas que bajes quedan guardados para usarlos sin señal.
        </p>
        <Boton variante="secundario" anchoCompleto paraNavegacion onClick={() => requestExit()}>
          Volver al inicio
        </Boton>
      </Tarjeta>
    );
  }

  const tiposBajados = new Set(mapasBajados.map((mapa) => mapa.tipo));
  const fondosDisponibles: TipoDeFondo[] = [];
  if (tiposBajados.has("simple")) fondosDisponibles.push("dibujo");
  if (tiposBajados.has("satelital")) fondosDisponibles.push("satelital");

  const cuantasSeVen = idsEncendidos.length;

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-mapa-fondo">
        <div className="absolute inset-0">
          <CargadorDeMapa
            recorrido={recorridos}
            anotaciones={anotaciones}
            miPosicion={posicion}
            encuadre={encuadre}
            encuadrarSoloAlAbrir
            pantallaCompleta
            fondoInicial={fondosDisponibles[0] ?? "dibujo"}
            fondosDisponibles={fondosDisponibles}
            forzarCentradoEn={centrarGps}
            alCerrarPantallaCompleta={requestExit}
            alTocarAnotacion={abrirLaAnotacion}
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col justify-end gap-2 p-3 pb-safe-4">
          {mapasBajados.length === 0 ? (
            <div
              role="status"
              className="pointer-events-auto rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-2 text-center text-lg text-ambar-texto"
            >
              No tenés ningún mapa bajado: las rutas y las anotaciones se ven
              sobre fondo liso.
            </div>
          ) : null}

          {posicionVieja ? (
            <div
              role="alert"
              className="pointer-events-auto rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-2 text-center text-lg text-ambar-texto"
            >
              Hace {segundosSinNoticias} segundos que el GPS no da novedades. Tu
              punto puede estar desactualizado.
            </div>
          ) : null}

          <div className="pointer-events-auto space-y-2">
            {estadoDelGps === "apagado" || estadoDelGps === "pidiendo" ? (
              <Boton
                anchoCompleto
                paraNavegacion
                disabled={estadoDelGps === "pidiendo"}
                onClick={prenderGps}
              >
                {estadoDelGps === "pidiendo" ? "Prendiendo el GPS…" : "Prender el GPS"}
              </Boton>
            ) : null}

            {errorDelGps ? (
              <p
                role="alert"
                className="rounded-xl border border-rojo-borde bg-superficie p-2 text-lg leading-7 text-rojo-texto"
              >
                {errorDelGps}
              </p>
            ) : null}

            <div className="flex items-center gap-3">
              {estadoDelGps === "andando" ? (
                <button
                  type="button"
                  aria-label="Centrar en mi ubicación"
                  onClick={() => setCentrarGps(Date.now())}
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-borde-fuerte bg-superficie text-texto shadow-[var(--sombra-alta)] hover:bg-superficie-alta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde"
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                    <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                    <circle cx="12" cy="10" r="3" fill="currentColor" />
                  </svg>
                </button>
              ) : null}

              <Boton
                variante="secundario"
                paraNavegacion
                className="flex-1 shadow-[var(--sombra-alta)]"
                onClick={() => setEligiendoRutas(true)}
              >
                {rutas.length === 0
                  ? "Rutas: no hay guardadas"
                  : `Rutas: ${cuantasSeVen === rutas.length ? "todas" : cuantasSeVen === 0 ? "ninguna" : `${cuantasSeVen} de ${rutas.length}`}`}
              </Boton>
            </div>
          </div>
        </div>
      </div>

      <ElegirRutasDelMapa
        abierto={eligiendoRutas}
        alCerrar={cerrarElegir}
        eleccion={eleccion}
        apagadas={apagadas}
        alCambiar={setApagadas}
      />

      <FichaDeAnotacion
        anotacion={anotaciones.find((cada) => cada.id === anotacionTocada) ?? null}
        alCerrar={cerrarLaAnotacion}
      />

      <ModalDeSalida
        open={open}
        titulo="¿Salir del mapa libre?"
        onCancel={cancelExit}
        onConfirm={confirmExit}
      />
    </>
  );
}
