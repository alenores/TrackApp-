"use client";

import { comparteActividad } from "@/lib/caminos/seleccion-del-mapa";
import { useMemo, useState } from "react";
import { PantallaDeMapas } from "@/components/mapas/pantalla-de-mapas";
import { MapaDeMarcas } from "@/components/marcas/mapa-de-marcas";
import { SelectorDeActividadesDelMapa } from "@/components/caminos/selector-de-actividades-del-mapa";
import { ListaYMapa } from "@/components/ui/lista-y-mapa";
import { RenglonDeCapa } from "@/components/ui/renglon-de-capa";
import { CLASE_DE_TITULO_DE_SECCION } from "@/components/ui/opciones";
import { Campo } from "@/components/ui/campo";
import { LineasDelTerritorio } from "@/components/mapas/lineas-del-territorio";
import { Tarjeta } from "@/components/ui/tarjeta";
import { queEs } from "@/components/anotaciones/icono-de-anotacion";
import { IconoDeClase } from "@/components/marcas/icono-de-clase";
import { useSeleccionDelMapa } from "@/hooks/use-seleccion-del-mapa";
import { useCaminosGuardados } from "@/hooks/use-caminos-guardados";
import { usePreferencia } from "@/hooks/use-preferencia";
import { sectoresPorZona } from "@/lib/mapas/general";
import type { VistaDeLineas } from "@/lib/mapas/lineas-del-territorio";
import { CAPAS_DE_CONSULTAS, leerCapasDeConsultas, resumenDeCapas, TODAS_LAS_CAPAS, type CapaDeConsultas } from "@/lib/marcas/consultas";
import { buscarEnConsultas, type BusquedaDeConsultas, type CoincidenciaDeConsulta, type ElementoBuscable } from "@/lib/marcas/buscar-en-consultas";
import { rectanguloDe } from "@/lib/marcas/lista";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import type { Anotacion, Rectangulo, Zona } from "@/types/database";
import type { Paquete } from "@/lib/offline/paquete";

/**
 * **Consultas**, la entrada de Mapas para todo público: el mapa con todo lo
 * marcado y las zonas, para mirar.
 *
 * El fondo se elige: Google (con señal), Simple o Satelital. Simple y
 * Satelital muestran solo lo bajado en el celular —sin internet ni caché de
 * Google— para chequear en casa qué va a verse en el cerro. Las marcas van
 * encima siempre.
 *
 * Arriba del panel hay un buscador. No distingue mayúsculas ni tildes, y si
 * el mismo texto está en una zona, un Camino y un detalle, la zona queda
 * primera. Los resultados van justo debajo del cuadro, todos en un recuadro.
 * Al elegir uno, el mapa se acerca para mostrarlo.
 *
 * Los filtros son pocos a propósito: la actividad (que decide qué
 * clasificación de los Caminos se destaca) y prender o apagar Caminos, Zonas y
 * Detalles. Destildar Zonas oculta sus líneas. Con Zonas prendida, adentro se
 * elige si se ven solo las zonas o también los sectores. Detalles junta
 * puntos y trazos. Lo elegido se recuerda en el celular. En Caminos no va la
 * ayuda de colores y líneas.
 *
 * El detalle fino —tildar marca por marca— está en Marcas, que es para quien
 * carga y necesita ver con lupa.
 */
/** Detalles junta puntos y trazos: lleva los dos íconos. */
const ICONOS_DE_LA_CAPA: Record<CapaDeConsultas, ElementoBuscable["grupo"][]> = {
  caminos: ["camino"],
  zonas: ["zona"],
  detalles: ["punto", "trazo"],
};

export function PantallaDeConsultas() {
  return (
    <PantallaDeMapas titulo="Consultas" ancha avisaIncompletoSola>
      {({ paquete, estado, aviso }) => <Consultas paquete={paquete} incompleto={estado === "incompleto" ? aviso : null} />}
    </PantallaDeMapas>
  );
}

