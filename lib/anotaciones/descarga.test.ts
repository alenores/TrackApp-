// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  bajarLasFotosDeLasAnotaciones,
  cuantasFotosChicasFaltan,
  fotosDeLasAnotaciones,
  ponerAlDiaLasFotosChicas,
} from "@/lib/anotaciones/descarga";
import {
  borrarTodasLasFotos,
  cualesFotosEstanGuardadas,
  guardarFotos,
  leerFoto,
} from "@/lib/anotaciones/deposito";
import type { Anotacion } from "@/types/database";

/**
 * Las pruebas de las fotos de las anotaciones.
 *
 * **Acá también se prueba una promesa.** La foto de una anotación existe para
 * el momento en que la persona está parada en el cruce sin señal. Si la app
 * dice que está bajada y no está, el error no se ve en casa: se ve ahí.
 *
 * Las que mandan son: que no se dé por bajada una foto que no entró, que se
 * baje la foto chica y nunca la grande, y que lo que falta se sepa **en casa**.
 */

function anotacion(id: number, sectorId: number | null, fotoChicaUrl: string | null): Anotacion {
  return {
    id,
    sectorId,
    perfilId: "alguien",
    deAdministrador: false,
    tipo: "punto",
    origen: "manual",
    icono: "cruce",
    color: null,
    comentario: null,
    fotoUrl: fotoChicaUrl ? fotoChicaUrl.replace("chica", "grande") : null,
    fotoChicaUrl,
    geometria: { type: "Point", coordinates: [-64.9, -31.9] },
    marcadaEn: "2026-09-01T10:00:00Z",
    precisionGpsMetros: null,
    creadoEn: "2026-09-01T10:00:00Z",
    actualizadoEn: "2026-09-01T10:00:00Z",
  };
}

/** Un servidor de mentira: responde bien, mal o se corta, según la dirección. */
function servidor(comoResponde: (direccion: string) => "bien" | "vacia" | number) {
  const pedidas: string[] = [];

  vi.stubGlobal("fetch", async (entrada: string) => {
    pedidas.push(entrada);
    const respuesta = comoResponde(entrada);

    if (typeof respuesta === "number") {
      return { ok: false, status: respuesta } as unknown as Response;
    }

    const bytes = respuesta === "vacia" ? new Uint8Array(0) : new Uint8Array([7, 7, 7]);
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => bytes.buffer,
    } as unknown as Response;
  });

  return pedidas;
}

