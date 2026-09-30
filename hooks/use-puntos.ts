"use client";

import { useMemo, useRef, useState } from "react";
import { borrarAnotacion, crearAnotacion, editarAnotacion } from "@/app/actions/territorio";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { useFoto } from "@/hooks/use-foto";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { FORMAS_DE_RECORTE } from "@/components/fotos/recorte-de-foto";
import { leerCoordenada } from "@/lib/coordenadas";
import { rectanguloQueAbarca } from "@/lib/datos/rectangulo";
import { ponerAlDiaDespuesDeGuardar } from "@/lib/offline/puesta-al-dia";
import type { Anotacion, IconoPunto } from "@/types/database";

/** Datos y guardado de los puntos; la pantalla solo presenta el formulario. */
export function usePuntos() {
  const { paquete, estado, aviso } = useDatosDeLaApp();
  const haySenal = useHaySenal();
  const foto = useFoto("anotacion", FORMAS_DE_RECORTE.anotacion);
  const [seleccionado, setSeleccionado] = useState<Anotacion | null>(null);
  const [coordenada, setCoordenada] = useState("");
  const [icono, setIcono] = useState<IconoPunto>("cruce");
  const [comentario, setComentario] = useState("");
  const [quitarLaFoto, setQuitarLaFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  // Traba inmediata: dos toques no deben crear dos puntos.
  const ocupado = useRef(false);
  const puntos = useMemo(() => (paquete?.anotaciones ?? []).filter(
    (anotacion) => anotacion.tipo === "punto" && anotacion.geometria.type === "Point",
  ), [paquete]);
  const lectura = useMemo(() => leerCoordenada(coordenada), [coordenada]);
  const encuadre = useMemo(() => {
    if (lectura.clase === "leida") {
      // Un poco de terreno alrededor permite comprobar dónde cae el punto.
      return {
        latNorte: Math.min(90, lectura.lat + 0.005),
        latSur: Math.max(-90, lectura.lat - 0.005),
        lonEste: Math.min(180, lectura.lon + 0.005),
        lonOeste: Math.max(-180, lectura.lon - 0.005),
      };
    }
    const limites = rectanguloQueAbarca(puntos.flatMap((punto) =>
      punto.geometria.type === "Point"
        ? [[punto.geometria.coordinates[0], punto.geometria.coordinates[1]] as [number, number]]
        : [],
    ));
    if (!limites) return null;
    // Un solo punto no debe llevar el mapa al máximo acercamiento.
    return {
      latNorte: Math.min(90, limites.latNorte + 0.005),
      latSur: Math.max(-90, limites.latSur - 0.005),
      lonEste: Math.min(180, limites.lonEste + 0.005),
      lonOeste: Math.max(-180, limites.lonOeste - 0.005),
    };
  }, [lectura, puntos]);
  const previa: Anotacion | null = lectura.clase === "leida" ? {
    id: seleccionado?.id ?? -1,
    sectorId: seleccionado?.sectorId ?? null,
    perfilId: seleccionado?.perfilId ?? "",
    deAdministrador: true,
    tipo: "punto",
    origen: seleccionado?.origen ?? "manual",
    icono, color: null, comentario,
    fotoUrl: seleccionado?.fotoUrl ?? null,
    fotoChicaUrl: seleccionado?.fotoChicaUrl ?? null,
    geometria: { type: "Point", coordinates: [lectura.lon, lectura.lat] },
    marcadaEn: seleccionado?.marcadaEn ?? "",
    precisionGpsMetros: seleccionado?.precisionGpsMetros ?? null,
    creadoEn: seleccionado?.creadoEn ?? "",
    actualizadoEn: seleccionado?.actualizadoEn ?? "",
  } : null;
  const enElMapa = previa
    ? [...puntos.filter((punto) => punto.id !== previa.id), previa]
    : puntos;

  function limpiar() {
    setSeleccionado(null);
    setCoordenada("");
    setIcono("cruce");
    setComentario("");
    setQuitarLaFoto(false);
    foto.quitar();
    setError(null);
  }

  function abrir(id: number) {
    if (ocupado.current) return;
    const punto = puntos.find((cada) => cada.id === id);
    if (!punto || punto.geometria.type !== "Point") return;
    limpiar();
    setMensaje(null);
    setSeleccionado(punto);
    setCoordenada(`${punto.geometria.coordinates[1]}, ${punto.geometria.coordinates[0]}`);
    setIcono(punto.icono ?? "cruce");
    setComentario(punto.comentario ?? "");
  }

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

  async function guardar() {
    if (ocupado.current || !haySenal || lectura.clase !== "leida" || !previa) return;
    if (foto.estado !== "vacio" && foto.estado !== "lista") return;
    ocupado.current = true;
    setGuardando(true);
    setError(null);
    setMensaje(null);
    let creado: number | null = null;
    try {
      const datos = {
        sectorId: seleccionado?.sectorId ?? null,
        tipo: "punto" as const, icono, color: null,
        comentario: comentario.trim() || null,
        geometria: previa.geometria,
      };
      let id = seleccionado?.id;
      if (id === undefined) {
        // Primero recordamos el punto. Si falla la foto, se reintenta sobre
        // este mismo número, sin insertar otro punto al volver a guardar.
        const resultado = await crearAnotacion(datos);
        if (!resultado.ok) { setError(resultado.error); return; }
        id = resultado.datos.anotacionId;
        creado = id;
        setSeleccionado({ ...previa, id });
      }
      if (seleccionado || foto.archivo) {
        const resultado = await editarAnotacion(id, {
          ...datos, foto: foto.archivo, fotoChica: foto.archivoChico, quitarLaFoto,
        });
        if (!resultado.ok) {
          setError(`${creado !== null ? "El punto quedó guardado, pero la foto no. " : ""}${resultado.error} Podés volver a guardar para reintentar.`);
          return;
        }
      }
      limpiar();
      setMensaje(seleccionado ? "Punto actualizado. Podés cargar el siguiente." : "Punto guardado. Podés cargar el siguiente.");
      await actualizar();
      return true;
    } catch (causa) {
      setError(`${creado !== null ? "El punto quedó guardado, pero la foto no. " : "No se pudo completar el guardado. "}${causa instanceof Error ? causa.message : String(causa)}. Revisá la señal y volvé a intentar.`);
    } finally {
      ocupado.current = false;
      setGuardando(false);
    }
  }

  async function borrar() {
    if (!seleccionado || ocupado.current || !haySenal) return;
    ocupado.current = true;
    setGuardando(true);
    setError(null);
    setMensaje(null);
    try {
      const resultado = await borrarAnotacion(seleccionado.id);
      if (!resultado.ok) { setError(resultado.error); return; }
      limpiar();
      setMensaje("Punto borrado.");
      await actualizar();
      return true;
    } catch (causa) {
      setError(`No se pudo borrar el punto: ${causa instanceof Error ? causa.message : String(causa)}. Revisá la señal y volvé a intentar.`);
    } finally {
      ocupado.current = false;
      setGuardando(false);
    }
  }

  return {
    estado, aviso, haySenal, puntos, seleccionado, coordenada, setCoordenada,
    icono, setIcono, comentario, setComentario, foto, quitarLaFoto, setQuitarLaFoto,
    guardando, error, mensaje, lectura, encuadre, enElMapa, abrir, limpiar, guardar, borrar,
  };
}
