"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  abrirFoto,
  cerrarFoto,
  prepararFoto,
  type DestinoDeFoto,
  type FotoAbierta,
  type Recorte,
} from "@/lib/fotos/preparar";
import type { FormaDeRecorte } from "@/components/fotos/recorte-de-foto";

/**
 * Una foto para un formulario. **Es la única forma de elegir una foto en la app.**
 *
 * Hace todo en el momento en que se elige la foto, no al guardar:
 *
 *   1. La lee del celular **una sola vez**.
 *   2. Abre la pantalla de recorte.
 *   3. La convierte a WebP, al tamaño del destino y por debajo del tope.
 *   4. Guarda el resultado y lo muestra: **la vista previa es exactamente lo
 *      que se va a subir**, no una aproximación.
 *
 * Si algo falla, falla acá y ahora, con el motivo. El formulario no atrapa
 * nada: guarda con `archivo` cuando hay uno, y mientras no lo hay el botón
 * queda trabado.
 *
 * Va de la mano de `SelectorDeFoto`, que es la parte que se ve.
 */

export type EstadoDeLaFoto =
  | "vacio"
  | "abriendo"
  | "recortando"
  | "preparando"
  | "lista"
  | "error";

export type FotoDeFormulario = {
  destino: DestinoDeFoto;
  estado: EstadoDeLaFoto;
  /** Qué está pasando mientras tarda. Solo mientras se abre. */
  progreso: string | null;
  /** El motivo, con palabras. Solo cuando falló. */
  error: string | null;
  /** El WebP listo para subir. Solo cuando está lista. */
  archivo: File | null;
  /** Dirección de ese archivo, para mostrarlo. Solo cuando está lista. */
  vistaPrevia: string | null;
  /** La foto tal como vino, para volver a recortarla. */
  abierta: FotoAbierta | null;
  forma: FormaDeRecorte;
  elegir: (archivo: File) => void;
  /** Vuelve a abrir el recorte sobre la misma foto, sin releerla del celular. */
  recortarDeNuevo: () => void;
  confirmarRecorte: (recorte: Recorte) => void;
  cancelarRecorte: () => void;
  quitar: () => void;
};

export function useFoto(
  destino: DestinoDeFoto,
  forma: FormaDeRecorte,
): FotoDeFormulario {
  const [estado, setEstado] = useState<EstadoDeLaFoto>("vacio");
  const [progreso, setProgreso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<FotoAbierta | null>(null);

  // Las direcciones se liberan desde acá, así quitar la foto y cerrar la
  // pantalla hacen exactamente lo mismo y no queda memoria colgada.
  const abiertaRef = useRef<FotoAbierta | null>(null);
  const vistaPreviaRef = useRef<string | null>(null);
  /** Si eligió otra foto mientras la anterior se abría, la anterior se descarta. */
  const turnoRef = useRef(0);

  const liberarVistaPrevia = useCallback(() => {
    if (vistaPreviaRef.current) URL.revokeObjectURL(vistaPreviaRef.current);
    vistaPreviaRef.current = null;
    setVistaPrevia(null);
    setArchivo(null);
  }, []);

  const liberarAbierta = useCallback(() => {
    cerrarFoto(abiertaRef.current);
    abiertaRef.current = null;
    setAbierta(null);
  }, []);

  useEffect(
    () => () => {
      cerrarFoto(abiertaRef.current);
      if (vistaPreviaRef.current) URL.revokeObjectURL(vistaPreviaRef.current);
    },
    [],
  );

  const fallar = useCallback((causa: unknown) => {
    setError(causa instanceof Error ? causa.message : String(causa));
    setEstado("error");
  }, []);

  const elegir = useCallback(
    (nuevo: File) => {
      const turno = (turnoRef.current += 1);

      liberarVistaPrevia();
      liberarAbierta();
      setError(null);
      setProgreso(null);
      setEstado("abriendo");

      abrirFoto(nuevo, (texto) => {
        if (turno === turnoRef.current) setProgreso(texto);
      })
        .then((foto) => {
          if (turno !== turnoRef.current) {
            cerrarFoto(foto);
            return;
          }
          abiertaRef.current = foto;
          setAbierta(foto);
          setProgreso(null);
          setEstado("recortando");
        })
        .catch((causa) => {
          if (turno !== turnoRef.current) return;
          setProgreso(null);
          fallar(causa);
        });
    },
    [fallar, liberarAbierta, liberarVistaPrevia],
  );

  const quitar = useCallback(() => {
    turnoRef.current += 1;
    liberarVistaPrevia();
    liberarAbierta();
    setError(null);
    setEstado("vacio");
  }, [liberarAbierta, liberarVistaPrevia]);

  const recortarDeNuevo = useCallback(() => {
    if (!abiertaRef.current) return;
    setError(null);
    setEstado("recortando");
  }, []);

  const cancelarRecorte = useCallback(() => {
    // Si ya había una foto lista, cancelar vuelve a ella. Si no, se descarta.
    if (vistaPreviaRef.current) {
      setEstado("lista");
      return;
    }
    quitar();
  }, [quitar]);

  const confirmarRecorte = useCallback(
    (recorte: Recorte) => {
      const foto = abiertaRef.current;
      if (!foto) return;

      const turno = turnoRef.current;
      setEstado("preparando");

      prepararFoto(foto, destino, recorte)
        .then((listo) => {
          if (turno !== turnoRef.current) return;

          if (vistaPreviaRef.current) URL.revokeObjectURL(vistaPreviaRef.current);
          const url = URL.createObjectURL(listo);
          vistaPreviaRef.current = url;

          setVistaPrevia(url);
          setArchivo(listo);
          setError(null);
          setEstado("lista");
        })
        .catch((causa) => {
          if (turno !== turnoRef.current) return;
          fallar(causa);
        });
    },
    [destino, fallar],
  );

  return {
    destino,
    estado,
    progreso,
    error,
    archivo,
    vistaPrevia,
    abierta,
    forma,
    elegir,
    recortarDeNuevo,
    confirmarRecorte,
    cancelarRecorte,
    quitar,
  };
}