beforeEach(async () => {
  await borrarTodasLasFotos();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("qué fotos hacen falta", () => {
  it("junta las direcciones sin repetir y saltea las anotaciones sin foto", () => {
    expect(
      fotosDeLasAnotaciones([
        anotacion(1, 1, "https://foto/a-chica.webp"),
        anotacion(2, 1, null),
        anotacion(3, 1, "https://foto/a-chica.webp"),
        anotacion(4, 1, "https://foto/b-chica.webp"),
      ]),
    ).toEqual(["https://foto/a-chica.webp", "https://foto/b-chica.webp"]);
  });
});

describe("bajar las fotos", () => {
  it("cuando entran todas, quedan guardadas y no se avisa nada", async () => {
    servidor(() => "bien");

    const avance = await bajarLasFotosDeLasAnotaciones({
      anotaciones: [
        anotacion(1, 1, "https://foto/a-chica.webp"),
        anotacion(2, 1, "https://foto/b-chica.webp"),
      ],
    });

    expect(avance).toMatchObject({ bajadas: 2, total: 2, motivo: null });
    expect(avance.direcciones.sort()).toEqual([
      "https://foto/a-chica.webp",
      "https://foto/b-chica.webp",
    ]);
    expect(await leerFoto("https://foto/a-chica.webp")).not.toBeNull();
  });

  it("una foto que no entró no se cuenta como bajada, y se dice por qué", async () => {
    servidor((direccion) => (direccion.endsWith("b-chica.webp") ? 404 : "bien"));

    const avance = await bajarLasFotosDeLasAnotaciones({
      anotaciones: [
        anotacion(1, 1, "https://foto/a-chica.webp"),
        anotacion(2, 1, "https://foto/b-chica.webp"),
      ],
    });

    expect(avance.bajadas).toBe(1);
    expect(avance.total).toBe(2);
    expect(avance.motivo).toContain("404");
    expect(avance.direcciones).toEqual(["https://foto/a-chica.webp"]);
    expect(await leerFoto("https://foto/b-chica.webp")).toBeNull();
  });

  it("una falla no frena a las demás", async () => {
    servidor((direccion) => (direccion.endsWith("a-chica.webp") ? 500 : "bien"));

    const avance = await bajarLasFotosDeLasAnotaciones({
      anotaciones: [
        anotacion(1, 1, "https://foto/a-chica.webp"),
        anotacion(2, 1, "https://foto/b-chica.webp"),
        anotacion(3, 1, "https://foto/c-chica.webp"),
      ],
    });

    expect(avance.bajadas).toBe(2);
    expect(avance.direcciones.sort()).toEqual([
      "https://foto/b-chica.webp",
      "https://foto/c-chica.webp",
    ]);
  });

  it("una foto vacía no se da por buena", async () => {
    servidor(() => "vacia");

    const avance = await bajarLasFotosDeLasAnotaciones({
      anotaciones: [anotacion(1, 1, "https://foto/a-chica.webp")],
    });

    expect(avance.bajadas).toBe(0);
    expect(avance.motivo).toBeTruthy();
  });

  it("no vuelve a pedir lo que ya está en el celular", async () => {
    const primeras = servidor(() => "bien");
    await bajarLasFotosDeLasAnotaciones({
      anotaciones: [anotacion(1, 1, "https://foto/a-chica.webp")],
    });
    expect(primeras).toHaveLength(1);
    vi.unstubAllGlobals();

    const segundas = servidor(() => "bien");
    const avance = await bajarLasFotosDeLasAnotaciones({
      anotaciones: [
        anotacion(1, 1, "https://foto/a-chica.webp"),
        anotacion(2, 1, "https://foto/b-chica.webp"),
      ],
    });

    expect(segundas).toEqual(["https://foto/b-chica.webp"]);
    expect(avance.bajadas).toBe(2);
  });

  it("sin anotaciones con foto, no sale a pedir nada", async () => {
    const pedidas = servidor(() => "bien");

    const avance = await bajarLasFotosDeLasAnotaciones({
      anotaciones: [anotacion(1, 1, null)],
    });

    expect(pedidas).toEqual([]);
    expect(avance).toMatchObject({ bajadas: 0, total: 0, motivo: null });
  });

  it("cancelada a mitad, lo que entró queda", async () => {
    const cancelador = new AbortController();
    servidor((direccion) => {
      if (direccion.endsWith("a-chica.webp")) cancelador.abort();
      return "bien";
    });

    await bajarLasFotosDeLasAnotaciones({
      anotaciones: [anotacion(1, 1, "https://foto/a-chica.webp")],
      senal: cancelador.signal,
    });

    const guardadas = await cualesFotosEstanGuardadas(["https://foto/a-chica.webp"]);
    expect(guardadas.size).toBe(1);
  });
});

describe("la foto chica baja sola y la grande nunca", () => {
  it("pide solo la chica", async () => {
    const pedidas = servidor(() => "bien");

    await bajarLasFotosDeLasAnotaciones({
      anotaciones: [anotacion(1, 1, "https://foto/a-chica.webp")],
    });

    expect(pedidas).toEqual(["https://foto/a-chica.webp"]);
  });

  it("una anotación fuera de todo sector también baja su foto", async () => {
    servidor(() => "bien");

    const avance = await bajarLasFotosDeLasAnotaciones({
      anotaciones: [anotacion(1, null, "https://foto/a-chica.webp")],
    });

    expect(avance.bajadas).toBe(1);
  });

  it("al ponerse al día tira las que ya no son de ninguna anotación", async () => {
    await guardarFotos([
      { direccion: "https://foto/vieja-chica.webp", bytes: new Uint8Array([1]) },
    ]);
    servidor(() => "bien");

    await ponerAlDiaLasFotosChicas([anotacion(1, 1, "https://foto/a-chica.webp")]);

    expect(await leerFoto("https://foto/vieja-chica.webp")).toBeNull();
    expect(await leerFoto("https://foto/a-chica.webp")).not.toBeNull();
  });
});

describe("cuántas fotos faltan, para avisar en casa", () => {
  it("cuenta las que no están en el celular", async () => {
    await guardarFotos([
      { direccion: "https://foto/a-chica.webp", bytes: new Uint8Array([1]) },
    ]);

    expect(
      await cuantasFotosChicasFaltan([
        anotacion(1, 1, "https://foto/a-chica.webp"),
        anotacion(2, 1, "https://foto/b-chica.webp"),
      ]),
    ).toBe(1);
  });

  it("sin fotos no falta nada", async () => {
    expect(await cuantasFotosChicasFaltan([anotacion(1, 1, null)])).toBe(0);
  });

  it("una foto reemplazada cuenta como faltante", async () => {
    await guardarFotos([
      { direccion: "https://foto/a-chica.webp?v=1", bytes: new Uint8Array([1]) },
    ]);

    expect(
      await cuantasFotosChicasFaltan([anotacion(1, 1, "https://foto/a-chica.webp?v=2")]),
    ).toBe(1);
  });
});
