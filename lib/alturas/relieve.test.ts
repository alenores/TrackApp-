import { describe, expect, it } from "vitest";
import { alturaEnElPedazo, alturasDePuntos, alturaTerrarium, ubicarEnElRelieve, type PedazoDeRelieve } from "@/lib/alturas/relieve";
import { columnaDeTesela, filaDeTesela } from "@/lib/mapas/teselas";

/** Un pedazo donde cada punto vale `altura(x, y)`, escrito en terrarium como el de verdad. */
function pedazoDe(altura: (x: number, y: number) => number, lado = 4): PedazoDeRelieve {
  const datos = new Uint8Array(lado * lado * 3);
  for (let y = 0; y < lado; y += 1) {
    for (let x = 0; x < lado; x += 1) {
      const valor = altura(x, y) + 32768;
      const i = (y * lado + x) * 3;
      datos[i] = Math.floor(valor / 256);
      datos[i + 1] = Math.floor(valor) % 256;
      datos[i + 2] = Math.round((valor - Math.floor(valor)) * 256);
    }
  }
  return { ancho: lado, alto: lado, canales: 3, datos };
}

describe("la imagen del relieve", () => {
  it("lee la altura escrita en terrarium", () => {
    // 1000 m = 33768 = 131 * 256 + 232
    expect(alturaTerrarium(131, 232, 0)).toBe(1000);
    expect(alturaTerrarium(128, 0, 128)).toBe(0.5);
  });

  it("en el centro de un punto da su valor; entre dos, la mezcla", () => {
    const pedazo = pedazoDe((x) => 1000 + x * 10);
    expect(alturaEnElPedazo(pedazo, 1.5, 1.5)).toBeCloseTo(1010);
    expect(alturaEnElPedazo(pedazo, 2, 1.5)).toBeCloseTo(1015);
  });

  it("en el borde no se sale del pedazo", () => {
    const pedazo = pedazoDe(() => 750);
    expect(alturaEnElPedazo(pedazo, 0, 0)).toBe(750);
    expect(alturaEnElPedazo(pedazo, 4, 4)).toBe(750);
  });
});

describe("dónde cae un punto", () => {
  it("cae en el mismo pedazo que usa la descarga de mapas", () => {
    const lugar = ubicarEnElRelieve(-64.1833, -31.4167, 12, 512);
    expect(lugar.x).toBe(columnaDeTesela(-64.1833, 12));
    expect(lugar.y).toBe(filaDeTesela(-31.4167, 12));
    expect(lugar.px).toBeGreaterThanOrEqual(0);
    expect(lugar.px).toBeLessThan(512);
  });
});

describe("alturas de varios puntos", () => {
  it("abre cada pedazo una sola vez", async () => {
    let abiertos = 0;
    const resultado = await alturasDePuntos([[-64.5, -31.5], [-64.5001, -31.5001], [-64.5002, -31.5]], async () => {
      abiertos += 1;
      return pedazoDe(() => 900, 512);
    });
    expect(resultado).toEqual({ ok: true, datos: [900, 900, 900] });
    expect(abiertos).toBe(1);
  });

  it("donde no hay relieve, lo dice y no inventa", async () => {
    const resultado = await alturasDePuntos([[-64.5, -31.5]], async () => null);
    expect(resultado.ok).toBe(false);
  });

  it("si el archivo no contesta, el motivo llega al cartel", async () => {
    const resultado = await alturasDePuntos([[-64.5, -31.5]], async () => {
      throw new Error("tiempo agotado");
    });
    expect(resultado).toEqual({
      ok: false,
      error: "No se pudieron calcular las alturas: tiempo agotado. No se guardó nada. Probá de nuevo en un rato.",
    });
  });
});
