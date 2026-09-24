"use client";

import { useSyncExternalStore } from "react";
import { SIN_FILTROS, type FiltrosDeRutas } from "@/lib/rutas/filtros";
import {
  alCambiarLosFiltros,
  filtrosGuardados,
  guardarFiltros,
} from "@/lib/rutas/filtros-guardados";

/**
 * Los filtros de la lista de rutas, recordados en el celular.
 *
 * Mientras el servidor arma la pantalla no hay nada guardado: arranca sin
 * filtros y apenas la pantalla está viva en el celular toma los anotados.
 */
export function useFiltrosDeRutas(): [FiltrosDeRutas, (filtros: FiltrosDeRutas) => void] {
  const filtros = useSyncExternalStore(
    alCambiarLosFiltros,
    filtrosGuardados,
    () => SIN_FILTROS,
  );
  return [filtros, guardarFiltros];
}
