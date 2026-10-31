// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  borrarImagenesVencidasDeGoogle,
  borrarTodasLasImagenesDeGoogle,
  guardarImagenDeGoogle,
  leerImagenDeGoogle,
  traerImagenDeGoogle,
  venceSegunGoogle,
} from "@/lib/mapas/google-guardado";
import { servirGoogleGuardado } from "@/lib/mapas/protocolo";

/**
 * Las imágenes de Google se guardan **solo el tiempo que Google indica** y la
 * navegación las lee sin salir a internet (decisión 080). Si esto se rompe en
 * un sentido, se guarda más de lo que Google permite; en el otro, navegando se
 * sale a internet.
 */

beforeEach(async () => {
  await borrarTodasLasImagenesDeGoogle();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cuánto deja Google guardar", () => {
  it("el tiempo que dice cada imagen, ni más ni menos", () => {
    expect(venceSegunGoogle("public, max-age=3600", 1000)).toBe(1000 + 3600 * 1000);
  });

  it("si dice que no se guarde, o no dice por cuánto, no se guarda", () => {
    expect(venceSegunGoogle("private, no-store, max-age=3600", 0)).toBeNull();
    expect(venceSegunGoogle("public", 0)).toBeNull();
    expect(venceSegunGoogle("", 0)).toBeNull();
    expect(venceSegunGoogle(null, 0)).toBeNull();
    expect(venceSegunGoogle("max-age=0", 0)).toBeNull();
  });
});

describe("leer lo guardado", () => {
  it("mientras vale, se lee; vencida, no", async () => {
    await guardarImagenDeGoogle(15, 1, 2, new Uint8Array([7]), 5000);
    expect(Array.from((await leerImagenDeGoogle(15, 1, 2, 4999)) ?? [])).toEqual([7]);
    expect(await leerImagenDeGoogle(15, 1, 2, 5000)).toBeNull();
  });

  it("las vencidas se borran y las vigentes quedan", async () => {
    await guardarImagenDeGoogle(15, 1, 2, new Uint8Array([1]), 100);
    await guardarImagenDeGoogle(15, 1, 3, new Uint8Array([2]), 9_999_999_999_999);
    await borrarImagenesVencidasDeGoogle(200);
    expect(await leerImagenDeGoogle(15, 1, 2, 0)).toBeNull();
    expect(await leerImagenDeGoogle(15, 1, 3, 0)).not.toBeNull();
  });

  it("navegando NO sale a internet, y sin imagen devuelve vacío", async () => {
    const red = vi.fn();
    vi.stubGlobal("fetch", red);
    const vacia = await servirGoogleGuardado("google-guardado://15/9/9");
    expect(red).not.toHaveBeenCalled();
    expect(vacia.byteLength).toBe(0);
  });
});

describe("Consultas, con señal", () => {
  function google(cabecera: string | null, ok = true) {
    const pedidas: string[] = [];
    vi.stubGlobal("fetch", async (direccion: string) => {
      pedidas.push(direccion);
      return new Response(ok ? new Uint8Array([9, 9]) : JSON.stringify({ error: "Google no entregó esta imagen (403)." }), {
        status: ok ? 200 : 502,
        headers: cabecera === null ? {} : { "x-guardado-de-google": cabecera },
      });
    });
    return pedidas;
  }

  it("muestra la imagen y la deja guardada el tiempo que Google permite", async () => {
    const pedidas = google("public, max-age=86400");
    const datos = await traerImagenDeGoogle("google-en-vivo://15/3/4?sesion=abc");
    expect(Array.from(new Uint8Array(datos))).toEqual([9, 9]);
    expect(pedidas).toEqual(["/api/mapa-google/tesela/15/3/4?sesion=abc"]);
    await vi.waitFor(async () => expect(await leerImagenDeGoogle(15, 3, 4)).not.toBeNull());
  });

  it("si Google no permite guardarla, se muestra pero no se guarda", async () => {
    google("no-store");
    await traerImagenDeGoogle("google-en-vivo://15/3/5?sesion=abc");
    await new Promise((seguir) => setTimeout(seguir, 20));
    expect(await leerImagenDeGoogle(15, 3, 5)).toBeNull();
  });

  it("si Google falla, el motivo llega a la pantalla", async () => {
    google(null, false);
    await expect(traerImagenDeGoogle("google-en-vivo://15/3/6?sesion=abc")).rejects.toThrow(/403/);
  });
});
