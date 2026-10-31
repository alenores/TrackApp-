import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Si el servicio de Córdoba falla, el pedazo de sombreado sale igual con la
 * altura de 30 m y dice por qué (decisión 079; Ale, 2026-10-31). Si falla
 * también el relieve de 30 m, eso sí frena.
 */

vi.mock("@/lib/alturas/relieve-del-servidor", () => ({
  // Un pedazo de relieve de 30 m parejo, a 1500 m.
  abrirPedazo: async () => {
    const lado = 4;
    const datos = new Uint8Array(lado * lado * 3);
    const valor = 1500 + 32768;
    for (let i = 0; i < lado * lado; i += 1) {
      datos[i * 3] = Math.floor(valor / 256);
      datos[i * 3 + 1] = valor % 256;
    }
    return { ancho: lado, alto: lado, canales: 3, datos };
  },
}));

import { armarPedazoDeSombra } from "@/lib/mapas/sombra-del-servidor";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cuando el servicio de Córdoba falla", () => {
  it("si no contesta, el pedazo sale igual con la altura de 30 m y el motivo", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("fetch failed");
    });
    const pedazo = await armarPedazoDeSombra(14, 5242, 9699);
    expect(pedazo).not.toBeNull();
    expect(pedazo!.bytes.byteLength).toBeGreaterThan(0);
    expect(pedazo!.conMenosDetalle).toMatch(/IDECOR\) no contestó/);
  });

  it("si contesta con error, también sale igual y dice qué contestó", async () => {
    vi.stubGlobal("fetch", async () => new Response("caído", { status: 503 }));
    const pedazo = await armarPedazoDeSombra(14, 5242, 9699);
    expect(pedazo!.conMenosDetalle).toMatch(/contestó 503/);
  });

  it("afuera de Córdoba no es una falla: sale completo, sin aviso", async () => {
    vi.stubGlobal(
      "fetch",
      async () => new Response("<ExceptionText>Empty intersection after subsetting</ExceptionText>", { status: 404 }),
    );
    const pedazo = await armarPedazoDeSombra(14, 5600, 9800);
    expect(pedazo!.conMenosDetalle).toBeNull();
  });
});
