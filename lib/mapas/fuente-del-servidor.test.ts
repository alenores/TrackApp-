// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fuenteDelServidor } from "@/lib/mapas/fuente-del-servidor";
import { sombraGruesa } from "@/lib/offline/sombra-gruesa";

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

describe("el sombreado que llega con menos detalle (decisión 079)", () => {
  function servidorDeSombra(motivo: string | null) {
    vi.stubGlobal("fetch", async () => ({
      ok: true,
      status: 200,
      headers: new Headers(motivo ? { "x-sombra-con-menos-detalle": encodeURIComponent(motivo) } : {}),
      arrayBuffer: async () => new Uint8Array([1]).buffer,
    }) as unknown as Response);
  }
  const pedazo = { z: 14, x: 5242, y: 9699, capa: "sombra" as const };

  it("va a su puente y, si llega con menos detalle, queda anotado con el motivo con tildes", async () => {
    servidorDeSombra("el servicio de alturas de Córdoba (IDECOR) no contestó");
    const bytes = await fuenteDelServidor().pedirTesela(pedazo, new AbortController().signal);
    expect(bytes).toEqual(new Uint8Array([1]));
    expect(sombraGruesa()["sombra/14/5242/9699"]).toBe("el servicio de alturas de Córdoba (IDECOR) no contestó");
  });

  it("si después llega completo, se borra la marca", async () => {
    servidorDeSombra("el servicio de alturas de Córdoba (IDECOR) no contestó");
    await fuenteDelServidor().pedirTesela(pedazo, new AbortController().signal);
    servidorDeSombra(null);
    await fuenteDelServidor().pedirTesela(pedazo, new AbortController().signal);
    expect(sombraGruesa()["sombra/14/5242/9699"]).toBeUndefined();
  });
});

describe("el sombreado se le pide a Córdoba de a pocos", () => {
  it("nunca más de 3 a la vez, aunque se bajen varios sectores juntos", async () => {
    let enCurso = 0;
    let maximo = 0;
    vi.stubGlobal("fetch", async () => {
      enCurso += 1;
      maximo = Math.max(maximo, enCurso);
      await new Promise((seguir) => setTimeout(seguir, 5));
      enCurso -= 1;
      return { ok: true, status: 200, headers: new Headers(), arrayBuffer: async () => new Uint8Array([1]).buffer } as unknown as Response;
    });
    const senal = new AbortController().signal;
    // Dos descargas a la vez, cada una con varios pedidos.
    await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        fuenteDelServidor().pedirTesela({ z: 14, x: i, y: 1, capa: "sombra" }, senal),
      ),
    );
    expect(maximo).toBe(3);
  });

  it("el dibujo y la foto no esperan turno", async () => {
    let enCurso = 0;
    let maximo = 0;
    vi.stubGlobal("fetch", async () => {
      enCurso += 1;
      maximo = Math.max(maximo, enCurso);
      await new Promise((seguir) => setTimeout(seguir, 5));
      enCurso -= 1;
      return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array([1]).buffer } as unknown as Response;
    });
    const senal = new AbortController().signal;
    await Promise.all(Array.from({ length: 6 }, (_, i) => fuenteDelServidor().pedirTesela({ z: 14, x: i, y: 1 }, senal)));
    expect(maximo).toBe(6);
  });
});
