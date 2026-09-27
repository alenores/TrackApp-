// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  EVENTO_CONEXION,
  esperarConexion,
  hayConexion,
  haySenalDebil,
  olvidarLaConexionParaProbar,
  probarConexion,
} from "@/lib/conexion";

/**
 * Las pruebas del detector de señal.
 *
 * **Si esto falla, la app se cree con internet en el cerro**: muestra botones
 * que al tocarlos fallan y queda esperando respuestas que no llegan. O al
 * revés: con señal buena se queda en modo sin señal.
 */

function conRed(hay: boolean) {
  Object.defineProperty(navigator, "onLine", { value: hay, configurable: true });
}

function servidorQue(...respuestas: Array<"responde" | "no_responde">) {
  const pedir = vi.fn();
  for (const respuesta of respuestas) {
    if (respuesta === "responde") {
      pedir.mockResolvedValueOnce(new Response(null, { status: 204 }));
    } else {
      pedir.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    }
  }
  vi.stubGlobal("fetch", pedir);
  return pedir;
}

beforeEach(() => {
  olvidarLaConexionParaProbar();
  conRed(true);
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  olvidarLaConexionParaProbar();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("detector de señal", () => {
  it("mientras no se probó, responde que no hay", () => {
    expect(hayConexion()).toBe(false);
  });

  it("con el servidor respondiendo, hay señal", async () => {
    servidorQue("responde");
    expect(await probarConexion(true)).toBe(true);
    expect(hayConexion()).toBe(true);
  });

  it("una sola falla no alcanza: prueba de nuevo antes de decidir", async () => {
    const pedir = servidorQue("no_responde", "responde");
    expect(await probarConexion(true)).toBe(true);
    expect(pedir).toHaveBeenCalledTimes(2);
    expect(hayConexion()).toBe(true);
  });

  it("dos fallas seguidas con red: señal débil, igual que sin señal", async () => {
    const avisos = vi.fn();
    window.addEventListener(EVENTO_CONEXION, avisos);

    // Primero con señal buena, para ver que avisa el cambio.
    servidorQue("responde");
    await probarConexion(true);
    servidorQue("no_responde", "no_responde");
    expect(await probarConexion(true)).toBe(false);

    expect(hayConexion()).toBe(false);
    expect(haySenalDebil()).toBe(true);
    expect(avisos).toHaveBeenCalledTimes(2);
    window.removeEventListener(EVENTO_CONEXION, avisos);
  });

  it("para volver alcanza con una respuesta a tiempo", async () => {
    servidorQue("no_responde", "no_responde");
    await probarConexion(true);
    expect(haySenalDebil()).toBe(true);

    const pedir = servidorQue("responde");
    expect(await probarConexion(true)).toBe(true);
    expect(pedir).toHaveBeenCalledTimes(1);
    expect(hayConexion()).toBe(true);
  });

  it("sin red no pregunta a internet", async () => {
    conRed(false);
    const pedir = servidorQue("responde");
    expect(await probarConexion(true)).toBe(false);
    expect(await esperarConexion()).toBe(false);
    expect(pedir).not.toHaveBeenCalled();
  });

  it("con la navegación abierta no pregunta a internet, nunca", async () => {
    window.history.replaceState(null, "", "/navegacion/una-ruta");
    const pedir = servidorQue("responde");
    expect(await probarConexion(true)).toBe(false);

    window.history.replaceState(null, "", "/mapa-libre");
    expect(await esperarConexion()).toBe(false);
    expect(pedir).not.toHaveBeenCalled();
  });

  it("al abrir, esperar la conexión espera la primera prueba", async () => {
    servidorQue("responde");
    expect(await esperarConexion()).toBe(true);
  });
});
