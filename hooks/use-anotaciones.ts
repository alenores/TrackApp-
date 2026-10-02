"use client";

import { useMemo, useRef, useState } from "react";
import type { LineString, Point } from "geojson";
import { borrarAnotacion, crearAnotacion, editarAnotacion } from "@/app/actions/territorio";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { useFoto } from "@/hooks/use-foto";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { FORMAS_DE_RECORTE } from "@/components/fotos/recorte-de-foto";
import {
  claveDelColor,
  COLOR_DE_TRAZO_POR_DEFECTO,
  type ColorDeTrazo,
  TRAZO,
} from "@/lib/anotaciones/colores-de-trazo";
import { anotacionesDelLugar, anotacionesParaMapaDelLugar } from "@/lib/anotaciones/lugar";
import { leerCoordenada } from "@/lib/coordenadas";
import { ponerAlDiaDespuesDeGuardar } from "@/lib/offline/puesta-al-dia";
import type { Anotacion, IconoPunto, Rectangulo, Sector } from "@/types/database";

/**
 * Marcar, editar y borrar anotaciones. **Es la única forma de hacerlo** desde
 * una pantalla con conexión: la usan Mapas (toda Córdoba) y el sector.
 *
 * Datos y guardado viven acá; las pantallas solo dibujan.
 *
 * Un punto se ubica de dos formas que terminan en lo mismo: tocando el mapa o
 * pegando la coordenada de Google Earth. Tocar el mapa escribe la coordenada,
 * así hay un solo dato y no dos que puedan contradecirse.
 *
 * Un trazo se dibuja de a toques, un punto por toque, con «deshacer».
 */

/** Dónde se anota: Córdoba entera o un sector. */
export type LugarDeAnotaciones = { clase: "cordoba" } | { clase: "sector"; sector: Sector };

/** Lo que se está armando en el formulario. `null` es formulario cerrado. */
export type Borrador =
  | { tipo: "punto"; icono: IconoPunto }
  | { tipo: "trazo"; color: ColorDeTrazo; puntos: [number, number][] };

/** Con menos que esto no hay línea: lo exige también la base. */
export const PUNTOS_MINIMOS_DE_UN_TRAZO = 2;

/** Un poco de terreno alrededor del punto, para ver dónde cae. */
const MARGEN_DEL_ENFOQUE = 0.005;

function enfoqueDe(lat: number, lon: number): Rectangulo {
  return {
    latNorte: Math.min(90, lat + MARGEN_DEL_ENFOQUE),
    latSur: Math.max(-90, lat - MARGEN_DEL_ENFOQUE),
    lonEste: Math.min(180, lon + MARGEN_DEL_ENFOQUE),
    lonOeste: Math.max(-180, lon - MARGEN_DEL_ENFOQUE),
  };
}

