"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { usePendientes } from "@/hooks/use-pendientes";
import {
  aplicarPendientes,
  type AnotacionEnPantalla,
} from "@/lib/anotaciones/en-pantalla";
import {
  alCambiarElFiltro,
  filtroGuardado,
  guardarElFiltro,
  pasaElFiltro,
  TODAS_LAS_ANOTACIONES,
  type FiltroDeAnotaciones,
} from "@/lib/anotaciones/filtro";
import {
  categoriaGuardada,
  miPerfilGuardado,
  mirarMiPerfil,
} from "@/lib/cuenta/mi-perfil-en-el-celular";
import type { Anotacion } from "@/types/database";

/**
 * Las anotaciones de las pantallas del cerro: navegar una ruta y el mapa libre.
 *
 * Junta lo bajado con lo que se marcó sin señal, aplica las casillas de qué
 * ver y sabe quién sos. **Todo sale del celular: nada sale a internet.**
 */

export type AnotacionesDelCerro = {
  /** Todas, con lo marcado sin señal, sin filtrar. */
  todas: AnotacionEnPantalla[];
  /** Las que pasan las casillas: las que se dibujan. */
  visibles: AnotacionEnPantalla[];
  filtro: FiltroDeAnotaciones;
  cambiarFiltro: (filtro: FiltroDeAnotaciones) => void;
  cuantas: { mias: number; delAdministrador: number; deOtros: number };
  miPerfilId: string | null;
  puedeAnotar: boolean;
  /** ¿Puedo cambiar o borrar esta? Las mías, o todas si soy administrador. */
  puedoCambiar: (anotacion: AnotacionEnPantalla) => boolean;
};

export function useAnotacionesDelCerro(delPaquete: Anotacion[]): AnotacionesDelCerro {
  const pendientes = usePendientes();
  // En el servidor no hay nada guardado: arranca con todo prendido y sin saber
  // quién sos, y apenas la pantalla está viva en el celular toma lo anotado.
  const filtro = useSyncExternalStore(
    alCambiarElFiltro,
    filtroGuardado,
    () => TODAS_LAS_ANOTACIONES,
  );
  const miId = useSyncExternalStore(mirarMiPerfil, miPerfilGuardado, () => null);
  const categoria = useSyncExternalStore(mirarMiPerfil, categoriaGuardada, () => null);
  const quienSoy = useMemo(() => ({ id: miId, categoria }), [miId, categoria]);
  const cambiarFiltro = guardarElFiltro;

  const todas = useMemo(
    () => aplicarPendientes(delPaquete, pendientes, quienSoy.id),
    [delPaquete, pendientes, quienSoy.id],
  );

  const visibles = useMemo(
    () => todas.filter((cada) => pasaElFiltro(cada, filtro, quienSoy.id)),
    [todas, filtro, quienSoy.id],
  );

  const cuantas = useMemo(() => {
    const cuenta = { mias: 0, delAdministrador: 0, deOtros: 0 };
    for (const cada of todas) {
      if (quienSoy.id !== null && cada.perfilId === quienSoy.id) cuenta.mias += 1;
      else if (cada.deAdministrador) cuenta.delAdministrador += 1;
      else cuenta.deOtros += 1;
    }
    return cuenta;
  }, [todas, quienSoy.id]);

  const puedoCambiar = useCallback(
    (anotacion: AnotacionEnPantalla) =>
      quienSoy.categoria === "administrador" ||
      (quienSoy.categoria === "premium" && (
        anotacion.codigoDeLaMarca !== null ||
        (quienSoy.id !== null && anotacion.perfilId === quienSoy.id)
      )),
    [quienSoy],
  );

  return {
    todas,
    visibles,
    filtro,
    cambiarFiltro,
    cuantas,
    miPerfilId: quienSoy.id,
    puedeAnotar: quienSoy.categoria === "administrador" || quienSoy.categoria === "premium",
    puedoCambiar,
  };
}
