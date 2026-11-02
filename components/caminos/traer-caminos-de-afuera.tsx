"use client";

import { useMemo, useState } from "react";
import type { Position } from "geojson";
import { crearAnotacionesEnTanda, type DatosDeAnotacion } from "@/app/actions/territorio";
import { BorradorDeLineas, ANCHO_DEL_PASILLO_M } from "@/components/caminos/borrador-de-lineas";
import { Boton } from "@/components/ui/boton";
import { EncabezadoDeMapas } from "@/components/mapas/pantalla-de-mapas";
import { IconoDeClase } from "@/components/marcas/icono-de-clase";
import { Tarjeta } from "@/components/ui/tarjeta";
import { COMO_SE_LLAMA } from "@/lib/anotaciones/iconos";
import { iconoPorElNombre } from "@/lib/anotaciones/importar";
import { FORMATOS_DE_CAMINOS, leerArchivoDeCaminos, type LecturaDeCaminos, type PuntoLeido } from "@/lib/caminos/archivo";
import { ponerAlDiaDespuesDeGuardar } from "@/lib/offline/puesta-al-dia";
import type { IconoPunto } from "@/types/database";

/**
 * Traer de afuera: archivo KML/KMZ/GPX.
 *
 * Las líneas entran al mismo borrador que «Desde una salida» (decisión 077):
 * se comparan con Caminos existentes, se parten, se descartan y se crean de a
 * un pedazo. Además, una parte nueva puede sumarse como trazo. Los puntos se
 * eligen aparte. El archivo original no se guarda (decisión 041).
 */

type DestinoDePunto = "sumar" | "omitir" | null;
type EleccionDePunto = { destino: DestinoDePunto; icono: IconoPunto };

type ArchivoListo = {
  nombre: string;
  lineas: Position[][];
  puntos: PuntoLeido[];
  omitidos: Extract<LecturaDeCaminos, { ok: true }>["omitidos"];
};

