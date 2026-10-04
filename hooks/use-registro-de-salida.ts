"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Gps } from "@/hooks/use-gps";
import { useRegistros } from "@/hooks/use-registros";
import {
  elEnCurso,
  empezarUnRegistro,
  sumarUnPunto,
  terminarElRegistro,
} from "@/lib/salidas/registro";
import {
  hayQueAnotar,
  kilometrosRegistrados,
  type PuntoRegistrado,
} from "@/lib/salidas/registro-reglas";

/**
 * El registro de una salida, en las pantallas del cerro: navegar una ruta y la
 * navegación libre.
 *
 * **No sale a internet.** Mientras hay una salida en curso, cada posición
 * nueva del GPS que vale la pena se graba en el celular. Con «Marcar acá» se
 * suma un punto a mano.
 */

const SEGUNDOS_DEL_AVISO_DE_MARCA = 3;

function comoPunto(gps: Gps, aMano: boolean): PuntoRegistrado | null {
  if (!gps.posicion) return null;
  return {
    lon: gps.posicion.lon,
    lat: gps.posicion.lat,
    altura: gps.altura,
    momento: Date.now(),
    precision: gps.precision,
    aMano,
  };
}

export function useRegistroDeSalida(gps: Gps) {
  const registros = useRegistros();
  const enCurso = elEnCurso(registros);
  const [error, setError] = useState<string | null>(null);
  const [marcaRecien, setMarcaRecien] = useState(false);
  /** El último punto anotado, al instante: la escritura en el celular tarda. */
  const ultimoRef = useRef<PuntoRegistrado | null>(null);
  const codigoRef = useRef<string | null>(null);

  /** El último punto de la salida en curso. Si se empezó otra, arranca del suyo. */
  const ultimoDe = useCallback((registro: NonNullable<typeof enCurso>) => {
    if (codigoRef.current !== registro.codigo) {
      codigoRef.current = registro.codigo;
      ultimoRef.current = registro.puntos.at(-1) ?? null;
    }
    return ultimoRef.current;
  }, []);

  const grabar = useCallback((punto: PuntoRegistrado) => {
    ultimoRef.current = punto;
    sumarUnPunto(punto)
      .then(() => setError(null))
      .catch((causa) =>
        setError(
          `No se pudo guardar el punto en el celular: ${causa instanceof Error ? causa.message : String(causa)}`,
        ),
      );
  }, []);

  // Cada posición nueva del GPS, si vale la pena, se anota.
  const hayEnCurso = enCurso !== null;
  useEffect(() => {
    if (!enCurso || gps.estado !== "andando") return;
    const punto = comoPunto(gps, false);
    if (punto && hayQueAnotar(ultimoDe(enCurso), punto)) grabar(punto);
    // Solo cuando llega una posición nueva o empieza una salida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gps.posicion, hayEnCurso]);

  useEffect(() => {
    if (!marcaRecien) return;
    const fin = window.setTimeout(() => setMarcaRecien(false), SEGUNDOS_DEL_AVISO_DE_MARCA * 1000);
    return () => window.clearTimeout(fin);
  }, [marcaRecien]);

  const marcarAca = useCallback(() => {
    const punto = comoPunto(gps, true);
    if (!punto) {
      setError("El GPS todavía no sabe dónde estás. Esperá a que aparezca tu punto en el mapa.");
      return;
    }
    if (enCurso) ultimoDe(enCurso);
    grabar(punto);
    setMarcaRecien(true);
  }, [gps, grabar, enCurso, ultimoDe]);

  const empezar = useCallback(async (rutaId: number | null, nombreDeLaRuta: string | null) => {
    try {
      await empezarUnRegistro(rutaId, nombreDeLaRuta);
      setError(null);
    } catch (causa) {
      setError(
        `No se pudo empezar a registrar: ${causa instanceof Error ? causa.message : String(causa)}`,
      );
    }
  }, []);

  const terminar = useCallback(async () => {
    try {
      await terminarElRegistro();
      return true;
    } catch (causa) {
      setError(
        `No se pudo terminar la salida: ${causa instanceof Error ? causa.message : String(causa)}`,
      );
      return false;
    }
  }, []);

  return {
    enCurso,
    kilometros: enCurso ? kilometrosRegistrados(enCurso.puntos) : 0,
    puntos: enCurso?.puntos.length ?? 0,
    error,
    marcaRecien,
    marcarAca,
    empezar,
    terminar,
  };
}
