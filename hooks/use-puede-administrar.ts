"use client";

import { useHaySenal } from "@/hooks/use-hay-senal";

/**
 * ¿Se puede administrar acá y ahora?
 *
 * Administrar —crear, editar, borrar— **escribe en la base, así que sin señal
 * no existe**. Y lo que no existe no se muestra: un botón que al tocarlo falla
 * es información basura.
 *
 * Junta las dos condiciones en un solo lugar para que ninguna pantalla se
 * olvide de una: ser el dueño de la cosa, y tener señal.
 */
export function usePuedeAdministrar(esElDueno: boolean): boolean {
  return useHaySenal() && esElDueno;
}
