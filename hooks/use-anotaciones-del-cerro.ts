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
  miPerfilGuardado,
  soyAdministradorGuardado,
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
  /** ¿Puedo cambiar o borrar esta? Las mías, o todas si soy administrador. */
  puedoCambiar: (anotacion: AnotacionEnPantalla) => boolean;
};

/** Quién sos no cambia mientras la pantalla está abierta. */
function sinCambios(): () => void {
  return () => {};
}

export function useAnotacionesDelCerro(delPaquete: Anotacion[]): AnotacionesDelCerro {
  const pendientes = usePendientes();
  // En el servidor no hay nada guardado: arranca con todo prendido y sin saber
  // quién sos, y apenas la pantalla está viva en el celular toma lo anotado.
  const filtro = useSyncExternalStore(
    alCambiarElFiltro,
    filtroGuardado,
    () => TODAS_LAS_ANOTACIONES,
  );
  const miId = useSyncExternalStore(sinCambios, miPerfilGuardado, () => null);
  const administrador = useSyncExternalStore(sinCambios, soyAdministradorGuardado, () => false);
  const quienSoy = useMemo(() => ({ id: miId, administrador }), [miId, administrador]);
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
      quienSoy.administrador ||
      anotacion.codigoDeLaMarca !== null ||
      (quienSoy.id !== null && anotacion.perfilId === quienSoy.id),
    [quienSoy],
  );

  return {
    todas,
    visibles,
    filtro,
    cambiarFiltro,
    cuantas,
    miPerfilId: quienSoy.id,
    puedoCambiar,
  };
}