export function useAnotaciones(lugar: LugarDeAnotaciones) {
  const { paquete, estado, aviso } = useDatosDeLaApp();
  const haySenal = useHaySenal();
  const foto = useFoto("anotacion", FORMAS_DE_RECORTE.anotacion);

  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [seleccionado, setSeleccionado] = useState<Anotacion | null>(null);
  const [coordenada, setCoordenadaEscrita] = useState("");
  const [comentario, setComentario] = useState("");
  const [quitarLaFoto, setQuitarLaFoto] = useState(false);
  const [marcando, setMarcando] = useState(false);
  const [enfoque, setEnfoque] = useState<Rectangulo | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  // Traba inmediata: dos toques no deben crear dos anotaciones.
  const ocupado = useRef(false);

  const sector = lugar.clase === "sector" ? lugar.sector : null;
  const todas = useMemo(() => paquete?.anotaciones ?? [], [paquete]);

  // En el sector: las anotadas a él y las que caen adentro. Manda dónde está,
  // no a qué sector se la anotó. En Córdoba: todas.
  const anotaciones = useMemo(
    () => (sector ? anotacionesDelLugar(todas, [sector]) : todas),
    [todas, sector],
  );
  const delMapa = useMemo(
    () => (sector ? anotacionesParaMapaDelLugar(todas, [sector]) : todas),
    [todas, sector],
  );

  const lectura = useMemo(() => leerCoordenada(coordenada), [coordenada]);

  const geometria: Point | LineString | null =
    borrador?.tipo === "punto"
      ? lectura.clase === "leida"
        ? { type: "Point", coordinates: [lectura.lon, lectura.lat] }
        : null
      : borrador?.tipo === "trazo" && borrador.puntos.length >= PUNTOS_MINIMOS_DE_UN_TRAZO
        ? { type: "LineString", coordinates: borrador.puntos }
        : null;

  const fotoLista = foto.estado === "vacio" || foto.estado === "lista";
  const puedeGuardar = borrador !== null && geometria !== null && fotoLista && haySenal;

  /** Lo que se está armando, dibujado en el mapa antes de guardarlo. */
  const previa: Anotacion | null = (() => {
    if (!borrador) return null;
    const base = {
      id: seleccionado?.id ?? -1,
      sectorId: seleccionado?.sectorId ?? sector?.id ?? null,
      perfilId: seleccionado?.perfilId ?? "",
      deAdministrador: seleccionado?.deAdministrador ?? false,
      origen: seleccionado?.origen ?? ("manual" as const),
      comentario,
      fotoUrl: seleccionado?.fotoUrl ?? null,
      fotoChicaUrl: seleccionado?.fotoChicaUrl ?? null,
      marcadaEn: seleccionado?.marcadaEn ?? "",
      precisionGpsMetros: seleccionado?.precisionGpsMetros ?? null,
      creadoEn: seleccionado?.creadoEn ?? "",
      actualizadoEn: seleccionado?.actualizadoEn ?? "",
    };
    if (borrador.tipo === "punto") {
      if (!geometria) return null;
      return { ...base, tipo: "punto", icono: borrador.icono, color: null, geometria };
    }
    if (borrador.puntos.length === 0) return null;
    const color = TRAZO[borrador.color].color;
    // Un trazo con un solo toque todavía no es una línea: se ve dónde arrancó.
    if (borrador.puntos.length === 1) {
      return {
        ...base,
        tipo: "punto",
        icono: null,
        color,
        geometria: { type: "Point", coordinates: borrador.puntos[0] },
      };
    }
    return {
      ...base,
      tipo: "trazo",
      icono: null,
      color,
      geometria: { type: "LineString", coordinates: borrador.puntos },
    };
  })();

  const enElMapa = previa
    ? [...delMapa.filter((cada) => cada.id !== seleccionado?.id), previa]
    : delMapa;

  function limpiar() {
    setBorrador(null);
    setSeleccionado(null);
    setCoordenadaEscrita("");
    setComentario("");
    setQuitarLaFoto(false);
    setMarcando(false);
    setEnfoque(null);
    setError(null);
    foto.quitar();
  }

  function empezarUnPunto() {
    if (ocupado.current) return;
    limpiar();
    setMensaje(null);
    setBorrador({ tipo: "punto", icono: "cruce" });
    setMarcando(true);
  }

  function empezarUnTrazo() {
    if (ocupado.current) return;
    limpiar();
    setMensaje(null);
    setBorrador({ tipo: "trazo", color: COLOR_DE_TRAZO_POR_DEFECTO, puntos: [] });
    setMarcando(true);
  }

  /** Abre una anotación que ya existe, tocada en el mapa o en la lista. */
  function abrir(id: number) {
    if (ocupado.current) return;
    const anotacion = todas.find((cada) => cada.id === id);
    if (!anotacion) return;
    limpiar();
    setMensaje(null);
    setSeleccionado(anotacion);
    setComentario(anotacion.comentario ?? "");
    if (anotacion.geometria.type === "Point") {
      const [lon, lat] = anotacion.geometria.coordinates;
      setBorrador({ tipo: "punto", icono: anotacion.icono ?? "cruce" });
      setCoordenadaEscrita(`${lat}, ${lon}`);
      setEnfoque(enfoqueDe(lat, lon));
    } else {
      setBorrador({
        tipo: "trazo",
        color: claveDelColor(anotacion.color),
        puntos: anotacion.geometria.coordinates.map(([lon, lat]) => [lon, lat] as [number, number]),
      });
    }
  }

  function cerrar() {
    if (ocupado.current) return;
    limpiar();
  }

  /** La coordenada pegada o escrita a mano. El mapa va a mirar ese lugar. */
  function setCoordenada(texto: string) {
    setCoordenadaEscrita(texto);
    const leida = leerCoordenada(texto);
    if (leida.clase === "leida") setEnfoque(enfoqueDe(leida.lat, leida.lon));
  }

  /** Un toque en el mapa mientras se marca. */
  function alTocarElMapa(lon: number, lat: number) {
    if (!borrador || !marcando) return;
    if (borrador.tipo === "trazo") {
      setBorrador({ ...borrador, puntos: [...borrador.puntos, [lon, lat]] });
      return;
    }
    // El mapa no se mueve: el usuario ya está mirando donde tocó.
    setCoordenadaEscrita(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    setMarcando(false);
  }

  function setIcono(icono: IconoPunto) {
    if (borrador?.tipo === "punto") setBorrador({ ...borrador, icono });
  }

  function setColor(color: ColorDeTrazo) {
    if (borrador?.tipo === "trazo") setBorrador({ ...borrador, color });
  }

  function deshacerElUltimoPunto() {
    if (borrador?.tipo === "trazo") setBorrador({ ...borrador, puntos: borrador.puntos.slice(0, -1) });
  }

  function volverADibujar() {
    if (borrador?.tipo !== "trazo") return;
    setBorrador({ ...borrador, puntos: [] });
    setMarcando(true);
  }

  const nombre = borrador?.tipo === "trazo" ? "trazo" : "punto";
  const Nombre = nombre === "trazo" ? "Trazo" : "Punto";

  async function actualizar() {
    try {
      const resultado = await ponerAlDiaDespuesDeGuardar();
      if (resultado.clase === "fallo") {
        setError(`El cambio quedó guardado, pero el mapa no se actualizó: ${resultado.motivo}. Recargá para volver a intentarlo.`);
      } else if (resultado.clase === "sin_senal") {
        setError("El cambio quedó guardado, pero el mapa no se actualizó porque se cortó la señal. Recargá cuando vuelva.");
      }
    } catch (causa) {
      setError(`El cambio quedó guardado, pero el mapa no se actualizó: ${String(causa)}. Recargá para volver a intentarlo.`);
    }
  }

  async function guardar(): Promise<boolean> {
    if (ocupado.current || !borrador || !geometria || !haySenal) return false;
    // Se mira la foto en el momento del toque: pudo empezar a prepararse recién.
    if (foto.estado !== "vacio" && foto.estado !== "lista") return false;
    ocupado.current = true;
    setGuardando(true);
    setError(null);
    setMensaje(null);
    let creada: number | null = null;
    try {
      const datos = {
        sectorId: seleccionado?.sectorId ?? sector?.id ?? null,
        tipo: borrador.tipo,
        icono: borrador.tipo === "punto" ? borrador.icono : null,
        color: borrador.tipo === "trazo" ? TRAZO[borrador.color].color : null,
        comentario: comentario.trim() || null,
        geometria,
      };
      let id = seleccionado?.id;
      if (id === undefined) {
        // Primero se guarda la anotación. Si después falla la foto, se
        // reintenta sobre este mismo número, sin crear otra al volver a guardar.
        const resultado = await crearAnotacion(datos);
        if (!resultado.ok) {
          setError(resultado.error);
          return false;
        }
        id = resultado.datos.anotacionId;
        creada = id;
        setSeleccionado({ ...(previa as Anotacion), id });
      }
      if (seleccionado || foto.archivo) {
        const resultado = await editarAnotacion(id, {
          ...datos,
          foto: foto.archivo,
          fotoChica: foto.archivoChico,
          quitarLaFoto,
        });
        if (!resultado.ok) {
          setError(
            `${creada !== null ? `El ${nombre} quedó guardado, pero la foto no. ` : ""}${resultado.error} Podés volver a guardar para reintentar.`,
          );
          return false;
        }
      }
      const eraNuevo = !seleccionado && creada !== null;
      limpiar();
      setMensaje(eraNuevo ? `${Nombre} guardado.` : `${Nombre} actualizado.`);
      await actualizar();
      return true;
    } catch (causa) {
      setError(
        `${creada !== null ? `El ${nombre} quedó guardado, pero la foto no. ` : "No se pudo completar el guardado. "}${causa instanceof Error ? causa.message : String(causa)}. Revisá la señal y volvé a intentar.`,
      );
      return false;
    } finally {
      ocupado.current = false;
      setGuardando(false);
    }
  }

  async function borrar(): Promise<boolean> {
    if (!seleccionado || ocupado.current || !haySenal) return false;
    ocupado.current = true;
    setGuardando(true);
    setError(null);
    setMensaje(null);
    try {
      const resultado = await borrarAnotacion(seleccionado.id);
      if (!resultado.ok) {
        setError(resultado.error);
        return false;
      }
      limpiar();
      setMensaje(`${Nombre} borrado.`);
      await actualizar();
      return true;
    } catch (causa) {
      setError(
        `No se pudo borrar el ${nombre}: ${causa instanceof Error ? causa.message : String(causa)}. Revisá la señal y volvé a intentar.`,
      );
      return false;
    } finally {
      ocupado.current = false;
      setGuardando(false);
    }
  }

  return {
    estado,
    aviso,
    haySenal,
    anotaciones,
    enElMapa,
    zonas: paquete?.zonas ?? [],
    sectores: paquete?.sectores ?? [],
    borrador,
    seleccionado,
    coordenada,
    setCoordenada,
    lectura,
    comentario,
    setComentario,
    setIcono,
    setColor,
    foto,
    quitarLaFoto,
    setQuitarLaFoto,
    marcando,
    setMarcando,
    enfoque,
    guardando,
    error,
    mensaje,
    puedeGuardar,
    empezarUnPunto,
    empezarUnTrazo,
    abrir,
    cerrar,
    alTocarElMapa,
    deshacerElUltimoPunto,
    volverADibujar,
    guardar,
    borrar,
  };
}
