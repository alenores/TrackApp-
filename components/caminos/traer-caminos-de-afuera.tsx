"use client";

import { useMemo, useState } from "react";
import type { FeatureCollection, LineString } from "geojson";
import { crearCaminoNuevo } from "@/app/actions/caminos";
import { crearAnotacionesEnTanda, type DatosDeAnotacion } from "@/app/actions/territorio";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { leerArchivoDeCaminos, FORMATOS_DE_CAMINOS, type LecturaDeCaminos } from "@/lib/caminos/archivo";
import { iconoPorElNombre } from "@/lib/anotaciones/importar";
import { COMO_SE_LLAMA } from "@/lib/anotaciones/iconos";
import { COLORES_DE_TRAZO, TRAZO, type ColorDeTrazo } from "@/lib/anotaciones/colores-de-trazo";
import { ACTIVIDADES } from "@/lib/rutas/actividades";
import { rectanguloQueAbarca } from "@/lib/datos/rectangulo";
import { ponerAlDiaDespuesDeGuardar } from "@/lib/offline/puesta-al-dia";
import type { ActividadRuta, IconoPunto } from "@/types/database";

type DestinoDeLinea = "camino" | "trazo" | "omitir" | null;
type DestinoDePunto = "sumar" | "omitir" | null;
type EleccionDeLinea = { destino: DestinoDeLinea; nombre: string; color: ColorDeTrazo };
type EleccionDePunto = { destino: DestinoDePunto; icono: IconoPunto };
type ElementoEnVista = { tipo: "linea" | "punto"; indice: number } | null;

function textoDelMarcador(nombre: string | null, descripcion: string | null): string | null {
  const textos = [nombre, descripcion].filter((texto): texto is string => Boolean(texto?.trim()));
  return textos.join(" · ") || null;
}

