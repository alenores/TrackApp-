"use client";

import { useCallback, useMemo, useState } from "react";
import { FORMAS_DE_RECORTE } from "@/components/fotos/recorte-de-foto";
import { useFoto, type FotoDeFormulario } from "@/hooks/use-foto";
import type { Gps } from "@/hooks/use-gps";
import {
  claveDelColor,
  COLOR_DE_TRAZO_POR_DEFECTO,
  type ColorDeTrazo,
  TRAZO,
} from "@/lib/anotaciones/colores-de-trazo";
import type { AnotacionEnPantalla } from "@/lib/anotaciones/en-pantalla";
import {
  anotarUnaMarcaNueva,
  anotarUnCambio,
  type DatosDeLaMarca,
} from "@/lib/anotaciones/pendientes";
import type { Anotacion, IconoPunto } from "@/types/database";

/**
 * Marcar una anotación desde el cerro: un punto o un trazo, con comentario y
 * foto. **Todo queda en el celular** y sube solo cuando hay señal.
 *
 * **Manda el punto del GPS.** Un punto se guarda donde estás; solo si el GPS
 * no anda, o no da novedades, se marca a mano tocando el mapa. Y lo que se
 * guarda es la posición del GPS **al guardar**, no la de cuando se abrió.
 */

/** Con menos que esto no hay línea: lo exige también la base. */
export const PUNTOS_MINIMOS_DE_UN_TRAZO = 2;

export type TipoDeMarca = "punto" | "trazo";

type Borrador = {
  tipo: TipoDeMarca;
  /** La anotación que se está cambiando, o `null` si es nueva. */
  cambiando: AnotacionEnPantalla | null;
  icono: IconoPunto;
  color: ColorDeTrazo;
  comentario: string;
  /**
   * Un punto: de dónde sale el lugar. Con `gps`, de tu posición; si el GPS no
   * sirve, pasa solo a marcarse a mano.
   */
  modo: "gps" | "a_mano";
  /** Un punto: el lugar marcado a mano, o el que ya tenía al cambiarlo. */
  aMano: [number, number] | null;
  /** Un trazo: los toques en el mapa, en orden. */
  puntos: [number, number][];
  quitarLaFoto: boolean;
};

export type Marcado = {
  abierto: boolean;
  borrador: Borrador | null;
  foto: FotoDeFormulario;
  guardando: boolean;
  error: string | null;
  /** ¿El GPS sirve para marcar un punto ahora? */
  gpsSirve: boolean;
  /** `true` mientras un toque en el mapa marca un lugar. */
  marcandoEnElMapa: boolean;
  /** Dónde queda el punto ahora mismo, para mostrarlo. */
  lugarDelPunto: [number, number] | null;
  /** Lo que se está marcando, para dibujarlo antes de guardarlo. */
  vistaPrevia: Anotacion | null;
  /** ¿Se escribió o marcó algo? Para confirmar antes de tirarlo. */
  hayAlgo: boolean;
  puedeGuardar: boolean;
  empezar: (tipo: TipoDeMarca) => void;
  cambiar: (anotacion: AnotacionEnPantalla) => void;
  alTocarElMapa: (lon: number, lat: number) => void;
  usarElGps: () => void;
  marcarAMano: () => void;
  sumarMiPosicion: () => void;
  deshacerElUltimoPunto: () => void;
  cambiarIcono: (icono: IconoPunto) => void;
  cambiarColor: (color: ColorDeTrazo) => void;
  cambiarComentario: (comentario: string) => void;
  quitarLaFotoActual: () => void;
  guardar: () => Promise<boolean>;
  cerrar: () => void;
};

function borradorVacio(tipo: TipoDeMarca): Borrador {
  return {
    tipo,
    cambiando: null,
    icono: "cruce",
    color: COLOR_DE_TRAZO_POR_DEFECTO,
    comentario: "",
    modo: "gps",
    aMano: null,
    puntos: [],
    quitarLaFoto: false,
  };
}

