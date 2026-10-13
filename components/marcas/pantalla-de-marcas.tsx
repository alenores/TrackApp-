"use client";

import { useCallback, useMemo, useState } from "react";
import type { Position } from "geojson";
import { useRouter } from "next/navigation";
import { retirarCamino } from "@/app/actions/caminos";
import { borrarAnotacion } from "@/app/actions/territorio";
import { PantallaDeMapas } from "@/components/mapas/pantalla-de-mapas";
import { MapaDeMarcas } from "@/components/marcas/mapa-de-marcas";
import { ListaDeMarcas } from "@/components/marcas/lista-de-marcas";
import { EditorDeDetalle, type QueEditar } from "@/components/marcas/editor-de-detalle";
import { DibujarCamino } from "@/components/marcas/dibujar-camino";
import { TraerCaminosDeAfuera } from "@/components/caminos/traer-caminos-de-afuera";
import { EditorDeCamino } from "@/components/caminos/editor-de-camino";
import { BotonAgregar } from "@/components/ui/boton-agregar";
import { Emergente, BotonDeEmergente } from "@/components/ui/emergente";
import { ListaYMapa } from "@/components/ui/lista-y-mapa";
import { ReferenciaDePartes } from "@/components/rutas/referencia-de-partes";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useDialogos } from "@/components/ui/dialogos";
import type { AccionDelMenu } from "@/components/ui/menu-de-acciones";
import { useActividadPrincipal } from "@/hooks/use-actividad-principal";
import { useCaminosGuardados } from "@/hooks/use-caminos-guardados";
import { useCerrarConAtras } from "@/hooks/use-cerrar-con-atras";
import { usePantallaAncha } from "@/hooks/use-pantalla-ancha";
import { usePreferencia } from "@/hooks/use-preferencia";
import { sectoresPorZona } from "@/lib/mapas/general";
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
  type GrupoDeLaLista,
  type MarcaDeLaLista,
} from "@/lib/marcas/lista";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import type { Paquete } from "@/lib/offline/paquete";
import { ponerAlDiaDespuesDeGuardar } from "@/lib/offline/puesta-al-dia";
import type { Anotacion, CategoriaUsuario, Rectangulo, Zona } from "@/types/database";
import { IconoDeClase } from "@/components/marcas/icono-de-clase";
import { useQuienSoy } from "@/components/armazon/quien-soy";

/**
 * **Marcas**: todo lo que se dibuja encima del mapa, en detalle (decisión 052).
 *
 * Todos la consultan: la lista con tildes y filtros, y el mapa con lo
 * tildado. Administrador y Premium además ven el «+» para agregar —a mano o
 * trayendo un archivo— y los tres puntos para editar o eliminar lo que les
 * toca. Lo que trajo de OpenStreetMap no se edita: queda como vino de
 * OpenStreetMap.
 *
 * Lo elegido —tildes y filtros— se recuerda en el celular.
 */

type Vista =
  | { clase: "lista" }
  | { clase: "traer" }
  | { clase: "dibujar-camino" }
  | { clase: "detalle"; que: QueEditar }
  | { clase: "editar-camino"; id: number };

const LISTA: Vista = { clase: "lista" };

export function PantallaDeMarcas() {
  const { miCategoria: categoria, miPerfilId } = useQuienSoy();
  return (
    <PantallaDeMapas titulo="Marcas" ancha avisaIncompletoSola>
      {({ paquete, estado, aviso }) => <Marcas paquete={paquete} incompleto={estado === "incompleto" ? aviso : null}
        categoria={categoria} miPerfilId={miPerfilId} />}
    </PantallaDeMapas>
  );
}