function Consultas({ paquete, incompleto }: { paquete: Paquete | null; incompleto: string | null }) {
  const [seleccion, elegirSeleccion] = useSeleccionDelMapa();
  const actividad = seleccion.principal;
  const [capas, guardarCapas] = usePreferencia<CapaDeConsultas[]>("capas-de-consultas", TODAS_LAS_CAPAS, leerCapasDeConsultas);
  const [panelArriba, setPanelArriba] = useState(false);
  const [texto, setTexto] = useState("");
  const [encuadre, setEncuadre] = useState<Rectangulo | null>(null);
  const [viaje, setViaje] = useState(0);
  const [avisoDeBusqueda, setAvisoDeBusqueda] = useState<string | null>(null);
  const [lineas, setLineas] = useState<VistaDeLineas>("zonas");

  const zonas = useMemo(() => paquete?.zonas ?? [], [paquete]);
  const anotaciones = useMemo(() => paquete?.anotaciones ?? [], [paquete]);
  const caminosSinLinea = useMemo(() => paquete?.caminos ?? [], [paquete]);
  const cantidades = useMemo(() => sectoresPorZona(paquete?.sectores ?? []), [paquete]);
  const { caminos, error: errorDeCaminos, cargando: cargandoCaminos } = useCaminosGuardados(caminosSinLinea);

  const elementos = useMemo(() => elementosParaBuscar(zonas, caminosSinLinea, anotaciones), [zonas, caminosSinLinea, anotaciones]);
  const busqueda = useMemo(() => buscarEnConsultas(texto, elementos), [texto, elementos]);
  const buscando = texto.trim().length > 0;

  const ver = (capa: CapaDeConsultas) => capas.includes(capa);
  const alternar = (capa: CapaDeConsultas) => {
    const prendida = ver(capa);
    if (capa === "zonas" && prendida) setLineas("nada");
    if (capa === "zonas" && !prendida && lineas === "nada") setLineas("zonas");
    guardarCapas(prendida ? capas.filter((cada) => cada !== capa) : [...capas, capa]);
  };
  const elegir = (coincidencia: CoincidenciaDeConsulta) => {
    if (!ver(coincidencia.capa)) guardarCapas([...capas, coincidencia.capa]);
    if (coincidencia.capa === "zonas" && lineas === "nada") setLineas("zonas");
    const lugar = lugarParaVer(coincidencia, zonas, caminos, anotaciones, cargandoCaminos);
    if ("aviso" in lugar) {
      setAvisoDeBusqueda(lugar.aviso);
      return;
    }
    setAvisoDeBusqueda(null);
    setEncuadre(lugar.encuadre);
    setViaje((vez) => vez + 1);
    setPanelArriba(false);
  };

  return (
    <div className="space-y-3">
      <ListaYMapa
        avisos={cargandoCaminos && caminosSinLinea.length > 0 || errorDeCaminos || incompleto ? <>
          {cargandoCaminos && caminosSinLinea.length > 0 ? <p role="status" className="text-base text-texto">Abriendo los Caminos…</p> : null}
          {errorDeCaminos ? <Tarjeta franja="ambar"><p role="alert" className="text-base text-texto">{errorDeCaminos}</p></Tarjeta> : null}
          {incompleto ? <Tarjeta franja="ambar"><p role="alert" className="text-base text-texto">Lo que ves puede estar incompleto: {incompleto}. Recargá para intentar de nuevo.</p></Tarjeta> : null}
        </> : null}
        tituloDelPanel="Qué mirar"
        pantallaCompletaEnCelular="Consultas" destinoSiNoHayVuelta="/mapas"
        panelCorto
        resumen={resumenDeCapas(capas)}
        abierto={panelArriba}
        alCambiarAbierto={setPanelArriba}
        cabezaDelPanel={
          <div className="space-y-2">
            <Campo
              label="Buscar"
              type="search"
              placeholder="Zona, Camino o detalle"
              value={texto}
              autoComplete="off"
              spellCheck={false}
              onChange={(evento) => {
                setTexto(evento.target.value);
                setAvisoDeBusqueda(null);
              }}
            />
            {avisoDeBusqueda ? <p role="status" className="text-base text-texto">{avisoDeBusqueda}</p> : null}
            {buscando ? <ResultadosDeLaBusqueda busqueda={busqueda} alElegir={elegir} /> : null}
          </div>
        }
        panel={
          <div className="space-y-2">
            <p className={CLASE_DE_TITULO_DE_SECCION}>Mostrar</p>
            {CAPAS_DE_CONSULTAS.map((capa) => (
              <RenglonDeCapa key={capa.valor} titulo={capa.etiqueta} queMuestra={capa.queMuestra}
                icono={ICONOS_DE_LA_CAPA[capa.valor].map((grupo) => <IconoDeClase key={grupo} grupo={grupo} />)}
                prendida={ver(capa.valor)} alAlternar={() => alternar(capa.valor)}>
                {capa.valor === "caminos" && ver("caminos") ? (
                  <SelectorDeActividadesDelMapa seleccion={seleccion} alCambiar={elegirSeleccion}
                    ocultos={caminosSinLinea.filter((camino) => !comparteActividad(camino.actividades ?? [], seleccion.visibles)).length} />
                ) : capa.valor === "zonas" && ver("zonas") ? (
                  zonas.length === 0 ? (
                    <p className="text-sm text-texto-suave">Todavía no hay zonas dibujadas en Córdoba.</p>
                  ) : (
                    <LineasDelTerritorio lugar="en-zonas" valor={lineas} alElegir={setLineas} />
                  )
                ) : null}
              </RenglonDeCapa>
            ))}
          </div>
        }
        mapa={
          <MapaDeMarcas
            llenarElLugar
            chequeoDeDescarga
            zonas={ver("zonas") ? zonas : []}
            sectores={paquete?.sectores ?? []}
            lineas={lineas}
            anotaciones={ver("detalles") ? anotaciones : []}
            caminos={ver("caminos") ? caminos.filter((camino) => comparteActividad(camino.actividades, seleccion.visibles)) : []}
            actividad={actividad}
            sectoresPorZona={cantidades}
            encuadre={encuadre}
            viaje={viaje}
            avisoSinNada={capas.length === 0 ? "No elegiste nada para mirar. Abrí los filtros y prendé Caminos, Zonas o Detalles." : null}
          />
        }
      />
    </div>
  );
}

