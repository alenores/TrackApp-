"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { abrirFoto, cerrarFoto, prepararFoto, type DestinoDeFoto } from "@/lib/fotos/preparar";

/**
 * Varias fotos para un formulario, elegidas de a muchas juntas.
 *
 * Es para los destinos donde la foto se ve como vino, como las fotos de una
 * salida: recortar treinta fotos una por una no lo hace nadie. Cada foto pasa
 * igual por el módulo de fotos —se lee una sola vez, se convierte a WebP y se
 * achica hasta entrar en el tope—, sin recorte.
 *
 * Al editar, arranca con las que ya estaban guardadas.
 */

export type FotoDeLaLista =
  | { clave: string; clase: "guardada"; url: string }
  | { clave: string; clase: "nueva"; archivo: File; vistaPrevia: string };

let contador = 0;
const nuevaClave = () => `foto-${(contador += 1)}`;

export function useVariasFotos(destino: DestinoDeFoto, maximo: number, guardadas: string[] = []) {
  const [fotos, setFotos] = useState<FotoDeLaLista[]>(() =>
    guardadas.map((url) => ({ clave: nuevaClave(), clase: "guardada" as const, url })),
  );
  const [procesando, setProcesando] = useState<{ hechas: number; total: number } | null>(null);
  const [problemas, setProblemas] = useState<string[]>([]);
  const vistasPrevias = useRef(new Set<string>());

  // Las direcciones de las vistas previas se liberan al cerrar la pantalla.
  useEffect(
    () => () => {
      for (const url of vistasPrevias.current) URL.revokeObjectURL(url);
    },
    [],
  );

  const elegir = useCallback(
    async (archivos: File[], lugarLibre: number) => {
      setProblemas([]);
      const queEntran = archivos.slice(0, Math.max(0, lugarLibre));
      const sobran = archivos.length - queEntran.length;
      const nuevos: string[] = [];
      if (sobran > 0) {
        nuevos.push(
          `Se pueden subir hasta ${maximo} fotos: ${sobran === 1 ? "una quedó afuera" : `${sobran} quedaron afuera`}.`,
        );
      }

      setProcesando({ hechas: 0, total: queEntran.length });
      for (const [indice, archivo] of queEntran.entries()) {
        let abierta = null;
        try {
          abierta = await abrirFoto(archivo);
          const lista = await prepararFoto(abierta, destino);
          const vistaPrevia = URL.createObjectURL(lista);
          vistasPrevias.current.add(vistaPrevia);
          setFotos((actuales) => [
            ...actuales,
            { clave: nuevaClave(), clase: "nueva", archivo: lista, vistaPrevia },
          ]);
        } catch (causa) {
          nuevos.push(`«${archivo.name}»: ${causa instanceof Error ? causa.message : String(causa)}`);
        } finally {
          cerrarFoto(abierta);
          setProcesando({ hechas: indice + 1, total: queEntran.length });
        }
      }
      setProcesando(null);
      setProblemas(nuevos);
    },
    [destino, maximo],
  );

  const quitar = useCallback((clave: string) => {
    setFotos((actuales) => {
      const quitada = actuales.find((foto) => foto.clave === clave);
      if (quitada?.clase === "nueva") {
        URL.revokeObjectURL(quitada.vistaPrevia);
        vistasPrevias.current.delete(quitada.vistaPrevia);
      }
      return actuales.filter((foto) => foto.clave !== clave);
    });
  }, []);

  return { fotos, elegir, quitar, procesando, problemas };
}
