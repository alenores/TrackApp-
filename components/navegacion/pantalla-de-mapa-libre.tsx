"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TipoDeFondo } from "@/components/mapa/capas-base";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { useAnotacionesEnElMapa } from "@/components/navegacion/anotaciones-en-el-mapa";
import { ModalDeSalida } from "@/components/navegacion/modal-de-salida";
import {
  BotonEmpezarARegistrar,
  BotonMarcarAca,
  FranjaDeRegistro,
  PreguntaDeRegistrar,
} from "@/components/navegacion/registro-de-salida";
import { useRegistroDeSalida } from "@/hooks/use-registro-de-salida";
import { ElegirRutasDelMapa } from "@/components/navegacion/elegir-rutas-del-mapa";
import { Boton } from "@/components/ui/boton";
import { BotonRedondo, ICONOS_DEL_CERRO } from "@/components/ui/boton-redondo";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useSalidaDeNavegacion } from "@/hooks/use-salida-de-navegacion";
import { usePantallaDespierta } from "@/hooks/use-pantalla-despierta";
import { usePaqueteGuardado } from "@/hooks/use-paquete-guardado";
import { useGps } from "@/hooks/use-gps";
import { useRecorridosDeRutas } from "@/hooks/use-rutas-en-area";
import { useMapasBajados } from "@/hooks/use-mapa-del-sector";
import { areaDeLasZonas, sectorDondeEstas } from "@/lib/navegacion/mapa-libre";
import { datosDeParte, type DatosDeParte } from "@/lib/rutas/partes";
import { FichaDeParte, ReferenciaDePartes } from "@/components/rutas/referencia-de-partes";
import type { ActividadRuta } from "@/types/database";
import { useCaminosGuardados } from "@/hooks/use-caminos-guardados";
import { useActividadPrincipal } from "@/hooks/use-actividad-principal";
import { dibujarCaminos } from "@/lib/caminos/dibujo";
import { FichaDeCamino } from "@/components/caminos/ficha-de-camino";
import { SelectorDeActividadPrincipal } from "@/components/caminos/selector-de-actividad-principal";

/**
 * El mapa libre: todos los mapas bajados, todas las anotaciones y las rutas
 * que elijas, sin seguir ninguna en particular.
 *
 * **No consulta internet. Nunca. Por ningún motivo.** Es una pantalla del
 * cerro, con las mismas reglas que la navegación: todo sale del celular.
 *
 * **El GPS se prende solo al entrar y se apaga solo al salir.** Mientras no da
 * posición, el mapa muestra todas las zonas desde arriba; cuando responde, va
 * a donde estás y la lista de rutas queda en tu sector.
 */

const SALIDA = "/";