function Marcas({ paquete, incompleto, categoria, miPerfilId }: {
  paquete: Paquete | null;
  incompleto: string | null;
  categoria: CategoriaUsuario;
  miPerfilId: string | null;
}) {
  const router = useRouter();
  const { confirmar, avisar } = useDialogos();
  const ancha = usePantallaAncha();
  const [vista, setVista] = useState<Vista>(LISTA);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [eligiendo, setEligiendo] = useState<"nada" | "como" | "que">("nada");
  const [panelArriba, setPanelArriba] = useState(false);
  const [encuadre, setEncuadre] = useState<Rectangulo | null>(null);
  const [actividadPrincipal] = useActividadPrincipal();
  const [filtros, guardarFiltros] = usePreferencia<FiltrosDeMarcas>("filtros-de-marcas", SIN_FILTROS, leerFiltrosDeMarcas);
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
  const enElMapa = useMemo(
    () => lasDelMapa(marcas, filtrosQueSeAplican(filtros), miPerfilId, destildadas),
    [marcas, filtros, miPerfilId, destildadas],
  );
  // La actividad del filtro manda en el mapa; sin filtro, la principal de siempre.
  const actividad = filtros.actividad ?? actividadPrincipal;

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

  // En la computadora el mapa está al lado: cada cambio se encuadra al
  // instante. En el celular se encuadra al bajar el panel.
  const alCambiarLoElegido = (nuevosFiltros: FiltrosDeMarcas, nuevasDestildadas: string[]) => {
    if (ancha) setEncuadre(encuadreDe(lasDelMapa(marcas, filtrosQueSeAplican(nuevosFiltros), miPerfilId, new Set(nuevasDestildadas))));
  };
  const cambiarFiltros = (nuevos: FiltrosDeMarcas) => {
    guardarFiltros(nuevos);
    alCambiarLoElegido(nuevos, destildadasGuardadas);
  };
  const cambiarDestildadas = (nuevas: string[]) => {
    guardarDestildadas(nuevas);
    alCambiarLoElegido(filtros, nuevas);
  };
  const alCambiarPanel = (arriba: boolean) => {
    if (!arriba) setEncuadre(encuadreDe(enElMapa));
    setPanelArriba(arriba);
  };
  const mostrar = (marca: MarcaDeLaLista) => {
    if (destildadas.has(marca.clave)) cambiarDestildadas(alternarUna(marca.clave, destildadasGuardadas));
    setEncuadre(encuadreDe([marca]));
    setPanelArriba(false);
  };

  const volverALista = useCallback((nuevoMensaje: string | null) => {
    setVista(LISTA);
    setMensaje(nuevoMensaje);
  }, []);
  // Adentro de agregar o editar, el atrás del celular vuelve a la lista.
  const alAtras = useCallback(() => volverALista(null), [volverALista]);
  useCerrarConAtras(vista.clase !== "lista" && vista.clase !== "dibujar-camino", alAtras);

  const eliminarCamino = async (camino: { id: number; nombre: string; actualizadoEn: string }) => {
    const seguro = await confirmar({ titulo: `¿Eliminar «${camino.nombre}»?`,
      mensaje: "Deja de verse en el mapa de todos. No se puede deshacer desde la app.",
      textoDeAceptar: "Eliminar el Camino", destructivo: true });
    if (!seguro) return;
    try {
      const resultado = await retirarCamino(camino.id, camino.actualizadoEn);
      if (!resultado.ok) { await avisar({ titulo: "No se eliminó el Camino", mensaje: resultado.error }); return; }
      await ponerAlDiaDespuesDeGuardar();
      setMensaje(`Camino «${camino.nombre}» eliminado.`);
      router.refresh();
    } catch (error) {
      await avisar({ titulo: "No se eliminó el Camino",
        mensaje: `${error instanceof Error ? error.message : String(error)}. Revisá la señal y probá de nuevo.` });
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
      setMensaje(`${nombre === "punto" ? "Punto eliminado" : "Trazo eliminado"}.`);
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
  if (vista.clase === "dibujar-camino") return <DibujarCamino alVolver={volverALista} />;
  if (vista.clase === "detalle") return <EditorDeDetalle que={vista.que} alVolver={volverALista} />;
  if (vista.clase === "editar-camino") return <EditorDeCamino id={vista.id} alVolver={() => volverALista(null)} />;

  const cuantas = enElMapa.filter((marca) => marca.grupo !== "zona").length;
  const zonasEnElMapa = enElMapa.length - cuantas;

  return (
    <div className="space-y-3">
      <ListaYMapa
        tituloDelPanel="Marcas"
        pantallaCompletaEnCelular="Marcas" destinoSiNoHayVuelta="/mapas"
        accionDelEncabezado={puedeAgregar ? <BotonAgregar etiqueta="Agregar una marca" alTocar={() => { setPanelArriba(false); setEligiendo("como"); }} /> : null}
        avisos={mensaje || (cargandoCaminos && caminosSinLinea.length > 0) || errorDeCaminos || incompleto ? <>
          {mensaje ? (
            <Tarjeta franja={/no |todavía|ya no/i.test(mensaje) ? "ambar" : "verde"} className="flex items-start gap-3">
              <p role="status" className="flex-1 text-base text-texto">{mensaje}</p>
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
        panel={
          <ListaDeMarcas
            marcas={marcas}
            caminos={porId.caminosSinLinea}
            detalles={porId.detalles}
            zonas={porId.zonas}
            sectoresPorZona={cantidades}
            filtros={filtros}
            alCambiarFiltros={cambiarFiltros}
            miPerfilId={miPerfilId}
            destildadas={destildadas}
            alTildarUna={(clave) => cambiarDestildadas(alternarUna(clave, destildadasGuardadas))}
            alTildarGrupo={(grupo: GrupoArmado) => cambiarDestildadas(alternarGrupo(grupo, destildadasGuardadas))}
            alMostrar={mostrar}
            accionesDe={accionesDe}
            adentroDelGrupo={{ camino: <ReferenciaDePartes /> }}
          />
        }
        mapa={
          <MapaDeMarcas
            llenarElLugar
            zonas={dibujo.zonas}
            anotaciones={dibujo.detalles}
            caminos={dibujo.caminos}
            actividad={actividad}
            sectoresPorZona={cantidades}
            encuadre={encuadre}
            avisoSinNada={enElMapa.length === 0
              ? marcas.length === 0
                ? "Todavía no hay marcas en el mapa."
                : "No hay nada tildado para ver. Abrí la lista y tildá lo que quieras mirar."
              : null}
          />
        }
      />

      <Emergente hoja abierto={eligiendo !== "nada"} alCerrar={() => setEligiendo("nada")}
        titulo={eligiendo === "que" ? "¿Qué vas a dibujar?" : "Agregar una marca"}
        descripcion={eligiendo === "que" ? "Primero elegí qué es; después lo dibujás sobre el mapa." : undefined}>
        {eligiendo === "como" ? (
          <div className="space-y-2">
            <OpcionDeAgregar titulo="A mano" detalle="Dibujás un Camino, un punto o un trazo sobre el mapa."
              alTocar={() => setEligiendo("que")} />
            <OpcionDeAgregar titulo="Traer de afuera" detalle="Desde un archivo de Google Earth o de un GPS (KML, KMZ o GPX)."
              alTocar={() => { setEligiendo("nada"); setVista({ clase: "traer" }); }} />
          </div>
        ) : eligiendo === "que" ? (
          <div className="space-y-2">
            <OpcionDeAgregar grupo="camino" titulo="Camino" detalle="Por dónde se puede pasar. Después cargás el nombre y las actividades."
              alTocar={() => { setEligiendo("nada"); setVista({ clase: "dibujar-camino" }); }} />
            <OpcionDeAgregar grupo="punto" titulo="Punto" detalle="Un lugar: refugio, arroyo, cruce, tranquera…"
              alTocar={() => { setEligiendo("nada"); setVista({ clase: "detalle", que: { clase: "nuevo", tipo: "punto" } }); }} />
            <OpcionDeAgregar grupo="trazo" titulo="Trazo" detalle="Una línea para mirar: un río, una huella, un alambrado que falta."
              alTocar={() => { setEligiendo("nada"); setVista({ clase: "detalle", que: { clase: "nuevo", tipo: "trazo" } }); }} />
            <BotonDeEmergente onClick={() => setEligiendo("como")}>Volver</BotonDeEmergente>
          </div>
        ) : null}
      </Emergente>
    </div>
  );
}

function OpcionDeAgregar({ grupo, titulo, detalle, alTocar }: { grupo?: GrupoDeLaLista; titulo: string; detalle: string; alTocar: () => void }) {
  return (
    <button type="button" onClick={alTocar}
      className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-borde bg-superficie px-3 py-2 text-left shadow-[var(--sombra)] hover:border-acento-borde focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde">
      {grupo ? <span className="shrink-0 text-texto-suave"><IconoDeClase grupo={grupo} /></span> : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-base font-semibold text-texto">{titulo}</span>
        <span className="text-sm leading-5 text-texto-suave">{detalle}</span>
      </span>
    </button>
  );
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