export function TraerCaminosDeAfuera({ alVolver }: { alVolver: () => void }) {
  const [leyendo, setLeyendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [archivo, setArchivo] = useState<ArchivoListo | null>(null);

  const elegirArchivo = async (elegido: File | undefined) => {
    if (!elegido) return;
    setLeyendo(true);
    setAviso(null);
    setArchivo(null);
    try {
      const resultado = await leerArchivoDeCaminos(elegido);
      if (!resultado.ok) {
        setAviso(resultado.error);
        return;
      }
      const lineas = resultado.lineas.map((linea) => linea.coordenadas).filter((cada) => cada.length >= 2);
      if (lineas.length + resultado.puntos.length === 0) {
        setAviso("No hay líneas ni puntos que se puedan sumar. Elegí otro archivo.");
        return;
      }
      setArchivo({
        nombre: elegido.name,
        lineas,
        puntos: resultado.puntos,
        omitidos: resultado.omitidos,
      });
    } catch (causa) {
      setAviso(`No se pudo abrir el archivo: ${causa instanceof Error ? causa.message : String(causa)}. Probá elegirlo de nuevo.`);
    } finally {
      setLeyendo(false);
    }
  };

  if (archivo && archivo.lineas.length > 0) {
    return (
      <BorradorConPuntos
        archivo={archivo}
        alVolver={() => setArchivo(null)}
      />
    );
  }

  if (archivo && archivo.lineas.length === 0) {
    return (
      <SoloPuntosDelArchivo
        archivo={archivo}
        alVolver={() => setArchivo(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <EncabezadoDeMapas titulo="Marcas" subtitulo="Traer de afuera" alVolver={alVolver} />
      <p className="text-base text-texto-suave">
        Elegí un archivo de Google Earth o GPS. Las líneas se abren como borrador: vas a ver cuáles ya
        coinciden con Caminos existentes y decidir qué partes nuevas sumar. Los puntos se eligen aparte.
        El archivo original no se guarda.
      </p>
      <label className="block text-base font-medium text-texto">
        Archivo KML, KMZ o GPX
        <input className="mt-2 block w-full text-base text-texto" type="file" accept={FORMATOS_DE_CAMINOS}
          disabled={leyendo} onChange={(evento) => void elegirArchivo(evento.currentTarget.files?.[0])} />
      </label>
      {leyendo ? <p role="status" className="text-base text-texto">Leyendo el archivo…</p> : null}
      {aviso ? <Tarjeta franja="ambar"><p role="alert" className="text-base text-texto">{aviso}</p></Tarjeta> : null}
    </div>
  );
}

function BorradorConPuntos({
  archivo,
  alVolver,
}: {
  archivo: ArchivoListo;
  alVolver: () => void;
}) {
  return (
    <BorradorDeLineas
      subtitulo={archivo.nombre}
      textoDeCarga="Comparando con los Caminos que ya existen…"
      textoDeAyuda={`La línea gruesa es el archivo, como borrador (va por encima). En verde, las partes que van sobre un Camino que ya existe (a menos de ${ANCHO_DEL_PASILLO_M} m); en el color de las salidas, las que no coinciden con ninguno. Los Caminos existentes se ven debajo, en una línea fina gris; los puntos y trazos también, de referencia. Podés cortar, descartar, crear un Camino o sumar un trazo, de a un pedazo. Es una propuesta: revisala.`}
      textoEmpezarDeNuevo="Si te perdiste entre cortes y correcciones, podés volver a empezar con las líneas del archivo como vinieron."
      tituloEmpezarDeNuevo="¿Volver al archivo como vino?"
      mensajeEmpezarDeNuevo="Se pierden los cortes, las correcciones y lo que estás creando. Lo ya guardado queda."
      botonEmpezarDeNuevo="Volver al archivo original"
      descripcionDelCamino={`Traído de afuera · ${archivo.nombre}`}
      lineas={archivo.lineas}
      alVolver={alVolver}
      consultaGoogle
      permitirTrazo
      condicionInicial="por_explorar"
      panelAlFinal={<PanelDePuntosYOmitidos archivo={archivo} />}
    />
  );
}

function SoloPuntosDelArchivo({
  archivo,
  alVolver,
}: {
  archivo: ArchivoListo;
  alVolver: () => void;
}) {
  return (
    <div className="space-y-4">
      <EncabezadoDeMapas titulo="Marcas" subtitulo={archivo.nombre} alVolver={alVolver} />
      <p className="text-base text-texto-suave">Este archivo no trae líneas: solo puntos.</p>
      <PanelDePuntosYOmitidos archivo={archivo} />
    </div>
  );
}

function PanelDePuntosYOmitidos({ archivo }: { archivo: ArchivoListo }) {
  const [puntos, setPuntos] = useState<EleccionDePunto[]>(() =>
    archivo.puntos.map((punto) => ({ destino: null, icono: iconoPorElNombre(punto.nombre) })));
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  const pendientes = puntos.filter((punto) => punto.destino === null).length;
  const aSumar = useMemo(() => puntos.filter((punto) => punto.destino === "sumar").length, [puntos]);
  const sePuede = archivo.puntos.length > 0 && pendientes === 0 && aSumar > 0 && !listo;

  const actualizar = (indice: number, cambio: Partial<EleccionDePunto>) => {
    setPuntos((actuales) => actuales.map((punto, i) => i === indice ? { ...punto, ...cambio } : punto));
  };

  const sumarPuntos = async () => {
    if (!sePuede || guardando) return;
    setGuardando(true);
    setAviso(null);
    try {
      const anotaciones: Array<Omit<DatosDeAnotacion, "sectorId" | "foto" | "fotoChica" | "quitarLaFoto">> =
        archivo.puntos.flatMap((punto, indice) => puntos[indice].destino === "sumar" ? [{
          tipo: "punto" as const,
          icono: puntos[indice].icono,
          color: null,
          titulo: punto.nombre?.trim() || "Punto",
          comentario: punto.descripcionEsHtml ? null : (punto.descripcion?.trim() || null),
          geometria: { type: "Point" as const, coordinates: punto.coordenada },
        }] : []);
      const resultado = await crearAnotacionesEnTanda(null, anotaciones, "google_earth");
      if (!resultado.ok) {
        setAviso(`Los puntos no se sumaron: ${resultado.error}`);
        return;
      }
      const puesta = await ponerAlDiaDespuesDeGuardar();
      setListo(true);
      setAviso(puesta.clase === "fallo"
        ? `Se sumaron ${aSumar} puntos, pero no aparecen todavía en este celular: ${puesta.motivo}. Volvé a poner la app al día con conexión.`
        : `Se sumaron ${aSumar} puntos al mapa.`);
    } catch (causa) {
      setAviso(`Se interrumpió el guardado: ${causa instanceof Error ? causa.message : String(causa)}. Revisá Marcas antes de volver a tocar.`);
    } finally {
      setGuardando(false);
    }
  };

  if (archivo.puntos.length === 0 && archivo.omitidos.length === 0) return null;

  return (
    <div className="space-y-4">
      {archivo.omitidos.length > 0 ? (
        <Tarjeta className="space-y-2">
          <p className="text-base font-semibold text-texto">Elementos que no se pueden usar</p>
          {archivo.omitidos.map((elemento) => (
            <p key={elemento.orden} className="text-base text-ambar-texto">
              {elemento.nombre ?? `Elemento ${elemento.orden + 1}`}: {elemento.motivo}
            </p>
          ))}
        </Tarjeta>
      ) : null}

      {archivo.puntos.length > 0 ? (
        <>
          <h3 className="flex items-center gap-2 text-lg font-bold text-texto"><IconoDeClase grupo="punto" />Puntos del archivo</h3>
          {archivo.puntos.map((punto, indice) => (
            <Tarjeta key={`punto-${punto.orden}`} className="space-y-2">
              <p className="text-base font-semibold text-texto">{punto.nombreSugerido}</p>
              <div className="flex flex-wrap gap-2">
                {(["sumar", "omitir"] as const).map((destino) => (
                  <Boton key={destino} variante={puntos[indice]?.destino === destino ? "principal" : "secundario"}
                    aria-pressed={puntos[indice]?.destino === destino} disabled={guardando || listo}
                    onClick={() => actualizar(indice, { destino })}>
                    {destino === "sumar" ? "Sumar punto" : "Omitir"}
                  </Boton>
                ))}
              </div>
              {puntos[indice]?.destino === "sumar" ? (
                <div className="flex flex-wrap gap-2" aria-label="Ícono del punto">
                  {(Object.keys(COMO_SE_LLAMA) as IconoPunto[]).map((icono) => (
                    <Boton key={icono} variante={puntos[indice].icono === icono ? "principal" : "secundario"}
                      aria-pressed={puntos[indice].icono === icono} disabled={guardando || listo}
                      onClick={() => actualizar(indice, { icono })}>{COMO_SE_LLAMA[icono]}</Boton>
                  ))}
                </div>
              ) : null}
            </Tarjeta>
          ))}
          <Tarjeta className="space-y-3">
            {pendientes > 0 ? <p className="text-base text-ambar-texto">Falta decidir qué hacer con {pendientes} puntos.</p> : null}
            {aviso ? <p role="alert" className="text-base text-texto">{aviso}</p> : null}
            <Boton disabled={!sePuede || guardando} onClick={() => void sumarPuntos()}>
              {guardando ? "Sumando puntos…" : listo ? "Puntos sumados" : `Sumar ${aSumar} puntos`}
            </Boton>
          </Tarjeta>
        </>
      ) : null}
    </div>
  );
}
