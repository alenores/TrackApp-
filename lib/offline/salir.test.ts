import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const llamadas = vi.hoisted(() => ({
  bloquear: vi.fn(),
  google: vi.fn(async () => {}),
  recorridos: vi.fn(async () => {}),
}));
vi.mock("@/lib/mapas/google-guardado", () => ({
  borrarTodasLasImagenesDeGoogle: llamadas.google,
  bloquearConsultasDeGoogleAlSalir: llamadas.bloquear,
}));
vi.mock("@/lib/offline/recorridos", () => ({
  borrarTodosLosRecorridos: llamadas.recorridos,
}));
vi.mock("@/lib/anotaciones/pendientes", () => ({ borrarTodosLosPendientes: async () => {} }));
vi.mock("@/lib/cuenta/mi-perfil-en-el-celular", () => ({ olvidarMiPerfil: () => {} }));
vi.mock("@/lib/mapas/descarga", () => ({ borrarTodosLosMapasDelCelular: async () => {} }));
vi.mock("@/lib/offline/paquete", () => ({ borrarPaquete: () => {} }));
vi.mock("@/lib/offline/circuitos", () => ({ borrarCircuitosPreparadosQueSobran: async () => {} }));
vi.mock("@/lib/offline/lineas-de-caminos", () => ({ borrarLineasDeCaminosQueSobran: async () => {} }));
vi.mock("@/lib/salidas/registro", () => ({ borrarTodosLosRegistros: async () => {} }));

import { borrarLoGuardadoEnElCelular } from "@/lib/offline/salir";

beforeEach(() => {
  llamadas.bloquear.mockReset();
  llamadas.google.mockReset().mockResolvedValue(undefined);
  llamadas.recorridos.mockReset().mockResolvedValue(undefined);
});
afterEach(() => vi.restoreAllMocks());

describe("cerrar sesión con imágenes de Google en curso", () => {
  it("empieza a borrar Google antes de esperar la primera limpieza de datos", async () => {
    let seguir!: () => void;
    llamadas.recorridos.mockImplementation(() => new Promise<void>((resolver) => { seguir = resolver; }));
    const borrado = borrarLoGuardadoEnElCelular();
    expect(llamadas.bloquear).toHaveBeenCalledOnce();
    expect(llamadas.bloquear.mock.invocationCallOrder[0]).toBeLessThan(llamadas.google.mock.invocationCallOrder[0]);
    expect(llamadas.google).toHaveBeenCalledOnce();
    expect(llamadas.google.mock.invocationCallOrder[0]).toBeLessThan(llamadas.recorridos.mock.invocationCallOrder[0]);
    seguir();
    await borrado;
  });

  it("si falla el depósito Google, permite cerrar sesión y limpiar el resto", async () => {
    llamadas.google.mockRejectedValue(new Error("El navegador negó el almacenamiento."));
    await expect(borrarLoGuardadoEnElCelular()).resolves.toBeUndefined();
    expect(llamadas.recorridos).toHaveBeenCalledOnce();
  });
});
