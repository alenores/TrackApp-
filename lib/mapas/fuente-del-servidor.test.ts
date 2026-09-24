// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fuenteDelServidor } from "@/lib/mapas/fuente-del-servidor";

/**
 * Cada pedazo va al puente que le corresponde. Un pedazo de relieve pedido al
 * puente del mapa vuelve como dibujo, y las curvas salen de cualquier cosa.
 */

afterEach(() => {
  vi.unstubAllGlobals();
});

function servidorQueAnota() {
  const pedidas: string[] = [];
  vi.stubGlobal("fetch", async (direccion: string) => {
    pedidas.push(direccion);
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => new Uint8Array([1]).buffer,
    } as unknown as Response;
  });
  return pedidas;
}

describe("a qué puente va cada pedazo", () => {
  it("el dibujo va al puente del mapa", async () => {
    const pedidas = servidorQueAnota();
    await fuenteDelServidor().pedirTesela({ z: 14, x: 5, y: 6 }, new AbortController().signal);
    expect(pedidas).toEqual(["/api/mapa/14/5/6"]);
  });

  it("el relieve va al puente del relieve", async () => {
    const pedidas = servidorQueAnota();
    await fuenteDelServidor().pedirTesela(
      { z: 12, x: 5, y: 6, capa: "relieve" },
      new AbortController().signal,
    );
    expect(pedidas).toEqual(["/api/relieve/12/5/6"]);
  });

  it("la foto satelital va al puente de la foto", async () => {
    const pedidas = servidorQueAnota();
    await fuenteDelServidor().pedirTesela(
      { z: 15, x: 5, y: 6, capa: "satelital" },
      new AbortController().signal,
    );
    expect(pedidas).toEqual(["/api/satelital/15/5/6"]);
  });
});
