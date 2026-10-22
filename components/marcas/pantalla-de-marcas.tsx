"use client";

import { useCallback, useMemo, useState } from "react";
import type { Position } from "geojson";
import { useRouter } from "next/navigation";
import { retirarCamino } from "@/app/actions/caminos";
import { borrarAnotacion } from "@/app/actions/territorio";
import { LineasDelTerritorio } from "@/components/mapas/lineas-del-territorio";
import { PantallaDeMapas } from "@/components/mapas/pantalla-de-mapas";
import { MapaDeMarcas } from "@/components/marcas/mapa-de-marcas";
import { ListaDeMarcas } from "@/components/marcas/lista-de-marcas";
import { EditorDeDetalle, type QueEditar } from "@/components/marcas/editor-de-detalle";
import { DibujarCamino } from "@/components/marcas/dibujar-camino";
import { TraerCaminosDeAfuera } from "@/components/caminos/traer-caminos-de-afuera";
import { CaminosDesdeUnaSalida } from "@/components/caminos/caminos-desde-una-salida";
import { EditorDeCamino } from "@/components/caminos/editor-de-camino";
import { BotonAgregar } from "@/components/ui/boton-agregar";
import { Boton } from "@/components/ui/boton";
import { EnlaceAGoogleMaps } from "@/components/ui/enlace-a-google-maps";
import { Emergente, BotonDeEmergente } from "@/components/ui/emergente";
import { ListaYMapa } from "@/components/ui/lista-y-mapa";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useDialogos } from "@/components/ui/dialogos";
import type { AccionDelMenu } from "@/components/ui/menu-de-acciones";
import { useSeleccionDelMapa } from "@/hooks/use-seleccion-del-mapa";
import { useCaminosGuardados } from "@/hooks/use-caminos-guardados";
import { useCerrarConAtras } from "@/hooks/use-cerrar-con-atras";
import { usePantallaAncha } from "@/hooks/use-pantalla-ancha";
import { usePreferencia } from "@/hooks/use-preferencia";
import { sectoresPorZona } from "@/lib/mapas/general";
import type { VistaDeLineas } from "@/lib/mapas/lineas-del-territorio";
import type { VistaDelMapa } from "@/lib/mapas/vista";
import { puedeCambiarDelMapa, puedeSumarAlMapa } from "@/lib/mapas/permisos";
import {
  alternarGrupo,
  alternarUna,
  armarLaLista,
  esquinasDe,
  filtrosQueSeAplican,
  lasDelMapa,
  leerDestildadas,
  leerFiltrosDeMarcas,
  rectanguloDe,
  SIN_FILTROS,
  type FiltrosDeMarcas,
  type GrupoArmado,
  type MarcaDeLaLista,
} from "@/lib/marcas/lista";
import { entraEnLoQueSeMira, lugarDeMarca } from "@/lib/marcas/en-la-vista";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import type { Paquete } from "@/lib/offline/paquete";
import { ponerAlDiaDespuesDeGuardar } from "@/lib/offline/puesta-al-dia";
import type { Anotacion, CategoriaUsuario, Rectangulo, Zona } from "@/types/database";
import { IconoDeClase } from "@/components/marcas/icono-de-clase";
import { OpcionDeEmergente } from "@/components/ui/opcion-de-emergente";
import { useQuienSoy } from "@/components/armazon/quien-soy";

/**
 * **Marcas**: todo lo que se dibuja encima del mapa, en detalle (decisión 052).
 *
 * Todos la consultan: la lista con tildes y filtros, y el mapa con lo
 * tildado. La lista muestra solo lo que entra en el pedazo de mapa que se
 * está mirando; lo tildado sigue dibujado aunque quede afuera de la lista.
 * Administrador y Premium además ven el «+» para agregar —a mano o
 * trayendo un archivo— y los tres puntos para editar o eliminar lo que les
 * toca. Lo que trajo de OpenStreetMap no se edita: queda como vino de
 * OpenStreetMap.
 *
 * Arriba del panel hay tres opciones de líneas: nada, las zonas tildadas, o
 * esas zonas y sus sectores. Al abrir se ven las de las zonas.
 *
 * Lo elegido —tildes y filtros— se recuerda en el celular.
 */