export function TraerCaminosDeAfuera({ alVolver }: { alVolver: () => void }) {
  const [lectura, setLectura] = useState<LecturaDeCaminos | null>(null);
  const [nombreDelArchivo, setNombreDelArchivo] = useState("");
  const [lineas, setLineas] = useState<EleccionDeLinea[]>([]);
  const [puntos, setPuntos] = useState<EleccionDePunto[]>([]);
  const [actividades, setActividades] = useState<ActividadRuta[]>([]);
  const [leyendo, setLeyendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardadas, setGuardadas] = useState<Set<number>>(new Set());
  const [anotacionesGuardadas, setAnotacionesGuardadas] = useState(false);
  const [elementoEnVista, setElementoEnVista] = useState<ElementoEnVista>(null);

  const datos = lectura?.ok ? lectura : null;
  const pendientes = datos ? lineas.filter((linea) => linea.destino === null).length + puntos.filter((punto) => punto.destino === null).length : 0;
  const cantidadDeCaminos = lineas.filter((linea) => linea.destino === "camino").length;
  const cantidadDeTrazos = lineas.filter((linea) => linea.destino === "trazo").length;
  const cantidadDePuntos = puntos.filter((punto) => punto.destino === "sumar").length;
  const listo = datos && pendientes === 0 && cantidadDeCaminos + cantidadDeTrazos + cantidadDePuntos > 0
    && (cantidadDeCaminos === 0 || actividades.length > 0)
    && lineas.every((linea) => linea.destino !== "camino" || linea.nombre.trim().length > 0);
  const vistaPrevia = useMemo(() => {
    if (!datos) return null;
    const elegido = elementoEnVista;
    const coordenadas = elegido?.tipo === "linea"
      ? datos.lineas[elegido.indice]?.coordenadas
      : elegido?.tipo === "punto"
        ? [datos.puntos[elegido.indice]?.coordenada].filter((punto): punto is number[] => Boolean(punto))
        : [...datos.lineas.flatMap((linea) => linea.coordenadas), ...datos.puntos.map((punto) => punto.coordenada)];
    const caminos: FeatureCollection<LineString> = {
      type: "FeatureCollection",
      features: datos.lineas.map((linea, indice) => ({
        type: "Feature",
        properties: {
          paso: elegido?.tipo === "linea" && elegido.indice === indice ? "por_explorar" : "otra_actividad",
          complejidad: null,
          nombre: linea.nombreSugerido,
        },
        geometry: { type: "LineString", coordinates: linea.coordenadas },
      })),
    };
    return {
      caminos,
      encuadre: coordenadas?.length ? rectanguloQueAbarca(coordenadas.map((punto) => [punto[0], punto[1]])) : null,
      punto: elegido?.tipo === "punto" ? [datos.puntos[elegido.indice]?.coordenada].filter((punto): punto is number[] => Boolean(punto)) : null,
    };
  }, [datos, elementoEnVista]);

  const elegirArchivo = async (archivo: File | undefined) => {
    if (!archivo) return;
    setLeyendo(true);
    setAviso(null);
    setLectura(null);
    setGuardadas(new Set());
    setAnotacionesGuardadas(false);
    setNombreDelArchivo(archivo.name);
    setElementoEnVista(null);
    try {
      const resultado = await leerArchivoDeCaminos(archivo);
      setLectura(resultado);
      if (resultado.ok) {
        setLineas(resultado.lineas.map((linea) => ({ destino: null, nombre: linea.nombreSugerido, color: "huella" })));
        setPuntos(resultado.puntos.map((punto) => ({ destino: null, icono: iconoPorElNombre(punto.nombre) })));
        setActividades([]);
        if (resultado.lineas.length + resultado.puntos.length === 0) {
          setAviso("No hay líneas ni puntos que se puedan sumar. Elegí otro archivo.");
        }
      } else setAviso(resultado.error);
    } catch (causa) {
      setAviso(`No se pudo abrir el archivo: ${causa instanceof Error ? causa.message : String(causa)}. Probá elegirlo de nuevo.`);
    } finally {
      setLeyendo(false);
    }
  };

  const actualizarLinea = (indice: number, cambio: Partial<EleccionDeLinea>) => {
    setLineas((actuales) => actuales.map((linea, i) => i === indice ? { ...linea, ...cambio } : linea));
  };
  const actualizarPunto = (indice: number, cambio: Partial<EleccionDePunto>) => {
    setPuntos((actuales) => actuales.map((punto, i) => i === indice ? { ...punto, ...cambio } : punto));
  };

  const sumarAlMapa = async () => {
    if (!datos || !listo || guardando) return;
    setGuardando(true);
    setAviso(null);
    let nuevoError: string | null = null;
    const hechas = new Set(guardadas);
    let anotacionesHechas = anotacionesGuardadas;
    try {
      for (const [indice, linea] of datos.lineas.entries()) {
        if (lineas[indice].destino !== "camino" || hechas.has(indice)) continue;
        const resultado = await crearCaminoNuevo({
          nombre: lineas[indice].nombre,
          descripcion: linea.descripcionEsHtml ? null : linea.descripcion,
          actividades,
          coordenadas: linea.coordenadas,
        });
        if (!resultado.ok) { nuevoError = `El Camino ${indice + 1} no quedó guardado: ${resultado.error}`; break; }
        hechas.add(indice);
        setGuardadas(new Set(hechas));
      }

      if (!nuevoError && !anotacionesHechas) {
        const anotaciones: Array<Omit<DatosDeAnotacion, "sectorId" | "foto" | "fotoChica" | "quitarLaFoto">> = [
          ...datos.lineas.flatMap((linea, indice) => lineas[indice].destino === "trazo" ? [{
            tipo: "trazo" as const,
            icono: null,
            color: TRAZO[lineas[indice].color].color,
            comentario: textoDelMarcador(linea.nombre, linea.descripcionEsHtml ? null : linea.descripcion),
            geometria: { type: "LineString" as const, coordinates: linea.coordenadas },
          }] : []),
          ...datos.puntos.flatMap((punto, indice) => puntos[indice].destino === "sumar" ? [{
            tipo: "punto" as const,
            icono: puntos[indice].icono,
            color: null,
            comentario: textoDelMarcador(punto.nombre, punto.descripcionEsHtml ? null : punto.descripcion),
            geometria: { type: "Point" as const, coordinates: punto.coordenada },
          }] : []),
        ];
        if (anotaciones.length > 0) {
          const resultado = await crearAnotacionesEnTanda(null, anotaciones, "google_earth");
          if (!resultado.ok) nuevoError = `Los Caminos guardados siguen en el mapa, pero las anotaciones no se sumaron: ${resultado.error}`;
        }
        if (!nuevoError) {
          anotacionesHechas = true;
          setAnotacionesGuardadas(true);
        }
      }

      if (hechas.size > 0 || anotacionesHechas) {
        const sincronizacion = await ponerAlDiaDespuesDeGuardar();
        if (sincronizacion.clase === "fallo") {
          nuevoError = `${nuevoError ? `${nuevoError} ` : ""}Lo guardado no aparece todavía en este celular: ${sincronizacion.motivo}. Volvé a poner la app al día con conexión.`;
        }
      }
      setAviso(nuevoError ?? `Se sumaron ${cantidadDeCaminos} Caminos, ${cantidadDeTrazos} trazos y ${cantidadDePuntos} puntos al mapa. El archivo original no se guardó.`);
    } catch (causa) {
      setAviso(`Se interrumpió el guardado: ${causa instanceof Error ? causa.message : String(causa)}. Lo ya guardado no se repetirá si tocás de nuevo.`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Boton variante="secundario" onClick={alVolver} disabled={guardando}>Volver</Boton>
        <h2 className="text-xl font-bold text-texto">Traer de afuera</h2>
      </div>
      <p className="text-base text-texto-suave">Elegí un archivo de Google Earth o GPS. Vas a decidir qué es cada línea y cada punto. El archivo original no se guarda.</p>
      <label className="block text-base font-medium text-texto">
        Archivo KML, KMZ o GPX
        <input className="mt-2 block w-full text-base text-texto" type="file" accept={FORMATOS_DE_CAMINOS}
          disabled={leyendo || guardando} onChange={(evento) => void elegirArchivo(evento.currentTarget.files?.[0])} />
      </label>
      {leyendo ? <p role="status" className="text-base text-texto">Leyendo el archivo…</p> : null}
      {aviso ? <Tarjeta franja={aviso.startsWith("Se sumaron") ? undefined : "ambar"}><p role="alert" className="text-base text-texto">{aviso}</p></Tarjeta> : null}
      {datos ? (
        <>
          <p className="text-base text-texto">{nombreDelArchivo}: {datos.lineas.length} líneas, {datos.puntos.length} puntos y {datos.omitidos.length} elementos que no se pueden usar.</p>
          {datos.omitidos.map((elemento) => <p key={elemento.orden} className="text-base text-ambar-texto">{elemento.nombre ?? `Elemento ${elemento.orden + 1}`}: {elemento.motivo}</p>)}
          {vistaPrevia ? (
            <div className="space-y-2">
              <p className="text-base text-texto">{elementoEnVista ? `Vista previa: ${elementoEnVista.tipo === "linea" ? datos.lineas[elementoEnVista.indice]?.nombreSugerido : datos.puntos[elementoEnVista.indice]?.nombreSugerido}. Las demás líneas se ven más tenues.` : "Vista previa del archivo completo. Elegí «Ver en el mapa» para destacar una línea o un punto."}</p>
              <CargadorDeMapa key={`${nombreDelArchivo}-${elementoEnVista?.tipo ?? "todo"}-${elementoEnVista?.indice ?? 0}`}
                enVivo principal caminos={vistaPrevia.caminos} verticesDeCamino={vistaPrevia.punto}
                encuadre={vistaPrevia.encuadre} />
              {elementoEnVista ? <Boton variante="secundario" onClick={() => setElementoEnVista(null)}>Ver todo el archivo</Boton> : null}
            </div>
          ) : null}
          {datos.lineas.length > 0 ? <h3 className="text-lg font-bold text-texto">Líneas</h3> : null}
          {datos.lineas.map((linea, indice) => (
            <Tarjeta key={`linea-${linea.orden}`} className="space-y-3">
              <p className="text-base font-semibold text-texto">{indice + 1}. {linea.nombreSugerido} · {(linea.largoM / 1000).toFixed(1).replace(".", ",")} km</p>
              <Boton variante="secundario" onClick={() => setElementoEnVista({ tipo: "linea", indice })}>Ver en el mapa</Boton>
              <div className="flex flex-wrap gap-2">
                {(["camino", "trazo", "omitir"] as const).map((destino) => (
                  <Boton key={destino} variante={lineas[indice]?.destino === destino ? "principal" : "secundario"}
                    aria-pressed={lineas[indice]?.destino === destino} disabled={guardando || guardadas.has(indice)}
                    onClick={() => actualizarLinea(indice, { destino })}>
                    {destino === "camino" ? "Camino" : destino === "trazo" ? "Trazo de referencia" : "Omitir"}
                  </Boton>
                ))}
              </div>
              {lineas[indice]?.destino === "camino" ? (
                <label className="block text-base text-texto">Nombre del Camino
                  <input className="mt-1 block w-full rounded-xl border border-borde bg-superficie p-2 text-texto" value={lineas[indice].nombre}
                    maxLength={120} disabled={guardando || guardadas.has(indice)} onChange={(evento) => actualizarLinea(indice, { nombre: evento.target.value })} />
                </label>
              ) : null}
              {lineas[indice]?.destino === "trazo" ? (
                <div className="flex flex-wrap gap-2" aria-label="Color del trazo">
                  {COLORES_DE_TRAZO.map((color) => <Boton key={color} variante={lineas[indice].color === color ? "principal" : "secundario"}
                    aria-pressed={lineas[indice].color === color} disabled={guardando || anotacionesGuardadas}
                    onClick={() => actualizarLinea(indice, { color })}>{TRAZO[color].nombre}</Boton>)}
                </div>
              ) : null}
            </Tarjeta>
          ))}
          {cantidadDeCaminos > 0 ? (
            <Tarjeta className="space-y-2">
              <h3 className="text-lg font-semibold text-texto">Actividades de los Caminos nuevos</h3>
              <p className="text-base text-texto-suave">Elegí al menos una. Después podés cambiarlas en cada Camino.</p>
              <div className="flex flex-wrap gap-2">
                {ACTIVIDADES.map((opcion) => <Boton key={opcion.tipo} variante={actividades.includes(opcion.tipo) ? "principal" : "secundario"}
                  aria-pressed={actividades.includes(opcion.tipo)} disabled={guardando || guardadas.size > 0}
                  onClick={() => setActividades((actuales) => actuales.includes(opcion.tipo)
                    ? actuales.filter((valor) => valor !== opcion.tipo) : [...actuales, opcion.tipo])}>{opcion.etiqueta}</Boton>)}
              </div>
            </Tarjeta>
          ) : null}
          {datos.puntos.length > 0 ? <h3 className="text-lg font-bold text-texto">Puntos</h3> : null}
          {datos.puntos.map((punto, indice) => (
            <Tarjeta key={`punto-${punto.orden}`} className="space-y-2">
              <p className="text-base font-semibold text-texto">{punto.nombreSugerido}</p>
              <Boton variante="secundario" onClick={() => setElementoEnVista({ tipo: "punto", indice })}>Ver en el mapa</Boton>
              <div className="flex flex-wrap gap-2">
                {(["sumar", "omitir"] as const).map((destino) => <Boton key={destino} variante={puntos[indice]?.destino === destino ? "principal" : "secundario"}
                  aria-pressed={puntos[indice]?.destino === destino} disabled={guardando || anotacionesGuardadas}
                  onClick={() => actualizarPunto(indice, { destino })}>{destino === "sumar" ? "Sumar punto" : "Omitir"}</Boton>)}
              </div>
              {puntos[indice]?.destino === "sumar" ? <div className="flex flex-wrap gap-2" aria-label="Ícono del punto">
                {(Object.keys(COMO_SE_LLAMA) as IconoPunto[]).map((icono) => <Boton key={icono} variante={puntos[indice].icono === icono ? "principal" : "secundario"}
                  aria-pressed={puntos[indice].icono === icono} disabled={guardando || anotacionesGuardadas}
                  onClick={() => actualizarPunto(indice, { icono })}>{COMO_SE_LLAMA[icono]}</Boton>)}
              </div> : null}
            </Tarjeta>
          ))}
          <Tarjeta className="space-y-3">
            <p className="text-base text-texto">Vas a sumar {cantidadDeCaminos} Caminos, {cantidadDeTrazos} trazos y {cantidadDePuntos} puntos. Se omiten {lineas.filter((linea) => linea.destino === "omitir").length + puntos.filter((punto) => punto.destino === "omitir").length} elementos.</p>
            {pendientes > 0 ? <p className="text-base text-ambar-texto">Falta decidir qué hacer con {pendientes} elementos.</p> : null}
            {cantidadDeCaminos > 0 && actividades.length === 0 ? <p className="text-base text-ambar-texto">Elegí al menos una actividad para los Caminos.</p> : null}
            <Boton disabled={!listo || guardando || (guardadas.size === cantidadDeCaminos && anotacionesGuardadas)}
              onClick={() => void sumarAlMapa()}>{guardando ? "Sumando al mapa…" : "Sumar al mapa"}</Boton>
          </Tarjeta>
        </>
      ) : null}
    </div>
  );
}