/** Los resultados van juntos, justo debajo del cuadro de buscar. */
function ResultadosDeLaBusqueda({ busqueda, alElegir }: {
  busqueda: BusquedaDeConsultas;
  alElegir: (coincidencia: CoincidenciaDeConsulta) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-borde bg-superficie">
      <p className={`px-3 pt-2 ${CLASE_DE_TITULO_DE_SECCION}`}>Resultados</p>
      {busqueda.lista.length === 0 ? (
        <p role="status" className="px-3 py-2 text-base text-texto-suave">Nada coincide con eso. Probá con otra palabra.</p>
      ) : (
        <ul className="max-h-60 overflow-y-auto" aria-label="Resultados de la búsqueda">
          {busqueda.lista.map((coincidencia) => (
            <li key={`${coincidencia.capa}-${coincidencia.id}`} className="border-t border-borde">
              <button type="button" onClick={() => alElegir(coincidencia)}
                className={`${CLASE_DE_RESPUESTA_AL_TOQUE} flex min-h-10 w-full items-center gap-3 px-3 text-left hover:bg-superficie-alta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-acento-borde`}>
                <span className="text-texto-suave"><IconoDeClase grupo={coincidencia.grupo} /></span>
                <span className="min-w-0 flex-1 truncate text-base font-semibold text-texto">{coincidencia.titulo}</span>
                <span className="shrink-0 text-base text-texto-suave">{coincidencia.aclaracion}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {busqueda.hayMas ? (
        <p role="status" className="border-t border-borde px-3 py-2 text-base text-texto-suave">Hay más. Seguí escribiendo para achicar la lista.</p>
      ) : null}
    </div>
  );
}

function elementosParaBuscar(
  zonas: Zona[],
  caminos: { id: number; nombre: string }[],
  anotaciones: Anotacion[],
): ElementoBuscable[] {
  return [
    ...zonas.map((zona): ElementoBuscable => ({
      capa: "zonas", id: zona.id, titulo: zona.nombre, aclaracion: "Zona", textos: [zona.nombre], grupo: "zona",
    })),
    ...caminos.map((camino): ElementoBuscable => ({
      capa: "caminos", id: camino.id, titulo: camino.nombre, aclaracion: "Camino", textos: [camino.nombre], grupo: "camino",
    })),
    ...anotaciones.map((anotacion): ElementoBuscable => {
      const nombre = queEs(anotacion);
      const comentario = anotacion.comentario?.trim() ?? "";
      return {
        capa: "detalles",
        id: anotacion.id,
        titulo: comentario || nombre,
        aclaracion: comentario ? nombre : "Detalle",
        textos: comentario ? [comentario, nombre] : [nombre],
        grupo: anotacion.tipo === "trazo" ? "trazo" : "punto",
      };
    }),
  ];
}

/** El rectángulo al que hay que acercar el mapa, o por qué no se puede. */
function lugarParaVer(
  coincidencia: CoincidenciaDeConsulta,
  zonas: Zona[],
  caminos: CaminoGuardado[],
  anotaciones: Anotacion[],
  cargandoCaminos: boolean,
): { encuadre: Rectangulo } | { aviso: string } {
  if (coincidencia.capa === "zonas") {
    const zona = zonas.find((cada) => cada.id === coincidencia.id);
    if (!zona) return { aviso: "Esa zona ya no está. Recargá la pantalla para ver la lista de nuevo." };
    return { encuadre: { ...zona.rectangulo } };
  }
  if (coincidencia.capa === "caminos") {
    const camino = caminos.find((cada) => cada.id === coincidencia.id);
    const encuadre = camino ? rectanguloDe(camino.coordenadas) : null;
    if (encuadre) return { encuadre };
    return {
      aviso: cargandoCaminos
        ? "Este Camino se está abriendo. Esperá un momento y volvé a tocarlo."
        : "Este Camino no tiene la línea en este celular. Abrí la app con conexión en casa para descargarla.",
    };
  }
  const geometria = anotaciones.find((cada) => cada.id === coincidencia.id)?.geometria;
  const coordenadas = !geometria ? [] : geometria.type === "Point" ? [geometria.coordinates] : geometria.coordinates;
  const encuadre = rectanguloDe(coordenadas);
  if (!encuadre) return { aviso: "Este detalle no tiene un lugar en el mapa. Recargá la pantalla para verlo de nuevo." };
  return { encuadre };
}
