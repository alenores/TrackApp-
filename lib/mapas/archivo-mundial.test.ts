import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Las pruebas de cómo se encuentra el mapa del mundo.
 *
 * **El archivo cambia de nombre todos los días y los de más de una semana se
 * borran.** Si esto se equivoca, la app deja de poder bajar mapas y el usuario
 * se entera en casa, que es donde tiene que enterarse — pero igual se queda sin
 * poder salir. Por eso lleva prueba.
 */

async function conFecha(cuando: string) {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(cuando));
  return import("@/lib/mapas/archivo-mundial");
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("encontrar el archivo del día", () => {
  it("usa el de hoy cuando está", async () => {
    const { direccionDelArchivoMundial } = await conFecha("2026-09-19T10:00:00Z");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(new ArrayBuffer(16), { status: 206 })),
    );

    await expect(direccionDelArchivoMundial()).resolves.toContain("20260919.pmtiles");
  });

  it("si el de hoy todavía no existe, se va al de ayer", async () => {
    const { direccionDelArchivoMundial } = await conFecha("2026-09-19T03:00:00Z");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (direccion: string) =>
        direccion.includes("20260919")
          ? new Response(null, { status: 404 })
          : new Response(new ArrayBuffer(16), { status: 206 }),
      ),
    );

    await expect(direccionDelArchivoMundial()).resolves.toContain("20260918.pmtiles");
  });

  it("no se queda buscando para siempre y dice qué pasó", async () => {
    const { direccionDelArchivoMundial } = await conFecha("2026-09-19T10:00:00Z");
    const red = vi.fn(async () => new Response(null, { status: 404 }));
    vi.stubGlobal("fetch", red);

    await expect(direccionDelArchivoMundial()).rejects.toThrow(/404/);
    expect(red.mock.calls.length).toBeLessThanOrEqual(10);
  });

  it("cuando no se puede llegar al servidor, el motivo viaja adentro", async () => {
    const { direccionDelArchivoMundial } = await conFecha("2026-09-19T10:00:00Z");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("se cayó la conexión");
      }),
    );

    await expect(direccionDelArchivoMundial()).rejects.toThrow(/se cayó la conexión/);
  });

  it("no vuelve a buscar en cada pedido", async () => {
    const { direccionDelArchivoMundial } = await conFecha("2026-09-19T10:00:00Z");
    const red = vi.fn(async () => new Response(new ArrayBuffer(16), { status: 206 }));
    vi.stubGlobal("fetch", red);

    await direccionDelArchivoMundial();
    await direccionDelArchivoMundial();
    await direccionDelArchivoMundial();

    expect(red).toHaveBeenCalledTimes(1);
  });

  it("después de un día vuelve a buscar, porque el archivo cambió", async () => {
    const { direccionDelArchivoMundial } = await conFecha("2026-09-19T10:00:00Z");
    const red = vi.fn(async () => new Response(new ArrayBuffer(16), { status: 206 }));
    vi.stubGlobal("fetch", red);

    await expect(direccionDelArchivoMundial()).resolves.toContain("20260919");

    vi.setSystemTime(new Date("2026-09-20T10:00:00Z"));
    await expect(direccionDelArchivoMundial()).resolves.toContain("20260920");
  });
});
