// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  bajarLasFotosDeLasAnotaciones,
  fotosDeLasAnotaciones,
  sectoresConFotosSinBajar,
} from "@/lib/anotaciones/descarga";
import {
  borrarTodasLasFotos,
  cualesFotosEstanGuardadas,
  leerFoto,
} from "@/lib/anotaciones/deposito";
import type { MapaDeSector } from "@/lib/offline/mapas";
import type { Anotacion, Sector } from "@/types/database";

/**
 * Las pruebas de las fotos de las anotaciones.
 *
 * **Acá también se prueba una promesa.** La foto de una anotación existe para
 * el momento en que la persona está parada en el cruce sin señal. Si la app
 * dice que está bajada y no está, el error no se ve en casa: se ve ahí.
 *
 * Las dos que mandan son: que no se dé por bajada una foto que no entró, y que
 * una foto agregada después de bajar el mapa se note **en casa**.
 */

function anotacion(id: number, sectorId: number, fotoUrl: string | null): Anotacion {
  return {
    id,
    sectorId,
    perfilId: "alguien",
    tipo: "punto",
    icono: "cruce",
    color: null,
    comentario: null,
    fotoUrl,
    geometria: { type: "Point", coordinates: [-64.9, -31.9] },
    creadoEn: "2026-09-01T10:00:00Z",
    actualizadoEn: "2026-09-01T10:00:00Z",
  };
}

function sector(id: number): Sector {
  return {
    id,
    zonaId: 1,
    perfilId: "alguien",
    nombre: `Sector ${id}`,
    descripcion: null,
    rectangulo: { latNorte: -31.9, latSur: -31.91, lonOeste: -64.9, lonEste: -64.89 },
    creadoEn: "2026-09-01T10:00:00Z",
    actualizadoEn: "2026-09-01T10:00:00Z",
  };
}

function mapaBajado(sectorId: number, fotos: string[]): MapaDeSector {
  return {
    sectorId,
    tipo: "simple",
    bytes: 1000,
    bajadoEn: "2026-09-01T10:00:00Z",
    acercamientoMaximo: 15,
    fotos,
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
        anotacion(1, 1, "https://foto/a.webp"),
        anotacion(2, 1, null),
        anotacion(3, 1, "https://foto/a.webp"),
        anotacion(4, 1, "https://foto/b.webp"),
      ]),
    ).toEqual(["https://foto/a.webp", "https://foto/b.webp"]);
  });
});

describe("bajar las fotos", () => {
  it("cuando entran todas, quedan guardadas y no se avisa nada", async () => {
    servidor(() => "bien");

    const avance = await bajarLasFotosDeLasAnotaciones({
      anotaciones: [
        anotacion(1, 1, "https://foto/a.webp"),
        anotacion(2, 1, "https://foto/b.webp"),
      ],
    });

    expect(avance).toMatchObject({ bajadas: 2, total: 2, motivo: null });
    expect(avance.direcciones.sort()).toEqual([
      "https://foto/a.webp",
      "https://foto/b.webp",
    ]);
    expect(await leerFoto("https://foto/a.webp")).not.toBeNull();
  });

  it("una foto que no entró no se cuenta como bajada, y se dice por qué", async () => {
    servidor((direccion) => (direccion.endsWith("b.webp") ? 404 : "bien"));

    const avance = await bajarLasFotosDeLasAnotaciones({
      anotaciones: [
        anotacion(1, 1, "https://foto/a.webp"),
        anotacion(2, 1, "https://foto/b.webp"),
      ],
    });

    expect(avance.bajadas).toBe(1);
    expect(avance.total).toBe(2);
    expect(avance.motivo).toContain("404");
    expect(avance.direcciones).toEqual(["https://foto/a.webp"]);
    expect(await leerFoto("https://foto/b.webp")).toBeNull();
  });

  it("una falla no frena a las demás", async () => {
    servidor((direccion) => (direccion.endsWith("a.webp") ? 500 : "bien"));

    const avance = await bajarLasFotosDeLasAnotaciones({
      anotaciones: [
        anotacion(1, 1, "https://foto/a.webp"),
        anotacion(2, 1, "https://foto/b.webp"),
        anotacion(3, 1, "https://foto/c.webp"),
      ],
    });

    expect(avance.bajadas).toBe(2);
    expect(avance.direcciones.sort()).toEqual([
      "https://foto/b.webp",
      "https://foto/c.webp",
    ]);
  });

  it("una foto vacía no se da por buena", async () => {
    servidor(() => "vacia");

    const avance = await bajarLasFotosDeLasAnotaciones({
      anotaciones: [anotacion(1, 1, "https://foto/a.webp")],
    });

    expect(avance.bajadas).toBe(0);
    expect(avance.motivo).toBeTruthy();
  });

  it("no vuelve a pedir lo que ya está en el celular", async () => {
    const primeras = servidor(() => "bien");
    await bajarLasFotosDeLasAnotaciones({
      anotaciones: [anotacion(1, 1, "https://foto/a.webp")],
    });
    expect(primeras).toHaveLength(1);
    vi.unstubAllGlobals();

    const segundas = servidor(() => "bien");
    const avance = await bajarLasFotosDeLasAnotaciones({
      anotaciones: [
        anotacion(1, 1, "https://foto/a.webp"),
        anotacion(2, 1, "https://foto/b.webp"),
      ],
    });

    expect(segundas).toEqual(["https://foto/b.webp"]);
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
      if (direccion.endsWith("a.webp")) cancelador.abort();
      return "bien";
    });

    await bajarLasFotosDeLasAnotaciones({
      anotaciones: [anotacion(1, 1, "https://foto/a.webp")],
      senal: cancelador.signal,
    });

    const guardadas = await cualesFotosEstanGuardadas(["https://foto/a.webp"]);
    expect(guardadas.size).toBe(1);
  });
});

describe("qué sectores tienen fotos sin bajar", () => {
  it("avisa de una foto agregada después de bajar el mapa", () => {
    const faltan = sectoresConFotosSinBajar(
      [sector(1)],
      [
        anotacion(1, 1, "https://foto/vieja.webp"),
        anotacion(2, 1, "https://foto/nueva.webp"),
      ],
      [mapaBajado(1, ["https://foto/vieja.webp"])],
    );

    expect(faltan).toHaveLength(1);
    expect(faltan[0].cuantas).toBe(1);
  });

  it("no avisa cuando están todas", () => {
    expect(
      sectoresConFotosSinBajar(
        [sector(1)],
        [anotacion(1, 1, "https://foto/a.webp")],
        [mapaBajado(1, ["https://foto/a.webp"])],
      ),
    ).toEqual([]);
  });

  it("un sector sin mapa bajado no aparece: ahí el aviso es otro", () => {
    expect(
      sectoresConFotosSinBajar([sector(1)], [anotacion(1, 1, "https://foto/a.webp")], []),
    ).toEqual([]);
  });

  it("no cuenta las fotos de otro sector", () => {
    expect(
      sectoresConFotosSinBajar(
        [sector(1)],
        [anotacion(1, 2, "https://foto/de-otro.webp")],
        [mapaBajado(1, [])],
      ),
    ).toEqual([]);
  });

  it("una foto reemplazada cuenta como faltante", () => {
    const faltan = sectoresConFotosSinBajar(
      [sector(1)],
      [anotacion(1, 1, "https://foto/a.webp?v=2")],
      [mapaBajado(1, ["https://foto/a.webp?v=1"])],
    );

    expect(faltan[0].cuantas).toBe(1);
  });
});