export function useMarcarAnotacion(gps: Gps): Marcado {
  const foto = useFoto("anotacion", FORMAS_DE_RECORTE.anotacion);
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gpsSirve = gps.estado === "andando" && gps.posicion !== null && !gps.posicionVieja;
  const posicionDelGps = gps.posicion;

  const usaElGps = borrador?.tipo === "punto" && borrador.modo === "gps" && gpsSirve;

  const lugarDelPunto = useMemo((): [number, number] | null => {
    if (borrador?.tipo !== "punto") return null;
    return usaElGps && posicionDelGps
      ? [posicionDelGps.lon, posicionDelGps.lat]
      : borrador.aMano;
  }, [borrador, usaElGps, posicionDelGps]);

  // Sin GPS que sirva, el punto se marca a mano: el toque en el mapa queda
  // prendido solo, no hay que buscar un botón.
  const marcandoEnElMapa = borrador !== null && (borrador.tipo === "trazo" || !usaElGps);

  const cerrar = useCallback(() => {
    setBorrador(null);
    setError(null);
    foto.quitar();
  }, [foto]);

  const empezar = useCallback(
    (tipo: TipoDeMarca) => {
      foto.quitar();
      setError(null);
      setBorrador(borradorVacio(tipo));
    },
    [foto],
  );

  const cambiar = useCallback(
    (anotacion: AnotacionEnPantalla) => {
      foto.quitar();
      setError(null);
      const base = borradorVacio(anotacion.tipo);
      setBorrador({
        ...base,
        cambiando: anotacion,
        icono: anotacion.icono ?? "cruce",
        color: claveDelColor(anotacion.color),
        comentario: anotacion.comentario ?? "",
        // Al cambiarla, el punto se queda donde estaba hasta que digas otra cosa.
        modo: "a_mano",
        aMano:
          anotacion.geometria.type === "Point"
            ? [anotacion.geometria.coordinates[0], anotacion.geometria.coordinates[1]]
            : null,
        puntos:
          anotacion.geometria.type === "LineString"
            ? anotacion.geometria.coordinates.map(([lon, lat]) => [lon, lat] as [number, number])
            : [],
      });
    },
    [foto],
  );

  const alTocarElMapa = useCallback((lon: number, lat: number) => {
    setBorrador((actual) => {
      if (!actual) return actual;
      if (actual.tipo === "trazo") return { ...actual, puntos: [...actual.puntos, [lon, lat]] };
      return { ...actual, modo: "a_mano", aMano: [lon, lat] };
    });
  }, []);

  const usarElGps = useCallback(() => {
    setBorrador((actual) => (actual ? { ...actual, modo: "gps" } : actual));
  }, []);

  const marcarAMano = useCallback(() => {
    // Arranca donde está ahora el punto; el próximo toque en el mapa lo mueve.
    setBorrador((actual) =>
      actual
        ? {
            ...actual,
            modo: "a_mano",
            aMano:
              actual.aMano ??
              (posicionDelGps ? [posicionDelGps.lon, posicionDelGps.lat] : null),
          }
        : actual,
    );
  }, [posicionDelGps]);

  const sumarMiPosicion = useCallback(() => {
    if (!posicionDelGps) return;
    setBorrador((actual) =>
      actual && actual.tipo === "trazo"
        ? { ...actual, puntos: [...actual.puntos, [posicionDelGps.lon, posicionDelGps.lat]] }
        : actual,
    );
  }, [posicionDelGps]);

  const deshacerElUltimoPunto = useCallback(() => {
    setBorrador((actual) =>
      actual && actual.tipo === "trazo" ? { ...actual, puntos: actual.puntos.slice(0, -1) } : actual,
    );
  }, []);

  const cambiarIcono = useCallback((icono: IconoPunto) => {
    setBorrador((actual) => (actual ? { ...actual, icono } : actual));
  }, []);
  const cambiarColor = useCallback((color: ColorDeTrazo) => {
    setBorrador((actual) => (actual ? { ...actual, color } : actual));
  }, []);
  const cambiarComentario = useCallback((comentario: string) => {
    setBorrador((actual) => (actual ? { ...actual, comentario } : actual));
  }, []);
  const quitarLaFotoActual = useCallback(() => {
    setBorrador((actual) => (actual ? { ...actual, quitarLaFoto: true } : actual));
  }, []);

  const fotoOcupada = foto.estado === "abriendo" || foto.estado === "preparando" || foto.estado === "recortando";
  const lugarValido =
    borrador?.tipo === "punto"
      ? lugarDelPunto !== null
      : (borrador?.puntos.length ?? 0) >= PUNTOS_MINIMOS_DE_UN_TRAZO;
  const puedeGuardar = borrador !== null && lugarValido && !fotoOcupada && !guardando;

  const hayAlgo =
    borrador !== null &&
    (borrador.comentario.trim() !== "" ||
      borrador.puntos.length > 0 ||
      foto.archivo !== null ||
      (borrador.cambiando === null && borrador.modo === "a_mano" && borrador.aMano !== null));

  const guardar = useCallback(async (): Promise<boolean> => {
    if (!borrador) return false;

    // Lo que se guarda es la posición del GPS de este momento.
    const punto = lugarDelPunto;

    if (borrador.tipo === "punto" && !punto) {
      setError("Todavía no hay lugar para el punto: tocá el mapa donde está, o esperá a que el GPS te ubique.");
      return false;
    }
    if (borrador.tipo === "trazo" && borrador.puntos.length < PUNTOS_MINIMOS_DE_UN_TRAZO) {
      setError("Un trazo necesita al menos dos puntos: tocá el mapa por donde va.");
      return false;
    }
    if (foto.archivo && !foto.archivoChico) {
      setError("La foto no terminó de prepararse. Elegila de nuevo.");
      return false;
    }

    const usoElGps = usaElGps;
    const datos: DatosDeLaMarca = {
      tipo: borrador.tipo,
      icono: borrador.tipo === "punto" ? borrador.icono : null,
      color: borrador.tipo === "trazo" ? TRAZO[borrador.color].color : null,
      comentario: borrador.comentario.trim() || null,
      geometria:
        borrador.tipo === "punto"
          ? { type: "Point", coordinates: punto as [number, number] }
          : { type: "LineString", coordinates: borrador.puntos },
      precisionGpsMetros: usoElGps ? gps.precision : null,
    };
    const fotos =
      foto.archivo && foto.archivoChico
        ? { grande: foto.archivo, chica: foto.archivoChico }
        : null;

    setGuardando(true);
    setError(null);
    try {
      if (borrador.cambiando) {
        await anotarUnCambio(
          {
            anotacionId: borrador.cambiando.id > 0 ? borrador.cambiando.id : null,
            codigoDeLaMarca: borrador.cambiando.codigoDeLaMarca,
          },
          datos,
          fotos,
          borrador.quitarLaFoto,
        );
      } else {
        await anotarUnaMarcaNueva(datos, fotos);
      }
      cerrar();
      return true;
    } catch (causa) {
      setError(
        `No se pudo guardar en el celular: ${
          causa instanceof Error && causa.message ? causa.message : "el navegador no dejó"
        }. Probá de nuevo; si sigue, puede que no haya más espacio.`,
      );
      return false;
    } finally {
      setGuardando(false);
    }
  }, [borrador, lugarDelPunto, usaElGps, gps.precision, foto.archivo, foto.archivoChico, cerrar]);

  const vistaPrevia = useMemo((): Anotacion | null => {
    if (!borrador) return null;
    const base = {
      id: -1,
      sectorId: null,
      perfilId: "",
      deAdministrador: false,
      origen: "navegacion" as const,
      comentario: borrador.comentario,
      fotoUrl: null,
      fotoChicaUrl: null,
      marcadaEn: "",
      precisionGpsMetros: null,
      creadoEn: "",
      actualizadoEn: "",
    };
    const color = TRAZO[borrador.color].color;

    if (borrador.tipo === "punto") {
      return lugarDelPunto
        ? { ...base, tipo: "punto", icono: borrador.icono, color: null, geometria: { type: "Point", coordinates: lugarDelPunto } }
        : null;
    }
    if (borrador.puntos.length === 0) return null;
    // Con un solo toque todavía no hay línea: se muestra dónde arrancó.
    if (borrador.puntos.length === 1) {
      return { ...base, tipo: "punto", icono: null, color, geometria: { type: "Point", coordinates: borrador.puntos[0] } };
    }
    return { ...base, tipo: "trazo", icono: null, color, geometria: { type: "LineString", coordinates: borrador.puntos } };
  }, [borrador, lugarDelPunto]);

  return {
    abierto: borrador !== null,
    borrador,
    foto,
    guardando,
    error,
    gpsSirve,
    marcandoEnElMapa,
    lugarDelPunto,
    vistaPrevia,
    hayAlgo,
    puedeGuardar,
    empezar,
    cambiar,
    alTocarElMapa,
    usarElGps,
    marcarAMano,
    sumarMiPosicion,
    deshacerElUltimoPunto,
    cambiarIcono,
    cambiarColor,
    cambiarComentario,
    quitarLaFotoActual,
    guardar,
    cerrar,
  };
}
