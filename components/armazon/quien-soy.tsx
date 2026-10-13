"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CategoriaUsuario } from "@/types/database";

/**
 * Quién usa la app y qué tipo de usuario es, **averiguado una sola vez, al
 * abrir**.
 *
 * Lo averigua el armazón al abrir la app (con señal, al servidor; sin señal,
 * llega con la pantalla guardada en el celular) y las pantallas lo leen de acá.
 * Ninguna pantalla se lo vuelve a preguntar al servidor: si lo hiciera, cada
 * cambio de pantalla saldría a internet. Decisión de Ale del 2026-10-13. Si a
 * alguien le cambian el tipo de usuario con la app abierta, lo ve la próxima
 * vez que la abra.
 */

export type QuienSoy = {
  miPerfilId: string;
  miCategoria: CategoriaUsuario;
};

const ContextoDeQuienSoy = createContext<QuienSoy | null>(null);

export function ProveedorDeQuienSoy({ quienSoy, children }: { quienSoy: QuienSoy; children: ReactNode }) {
  return <ContextoDeQuienSoy.Provider value={quienSoy}>{children}</ContextoDeQuienSoy.Provider>;
}

export function useQuienSoy(): QuienSoy {
  const quienSoy = useContext(ContextoDeQuienSoy);
  if (!quienSoy) throw new Error("useQuienSoy tiene que usarse adentro del armazón de la app.");
  return quienSoy;
}
