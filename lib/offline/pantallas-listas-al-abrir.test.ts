import { beforeEach, describe, expect, it, vi } from "vitest";

const estado = vi.hoisted(() => ({ conexion: true }));
vi.mock("@/lib/conexion", () => ({ hayConexion: () => estado.conexion }));

import {
  dejarListasLasPantallas,
  olvidarLasPantallasListasParaProbar,
  PANTALLAS_LISTAS_AL_ABRIR,
} from "@/lib/offline/pantallas-listas-al-abrir";

describe("pantallas listas al abrir (decisión de Ale del 2026-10-13)", () => {
  beforeEach(() => {
    olvidarLasPantallasListasParaProbar();
    estado.conexion = true;
  });

  it("Salidas y Perfiles no se piden al abrir: solo si el usuario entra", () => {
    const pedidas: string[] = [];
    dejarListasLasPantallas((direccion) => pedidas.push(direccion), "/");
    expect(pedidas.length).toBeGreaterThan(0);
    expect(pedidas.some((direccion) => direccion.startsWith("/salidas") || direccion.startsWith("/perfil"))).toBe(false);
  });

  it("se piden una sola vez por apertura", () => {
    const pedidas: string[] = [];
    dejarListasLasPantallas((direccion) => pedidas.push(direccion), "/");
    dejarListasLasPantallas((direccion) => pedidas.push(direccion), "/zonas");
    expect(pedidas).toHaveLength(PANTALLAS_LISTAS_AL_ABRIR.length);
  });

  it("sin señal que sirva no se pide nada, y se intenta cuando vuelve", () => {
    const pedidas: string[] = [];
    estado.conexion = false;
    expect(dejarListasLasPantallas((direccion) => pedidas.push(direccion), "/")).toBe(false);
    expect(pedidas).toHaveLength(0);
    estado.conexion = true;
    expect(dejarListasLasPantallas((direccion) => pedidas.push(direccion), "/")).toBe(true);
  });

  it("con la navegación abierta no sale a internet", () => {
    const pedidas: string[] = [];
    expect(dejarListasLasPantallas((direccion) => pedidas.push(direccion), "/circuitos/3/navegar")).toBe(false);
    expect(dejarListasLasPantallas((direccion) => pedidas.push(direccion), "/mapa-libre")).toBe(false);
    expect(pedidas).toHaveLength(0);
  });
});