type Vista =
  | { clase: "lista" }
  | { clase: "traer" }
  | { clase: "desde-salida" }
  | { clase: "dibujar-camino"; lugar: VistaDelMapa | null }
  | { clase: "detalle"; que: QueEditar; lugar?: VistaDelMapa | null }
  | { clase: "editar-camino"; id: number };

const LISTA: Vista = { clase: "lista" };

export function PantallaDeMarcas() {
  const { miCategoria: categoria, miPerfilId } = useQuienSoy();
  // Vive acá y no en la lista: con una pantalla interna abierta, el título
  // de arriba lo pone ella, con su subtítulo y su única flecha.
  const [vista, setVista] = useState<Vista>(LISTA);
  return (
    <PantallaDeMapas titulo="Marcas" ancha avisaIncompletoSola encabezadoAdentro={vista.clase !== "lista"}>
      {({ paquete, estado, aviso }) => <Marcas paquete={paquete} incompleto={estado === "incompleto" ? aviso : null}
        categoria={categoria} miPerfilId={miPerfilId} vista={vista} setVista={setVista} />}
    </PantallaDeMapas>
  );
}

function Marcas({ paquete, incompleto, categoria, miPerfilId, vista, setVista }: {
  paquete: Paquete | null;
  incompleto: string | null;
  categoria: CategoriaUsuario;
  miPerfilId: string | null;
  vista: Vista;
  setVista: (vista: Vista) => void;
}) {
  const router = useRouter();
  const { confirmar, avisar } = useDialogos();
  const ancha = usePantallaAncha();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [eligiendo, setEligiendo] = useState<"nada" | "como" | "que">("nada");
  const [eligiendoPunto, setEligiendoPunto] = useState(false);
  const cancelarEleccion = useCallback(() => setEligiendoPunto(false), []);
  useCerrarConAtras(eligiendoPunto, cancelarEleccion);
  const [panelArriba, setPanelArriba] = useState(false);
  const [encuadre, setEncuadre] = useState<Rectangulo | null>(null);
  const [pedazo, setPedazo] = useState<Rectangulo | null>(null);
  const [dondeEstaba, setDondeEstaba] = useState<VistaDelMapa | null>(null);
  const [vistaActual, setVistaActual] = useState<VistaDelMapa | null>(null);
  const [viaje, setViaje] = useState(0);
  const [lineas, setLineas] = useState<VistaDeLineas>("zonas");
  const [seleccion, elegirSeleccion] = useSeleccionDelMapa();
  const [filtrosGuardados, guardarFiltros] = usePreferencia<FiltrosDeMarcas>("filtros-de-marcas", SIN_FILTROS, leerFiltrosDeMarcas);
  const filtros = useMemo(() => ({ ...filtrosGuardados, actividad: null, actividades: seleccion.visibles }), [filtrosGuardados, seleccion.visibles]);
  const [destildadasGuardadas, guardarDestildadas] = usePreferencia<string[]>("marcas-destildadas", [], leerDestildadas);
  const destildadas = useMemo(() => new Set(destildadasGuardadas), [destildadasGuardadas]);
  const puedeAgregar = puedeSumarAlMapa(categoria);

  const zonas = useMemo(() => paquete?.zonas ?? [], [paquete]);
  const detalles = useMemo(() => paquete?.anotaciones ?? [], [paquete]);
  const caminosSinLinea = useMemo(() => paquete?.caminos ?? [], [paquete]);
  const cantidades = useMemo(() => sectoresPorZona(paquete?.sectores ?? []), [paquete]);
  const { caminos, error: errorDeCaminos, cargando: cargandoCaminos } = useCaminosGuardados(caminosSinLinea);

  const porId = useMemo(() => ({
    caminosSinLinea: new Map(caminosSinLinea.map((camino) => [camino.id, camino])),
    caminos: new Map(caminos.map((camino) => [camino.id, camino])),
    detalles: new Map(detalles.map((detalle) => [detalle.id, detalle])),
    zonas: new Map(zonas.map((zona) => [zona.id, zona])),
  }), [caminosSinLinea, caminos, detalles, zonas]);

  const marcas = useMemo(() => armarLaLista(caminosSinLinea, detalles, zonas), [caminosSinLinea, detalles, zonas]);
  const guardarPedazo = useCallback((nuevo: Rectangulo) => {
    setPedazo((actual) => {
      if (!actual) return nuevo;
      const igual = Math.abs(actual.latNorte - nuevo.latNorte) < 1e-6
        && Math.abs(actual.latSur - nuevo.latSur) < 1e-6
        && Math.abs(actual.lonEste - nuevo.lonEste) < 1e-6
        && Math.abs(actual.lonOeste - nuevo.lonOeste) < 1e-6;
      return igual ? actual : nuevo;
    });
  }, []);
  const marcasEnLaLista = useMemo(() => marcas.filter((marca) => entraEnLoQueSeMira(
    lugarDeMarca(marca, porId.caminos, porId.detalles, porId.zonas),
    pedazo,
    marca.grupo === "camino" && cargandoCaminos,
  )), [marcas, porId, pedazo, cargandoCaminos]);
  const enElMapa = useMemo(
    () => lasDelMapa(marcas, filtrosQueSeAplican(filtros), miPerfilId, destildadas),
    [marcas, filtros, miPerfilId, destildadas],
  );
  // La actividad principal se elige en esta consulta.
  const actividad = seleccion.principal;

  const dibujo = useMemo(() => {
    const ids = { camino: new Set<number>(), detalle: new Set<number>(), zona: new Set<number>() };
    for (const marca of enElMapa) {
      if (marca.grupo === "camino") ids.camino.add(marca.id);
      else if (marca.grupo === "zona") ids.zona.add(marca.id);
      else ids.detalle.add(marca.id);
    }
    return {
      caminos: caminos.filter((camino) => ids.camino.has(camino.id)),
      detalles: detalles.filter((detalle) => ids.detalle.has(detalle.id)),
      zonas: zonas.filter((zona) => ids.zona.has(zona.id)),
    };
  }, [enElMapa, caminos, detalles, zonas]);

  const encuadreDe = useCallback((lista: MarcaDeLaLista[]): Rectangulo | null =>
    rectanguloDe(lista.flatMap((marca) => coordenadasDe(marca, porId.caminos, porId.detalles, porId.zonas))), [porId]);

  // Prender o apagar se encuadra al instante. Elegir una marca viaja hasta
  // ella, en la computadora y en el celular.
  const alCambiarLoElegido = (nuevosFiltros: FiltrosDeMarcas, nuevasDestildadas: string[]) => {
    if (!ancha) return;
    setDondeEstaba(null);
    setEncuadre(encuadreDe(lasDelMapa(marcas, filtrosQueSeAplican(nuevosFiltros), miPerfilId, new Set(nuevasDestildadas))));
  };
  const cambiarFiltros = (nuevos: FiltrosDeMarcas) => {
    guardarFiltros({ clases: nuevos.clases, actividad: null, autoria: nuevos.autoria, origen: nuevos.origen });
    // La actividad cambia lo dibujado, nunca el lugar ni el zoom que se mira.
    // Repetir la actividad elegida (también «Todas») tampoco reencuadra.
    const cambiaOtroFiltro = nuevos.origen !== filtros.origen || nuevos.autoria !== filtros.autoria
      || nuevos.clases.length !== filtros.clases.length
      || nuevos.clases.some((clase) => !filtros.clases.includes(clase));
    if (cambiaOtroFiltro) alCambiarLoElegido(nuevos, destildadasGuardadas);
  };
  const cambiarDestildadas = (nuevas: string[]) => {
    guardarDestildadas(nuevas);
    alCambiarLoElegido(filtros, nuevas);
  };
  const alCambiarPanel = (arriba: boolean) => {
    if (!arriba && !eligiendoPunto) {
      setDondeEstaba(null);
      setEncuadre(encuadreDe(enElMapa));
    }
    setPanelArriba(arriba);
  };
  const mostrar = (marca: MarcaDeLaLista) => {
    if (destildadas.has(marca.clave)) cambiarDestildadas(alternarUna(marca.clave, destildadasGuardadas));
    setDondeEstaba(null);
    setEncuadre(encuadreDe([marca]));
    setViaje((vez) => vez + 1);
    setPanelArriba(false);
  };

  const volverALista = useCallback((nuevoMensaje: string | null, lugar?: VistaDelMapa | null) => {
    setVista(LISTA);
    // «Guardado» no se anuncia: el cartel de arriba obligaba a apretar Cerrar.
    // Sí se dice cuando algo no quedó bien.
    setMensaje(nuevoMensaje && esUnProblema(nuevoMensaje) ? nuevoMensaje : null);
    const conservar = lugar ?? vistaActual;
    if (conservar) {
      setDondeEstaba(conservar);
      setEncuadre(null);
    } else {
      setDondeEstaba(null);
    }
  }, [setVista, vistaActual]);
  // Adentro de agregar o editar, el atrás del celular vuelve a la lista.
  const alAtras = useCallback(() => volverALista(null), [volverALista]);
  useCerrarConAtras(vista.clase !== "lista" && vista.clase !== "dibujar-camino", alAtras);

  const eliminarCamino = async (camino: { id: number; nombre: string; actualizadoEn: string }): Promise<boolean> => {
    const seguro = await confirmar({ titulo: `¿Eliminar «${camino.nombre}»?`,
      mensaje: "Deja de verse en el mapa de todos. No se puede deshacer desde la app.",
      textoDeAceptar: "Eliminar el Camino", destructivo: true });
    if (!seguro) return false;
    try {
      const resultado = await retirarCamino(camino.id, camino.actualizadoEn);
      if (!resultado.ok) { await avisar({ titulo: "No se eliminó el Camino", mensaje: resultado.error }); return false; }
      await ponerAlDiaDespuesDeGuardar();
      router.refresh();
      return true;
    } catch (error) {
      await avisar({ titulo: "No se eliminó el Camino",
        mensaje: `${error instanceof Error ? error.message : String(error)}. Revisá la señal y probá de nuevo.` });
      return false;
    }
  };

  const eliminarDetalle = async (detalle: Anotacion) => {
    const nombre = detalle.tipo === "punto" ? "punto" : "trazo";
    const seguro = await confirmar({ titulo: `¿Eliminar este ${nombre}?`,
      mensaje: "Deja de aparecer en los mapas de todos, también su foto.",
      textoDeAceptar: `Eliminar el ${nombre}`, destructivo: true });
    if (!seguro) return;
    try {
      const resultado = await borrarAnotacion(detalle.id);
      if (!resultado.ok) { await avisar({ titulo: `No se eliminó el ${nombre}`, mensaje: resultado.error }); return; }
      await ponerAlDiaDespuesDeGuardar();
    } catch (error) {
      await avisar({ titulo: `No se eliminó el ${nombre}`,
        mensaje: `${error instanceof Error ? error.message : String(error)}. Revisá la señal y probá de nuevo.` });
    }
  };

  const accionesDe = (marca: MarcaDeLaLista): AccionDelMenu[] => {
    if (marca.grupo === "zona" || marca.fija) return [];
    if (!puedeCambiarDelMapa(categoria, miPerfilId, marca.autorId)) return [];
    if (marca.grupo === "camino") {
      const camino = porId.caminosSinLinea.get(marca.id);
      if (!camino) return [];
      return [
        { etiqueta: "Editar", alElegir: () => setVista({ clase: "editar-camino", id: marca.id }) },
        { etiqueta: "Eliminar", destructiva: true, alElegir: () => void eliminarCamino(camino) },
      ];
    }
    const detalle = porId.detalles.get(marca.id);
    if (!detalle) return [];
    return [
      { etiqueta: "Editar", alElegir: () => setVista({ clase: "detalle", que: { clase: "existente", id: marca.id } }) },
      { etiqueta: "Eliminar", destructiva: true, alElegir: () => void eliminarDetalle(detalle) },
    ];
  };

  if (vista.clase === "traer") return <TraerCaminosDeAfuera alVolver={() => volverALista(null)} />;
  if (vista.clase === "desde-salida") return <CaminosDesdeUnaSalida alVolver={() => volverALista(null)} />;
  if (vista.clase === "dibujar-camino") return <DibujarCamino alVolver={volverALista} vistaInicial={vista.lugar} />;
  if (vista.clase === "detalle") return <EditorDeDetalle que={vista.que} alVolver={volverALista} vistaInicial={vista.lugar} />;
  if (vista.clase === "editar-camino") return <EditorDeCamino id={vista.id} alVolver={() => volverALista(null)} />;

  const cuantas = enElMapa.filter((marca) => marca.grupo !== "zona").length;
  const zonasEnElMapa = enElMapa.length - cuantas;
  const indicacionDelPunto = (
    <Tarjeta className="space-y-3">
      <p role="status" className="text-base text-texto">Tocá el mapa donde querés agregar el punto.</p>
      <Boton variante="secundario" onClick={cancelarEleccion}>Cancelar</Boton>
    </Tarjeta>
  );

  return (
    <div className="space-y-3">
      <ListaYMapa
        tituloDelPanel={eligiendoPunto ? "Punto nuevo" : "Marcas"}
        pantallaCompletaEnCelular="Marcas" destinoSiNoHayVuelta="/mapas"
        accionDePantalla={<EnlaceAGoogleMaps vista={vistaActual} />}
        accionDelEncabezado={puedeAgregar && !eligiendoPunto ? <BotonAgregar etiqueta="Agregar una marca" disabled={!vistaActual} alTocar={() => { setPanelArriba(false); setEligiendo("como"); }} /> : null}
        avisos={(!ancha && eligiendoPunto && !panelArriba) || mensaje || (cargandoCaminos && caminosSinLinea.length > 0) || errorDeCaminos || incompleto ? <>
          {!ancha && eligiendoPunto && !panelArriba ? indicacionDelPunto : null}
          {mensaje ? (
            <Tarjeta franja="ambar" className="flex items-start gap-3">
              <p role="alert" className="flex-1 text-base text-texto">{mensaje}</p>
              <button type="button" className="text-sm font-medium text-texto-suave" onClick={() => setMensaje(null)}>Cerrar</button>
            </Tarjeta>
          ) : null}
          {cargandoCaminos && caminosSinLinea.length > 0 ? <p role="status" className="text-base text-texto">Abriendo los Caminos…</p> : null}
          {errorDeCaminos ? <Tarjeta franja="ambar"><p role="alert" className="text-base text-texto">{errorDeCaminos}</p></Tarjeta> : null}
          {incompleto ? <Tarjeta franja="ambar"><p role="alert" className="text-base text-texto">Lo que ves puede estar incompleto: {incompleto}. Recargá para intentar de nuevo.</p></Tarjeta> : null}
        </> : null}
        resumen={`${cuantas} ${cuantas === 1 ? "marca" : "marcas"} en el mapa${zonasEnElMapa > 0 ? ` · ${zonasEnElMapa} ${zonasEnElMapa === 1 ? "zona" : "zonas"}` : ""}`}
        abierto={panelArriba}
        alCambiarAbierto={alCambiarPanel}
        cabezaDelPanel={eligiendoPunto ? null : <LineasDelTerritorio valor={lineas} alElegir={setLineas} />}
        panel={eligiendoPunto ? indicacionDelPunto : (
          <ListaDeMarcas
            marcas={marcasEnLaLista}
            nadaEnEstaVista={pedazo !== null && marcas.length > 0 && marcasEnLaLista.length === 0}
            caminos={porId.caminosSinLinea}
            detalles={porId.detalles}
            zonas={porId.zonas}
            sectoresPorZona={cantidades}
            filtros={filtros}
            seleccion={seleccion}
            alCambiarSeleccion={elegirSeleccion}
            alCambiarFiltros={cambiarFiltros}
            miPerfilId={miPerfilId}
            destildadas={destildadas}
            alTildarUna={(clave) => cambiarDestildadas(alternarUna(clave, destildadasGuardadas))}
            alTildarGrupo={(grupo: GrupoArmado) => cambiarDestildadas(alternarGrupo(grupo, destildadasGuardadas))}
            alMostrar={mostrar}
            accionesDe={accionesDe}
          />
        )}
        mapa={
          <MapaDeMarcas
            llenarElLugar
            zonas={dibujo.zonas}
            sectores={paquete?.sectores ?? []}
            lineas={lineas}
            anotaciones={dibujo.detalles}
            caminos={dibujo.caminos}
            actividad={actividad}
            sectoresPorZona={cantidades}
            encuadre={encuadre}
            dondeEstaba={dondeEstaba}
            viaje={viaje}
            alMirar={guardarPedazo}
            alMoverVista={setVistaActual}
            alElegirPunto={eligiendoPunto ? (lon, lat, lugar) => {
              setEligiendoPunto(false);
              setPanelArriba(false);
              setVistaActual(lugar);
              setVista({ clase: "detalle", que: { clase: "nuevo", tipo: "punto", puntoInicial: { lon, lat } }, lugar });
            } : undefined}
            alEditarCamino={(id) => setVista({ clase: "editar-camino", id })}
            alEliminarCamino={eliminarCamino}
            puedeEditarCamino={(autorId) => puedeCambiarDelMapa(categoria, miPerfilId, autorId)}
            avisoSinNada={!eligiendoPunto && enElMapa.length === 0
              ? marcas.length === 0
                ? "Todavía no hay marcas en el mapa."
                : "No hay nada tildado para ver. Abrí la lista y tildá lo que quieras mirar."
              : null}
          />
        }
      />

      <Emergente abierto={eligiendo !== "nada"} alCerrar={() => setEligiendo("nada")}
        titulo={eligiendo === "que" ? "¿Qué vas a dibujar?" : "Agregar una marca"}
        descripcion={eligiendo === "que" ? "Primero elegí qué es; después lo dibujás sobre el mapa." : undefined}>
        {eligiendo === "como" ? (
          <div className="space-y-2">
            <OpcionDeEmergente titulo="A mano" detalle="Dibujás un Camino, un punto o un trazo sobre el mapa."
              alTocar={() => setEligiendo("que")} />
            <OpcionDeEmergente titulo="Traer de afuera" detalle="Desde un archivo de Google Earth o de un GPS (KML, KMZ o GPX)."
              alTocar={() => { setEligiendo("nada"); setVista({ clase: "traer" }); }} />
            <OpcionDeEmergente titulo="Desde una salida" detalle="La línea del GPS de una salida, para ver qué Caminos pisó y sumar los nuevos."
              alTocar={() => { setEligiendo("nada"); setVista({ clase: "desde-salida" }); }} />
          </div>
        ) : eligiendo === "que" ? (
          <div className="space-y-2">
            <OpcionDeEmergente icono={<IconoDeClase grupo="camino" />} titulo="Camino" detalle="Por dónde se puede pasar. Después cargás el nombre y las actividades."
              alTocar={() => { setEligiendo("nada"); setVista({ clase: "dibujar-camino", lugar: vistaActual }); }} />
            <OpcionDeEmergente icono={<IconoDeClase grupo="punto" />} titulo="Punto" detalle="Un lugar: refugio, estacionamiento, sitio, tranquera…"
              alTocar={() => { setEligiendo("nada"); setEligiendoPunto(true); setPanelArriba(false); }} />
            <OpcionDeEmergente icono={<IconoDeClase grupo="trazo" />} titulo="Trazo" detalle="Una línea para mirar: un río, una huella, un alambrado que falta."
              alTocar={() => { setEligiendo("nada"); setVista({ clase: "detalle", que: { clase: "nuevo", tipo: "trazo" }, lugar: vistaActual }); }} />
            <BotonDeEmergente onClick={() => setEligiendo("como")}>Volver</BotonDeEmergente>
          </div>
        ) : null}
      </Emergente>
    </div>
  );
}

/** Un aviso de que algo no quedó bien. «Guardado» a secas no lo es. */
function esUnProblema(mensaje: string): boolean {
  return /no |todavía|ya no/i.test(mensaje);
}

/** Las coordenadas de una marca, para encuadrarla. */
function coordenadasDe(
  marca: MarcaDeLaLista,
  caminos: Map<number, CaminoGuardado>,
  detalles: Map<number, Anotacion>,
  zonas: Map<number, Zona>,
): Position[] {
  if (marca.grupo === "camino") return caminos.get(marca.id)?.coordenadas ?? [];
  if (marca.grupo === "zona") {
    const zona = zonas.get(marca.id);
    return zona ? esquinasDe(zona.rectangulo) : [];
  }
  const geometria = detalles.get(marca.id)?.geometria;
  if (!geometria) return [];
  return geometria.type === "Point" ? [geometria.coordinates] : geometria.coordinates;
}