export function PantallaDeMapaLibre() {
  const { open, requestExit, cancelExit, confirmExit } = useSalidaDeNavegacion(SALIDA);
  const paquete = usePaqueteGuardado();
  const mapasBajados = useMapasBajados();
  const gps = useGps();
  // La salida que se está registrando, si hay. Solo escribe en el celular.
  const registro = useRegistroDeSalida(gps);
  const [preguntandoSiRegistrar, setPreguntandoSiRegistrar] = useState(false);
  const {
    estado: estadoDelGps,
    error: errorDelGps,
    posicion,
    prender: prenderGps,
    segundosSinNoticias,
    posicionVieja,
  } = gps;

  useEffect(() => {
    prenderGps();
  }, [prenderGps]);

  const [apagadas, setApagadas] = useState<Set<number>>(() => new Set());
  const [eligiendoRutas, setEligiendoRutas] = useState(false);
  const [parteTocada, setParteTocada] = useState<{
    nombre: string; actividades: ActividadRuta[]; datos: DatosDeParte;
  } | null>(null);
  const [caminoTocado, setCaminoTocado] = useState<{ id: number; indice: number } | null>(null);
  const [elegirActividad, setElegirActividad] = useState(false);
  const [actividadPrincipal, cambiarActividad] = useActividadPrincipal();
  const [centrarGps, setCentrarGps] = useState(0);

  usePantallaDespierta(estadoDelGps === "andando");

  const rutas = useMemo(() => paquete?.rutas ?? [], [paquete]);
  const zonas = useMemo(() => paquete?.zonas ?? [], [paquete]);
  const sectores = useMemo(() => paquete?.sectores ?? [], [paquete]);
  const anotaciones = useMemo(() => paquete?.anotaciones ?? [], [paquete]);
  const caminosSinLinea = useMemo(() => paquete?.caminos ?? [], [paquete]);
  const { caminos, error: errorDeCaminos } = useCaminosGuardados(caminosSinLinea);
  const dibujoDeCaminos = useMemo(() => dibujarCaminos(caminos, actividadPrincipal), [caminos, actividadPrincipal]);
  const caminoElegido = caminos.find((camino) => camino.id === caminoTocado?.id) ?? null;
  const centrarEnMi = useCallback(() => setCentrarGps(Date.now()), []);
  // Todas las anotaciones: el mapa libre muestra todo lo bajado.
  const deAnotaciones = useAnotacionesEnElMapa({ delPaquete: anotaciones, gps, centrarEnMi });

  const idsEncendidos = useMemo(
    () => rutas.filter((ruta) => !apagadas.has(ruta.id)).map((ruta) => ruta.id),
    [rutas, apagadas],
  );
  const recorridos = useRecorridosDeRutas(rutas, idsEncendidos);

  // Mientras el GPS no responde, todas las zonas desde arriba.
  const encuadre = useMemo(() => areaDeLasZonas(zonas), [zonas]);

  const prendidas = useMemo(() => new Set(idsEncendidos), [idsEncendidos]);
  const alCambiarPrendidas = useCallback(
    (nuevas: Set<number>) =>
      setApagadas(new Set(rutas.filter((ruta) => !nuevas.has(ruta.id)).map((ruta) => ruta.id))),
    [rutas],
  );

  // La lista de rutas abre en el sector donde estás, cuando el GPS lo sabe.
  // Si ya elegiste otro a mano, manda lo que elegiste.
  const [sectorAMano, setSectorAMano] = useState<number | null>(null);
  const sectorElegido = sectorAMano ?? sectorDondeEstas(sectores, posicion)?.id ?? null;

  // Con la primera posición del GPS, el mapa va a donde estás.
  const yaCentroRef = useRef(false);
  useEffect(() => {
    if (!posicion || yaCentroRef.current) return;
    yaCentroRef.current = true;
    setCentrarGps(Date.now());
  }, [posicion]);

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
        <Boton variante="secundario" anchoCompleto onClick={() => requestExit()}>
          Volver al inicio
        </Boton>
      </Tarjeta>
    );
  }

  const tiposBajados = new Set(mapasBajados.map((mapa) => mapa.tipo));
  const fondosDisponibles: TipoDeFondo[] = [];
  if (tiposBajados.has("simple")) fondosDisponibles.push("dibujo");
  if (tiposBajados.has("satelital")) fondosDisponibles.push("satelital");

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-mapa-fondo">
        <div className="absolute inset-0">
          <CargadorDeMapa
            recorrido={recorridos}
            caminos={dibujoDeCaminos}
            anotaciones={deAnotaciones.enElMapa}
            marcandoPunto={deAnotaciones.marcandoPunto}
            alMarcarPunto={deAnotaciones.alMarcarPunto}
            miPosicion={posicion}
            encuadre={encuadre}
            encuadrarSoloAlAbrir
            pantallaCompleta
            fondoInicial={fondosDisponibles[0] ?? "dibujo"}
            fondosDisponibles={fondosDisponibles}
            forzarCentradoEn={centrarGps}
            sinMapaDescargado={mapasBajados.length === 0}
            alTocarAnotacion={deAnotaciones.alTocarAnotacion}
            alTocarRuta={(_lon, _lat, propiedades) => {
              const ruta = rutas.find((cada) => cada.id === Number(propiedades.ruta_id));
              setParteTocada({
                nombre: ruta?.nombre ?? "Ruta",
                actividades: ruta?.actividades ?? [],
                datos: datosDeParte(propiedades),
              });
            }}
            alTocarCamino={(_lon, _lat, propiedades) => {
              const id = Number(propiedades.camino_id);
              const indice = Number(propiedades.parte_indice);
              if (Number.isInteger(id) && Number.isInteger(indice)) {
                setCaminoTocado({ id, indice });
                setParteTocada(null);
              }
            }}
            mostrarFichaAnotacion={false}
          />
        </div>

        {deAnotaciones.aviso}
        {errorDeCaminos ? (
          <div role="alert" className="absolute inset-x-3 top-3 rounded-xl border border-ambar-borde bg-ambar-fondo p-3 text-lg text-ambar-texto">
            {errorDeCaminos}
          </div>
        ) : null}

        {deAnotaciones.anotando ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0">{deAnotaciones.panel}</div>
        ) : (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col justify-end gap-2 p-3 pb-safe-4">
          {parteTocada ? (
            <div className="pointer-events-auto">
              <FichaDeParte nombreRuta={parteTocada.nombre} actividades={parteTocada.actividades} datos={parteTocada.datos} alCerrar={() => setParteTocada(null)} />
            </div>
          ) : null}
          {caminoElegido && caminoTocado ? (
            <div className="pointer-events-auto">
              <FichaDeCamino camino={caminoElegido} indice={caminoTocado.indice} alCerrar={() => setCaminoTocado(null)} />
            </div>
          ) : null}
          {elegirActividad ? (
            <div className="pointer-events-auto rounded-xl border border-borde bg-superficie p-2">
              <SelectorDeActividadPrincipal actividad={actividadPrincipal} alCambiar={(nueva) => { cambiarActividad(nueva); setElegirActividad(false); }} />
              <Boton variante="fantasma" onClick={() => setElegirActividad(false)}>Cerrar</Boton>
            </div>
          ) : null}
          <ReferenciaDePartes navegando />
          {posicionVieja ? (
            <div
              role="alert"
              className="pointer-events-auto rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-2 text-center text-lg text-ambar-texto"
            >
              Hace {segundosSinNoticias} segundos que el GPS no da novedades. Tu
              punto puede estar desactualizado.
            </div>
          ) : null}

          {estadoDelGps === "pidiendo" ? (
            <p
              role="status"
              className="pointer-events-auto rounded-xl border border-borde bg-superficie px-3 py-2 text-center text-lg text-texto"
            >
              Buscando tu posición con el GPS…
            </p>
          ) : null}

          {errorDelGps ? (
            <p
              role="alert"
              className="pointer-events-auto rounded-xl border border-rojo-borde bg-superficie p-2 text-lg leading-7 text-rojo-texto"
            >
              {errorDelGps}
            </p>
          ) : null}

          {registro.enCurso ? (
            <FranjaDeRegistro
              kilometros={registro.kilometros}
              puntos={registro.puntos}
              marcaRecien={registro.marcaRecien}
              error={registro.error}
            />
          ) : null}

          <div className="pointer-events-auto flex items-center gap-2">
            <BotonRedondo etiqueta="Salir de la navegación libre" onClick={() => requestExit()}>
              {ICONOS_DEL_CERRO.salir}
            </BotonRedondo>
            {deAnotaciones.boton}
            <BotonRedondo etiqueta="Rutas en el mapa" onClick={() => setEligiendoRutas(true)}>
              {ICONOS_DEL_CERRO.rutas}
            </BotonRedondo>
            <Boton variante="secundario" onClick={() => setElegirActividad(true)}>Actividad</Boton>
            <span className="flex-1" />
            {registro.enCurso ? (
              <BotonMarcarAca alTocar={registro.marcarAca} deshabilitado={!posicion} />
            ) : (
              <BotonEmpezarARegistrar alTocar={() => setPreguntandoSiRegistrar(true)} />
            )}
            {estadoDelGps === "andando" ? (
              <BotonRedondo etiqueta="Centrar en mi ubicación" onClick={() => setCentrarGps(Date.now())}>
                {ICONOS_DEL_CERRO.centrar}
              </BotonRedondo>
            ) : null}
          </div>
        </div>
        )}
      </div>

      <ElegirRutasDelMapa
        abierto={eligiendoRutas}
        alCerrar={cerrarElegir}
        zonas={zonas}
        sectores={sectores}
        rutas={rutas}
        sectorId={sectorElegido}
        alElegirSector={setSectorAMano}
        prendidas={prendidas}
        alCambiar={alCambiarPrendidas}
        posicion={posicion}
        fondosDisponibles={fondosDisponibles}
      />

      {deAnotaciones.resto}

      <PreguntaDeRegistrar
        abierta={preguntandoSiRegistrar}
        alCerrar={() => setPreguntandoSiRegistrar(false)}
        alSoloNavegar={() => setPreguntandoSiRegistrar(false)}
        textoDeSoloNavegar="Ahora no"
        alRegistrar={() => {
          setPreguntandoSiRegistrar(false);
          void registro.empezar(null, null);
        }}
      />

      <ModalDeSalida
        open={open}
        titulo="¿Salir de la navegación libre?"
        onCancel={cancelExit}
        onConfirm={confirmExit}
        registrando={registro.enCurso !== null}
        alTerminarYSalir={() => {
          void registro.terminar().then((terminada) => {
            if (terminada) confirmExit();
          });
        }}
      />
    </>
  );
}
