// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as deposito from "@/lib/offline/deposito";
import {
  borrarTodasLasImagenesDeGoogle, guardarImagenDeGoogle, invalidarCacheDeGoogle,
  leerImagenDeGoogle, traerRecursoDeGoogle, LIMITE_DE_IMAGENES_EN_MEMORIA_GOOGLE,
} from "@/lib/mapas/google-guardado";

const url = (x = 3, sesion = "primera") => "google-en-vivo://15/" + x + "/4?sesion=" + sesion;
function respuesta(bytes = new Uint8Array([7, 8, 9]), cabecera = "public, max-age=3600") {
  return new Response(bytes, { headers: { "x-guardado-de-google": cabecera } });
}
function usarRed(cabecera = "public, max-age=3600", bytes = new Uint8Array([7, 8, 9])) {
  const red = vi.fn(async () => respuesta(bytes, cabecera));
  vi.stubGlobal("fetch", red);
  return red;
}
function diferida<T>() {
  let resolver!: (valor: T) => void;
  const promesa = new Promise<T>((r) => { resolver = r; });
  return { promesa, resolver };
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-18T12:00:00Z"));
  await borrarTodasLasImagenesDeGoogle();
});
afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  await borrarTodasLasImagenesDeGoogle();
  vi.useRealTimers();
});

describe("Google compartido entre mapas", () => {
  it("comparte entre sesiones y devuelve bytes independientes y vencimiento original", async () => {
    const red = usarRed();
    const [primera, segunda] = await Promise.all([traerRecursoDeGoogle(url()), traerRecursoDeGoogle(url(3, "segunda"))]);
    expect(red).toHaveBeenCalledTimes(1);
    expect(primera.expires).toBe("2026-11-18T13:00:00.000Z");
    expect(primera).not.toHaveProperty("cacheControl");
    expect(segunda.data).not.toBe(primera.data);
    structuredClone(primera.data, { transfer: [primera.data] });
    expect(primera.data.byteLength).toBe(0);
    expect([...new Uint8Array(segunda.data)]).toEqual([7, 8, 9]);
    vi.setSystemTime(new Date("2026-11-18T12:10:00Z"));
    expect((await traerRecursoDeGoogle(url())).expires).toBe(segunda.expires);
    expect(red).toHaveBeenCalledTimes(1);
  });

  it("lee la copia nueva de IndexedDB al perder la memoria; legacy sigue solo offline", async () => {
    const red = usarRed();
    const primera = await traerRecursoDeGoogle(url());
    await vi.waitFor(async () => expect(await leerImagenDeGoogle(15, 3, 4)).not.toBeNull());
    invalidarCacheDeGoogle();
    vi.setSystemTime(new Date("2026-11-18T12:10:00Z"));
    expect((await traerRecursoDeGoogle(url(3, "otra"))).expires).toBe(primera.expires);
    expect(red).toHaveBeenCalledTimes(1);
    await guardarImagenDeGoogle(15, 8, 4, new Uint8Array([1]), Date.now() + 60_000);
    expect([...(await leerImagenDeGoogle(15, 8, 4))!]).toEqual([1]);
    expect([...new Uint8Array((await traerRecursoDeGoogle(url(8))).data)]).toEqual([7, 8, 9]);
    expect(red).toHaveBeenCalledTimes(2);
  });

  it.each(["no-store", "no-cache, max-age=3600", "max-age=0", "public"])("no comparte una respuesta %s ya finalizada", async (cabecera) => {
    const red = usarRed(cabecera);
    expect(await traerRecursoDeGoogle(url())).not.toHaveProperty("expires");
    await traerRecursoDeGoogle(url(3, "otra"));
    expect(red).toHaveBeenCalledTimes(2);
    expect(await leerImagenDeGoogle(15, 3, 4)).toBeNull();
  });

  it("vuelve a pedir una imagen vencida", async () => {
    const red = usarRed("max-age=1");
    await traerRecursoDeGoogle(url());
    vi.setSystemTime(Date.now() + 1001);
    await traerRecursoDeGoogle(url());
    expect(red).toHaveBeenCalledTimes(2);
  });

  it("abortar un consumidor conserva al otro y al pedido de red", async () => {
    const entrega = diferida<Response>();
    let senal: AbortSignal | undefined;
    const red = vi.fn((_u, opciones: RequestInit) => { senal = opciones.signal as AbortSignal; return entrega.promesa; });
    vi.stubGlobal("fetch", red);
    const control = new AbortController();
    const primera = traerRecursoDeGoogle(url(), control.signal);
    const rechazada = expect(primera).rejects.toMatchObject({ name: "AbortError" });
    const segunda = traerRecursoDeGoogle(url(3, "otra"));
    await vi.waitFor(() => expect(red).toHaveBeenCalledTimes(1));
    control.abort();
    await rechazada;
    expect(senal?.aborted).toBe(false);
    entrega.resolver(respuesta());
    expect([...new Uint8Array((await segunda).data)]).toEqual([7, 8, 9]);
  });

  it("abortar todos cancela la red y permite reintentar, aunque llegue tarde", async () => {
    const entrega = diferida<Response>();
    let senal: AbortSignal | undefined;
    const red = vi.fn((_u, opciones: RequestInit) => { senal = opciones.signal as AbortSignal; return entrega.promesa; });
    vi.stubGlobal("fetch", red);
    const a = new AbortController(), b = new AbortController();
    const primera = traerRecursoDeGoogle(url(), a.signal), segunda = traerRecursoDeGoogle(url(), b.signal);
    const rechazos = [expect(primera).rejects.toMatchObject({ name: "AbortError" }), expect(segunda).rejects.toMatchObject({ name: "AbortError" })];
    await vi.waitFor(() => expect(red).toHaveBeenCalledTimes(1));
    a.abort(); b.abort();
    await Promise.all(rechazos);
    expect(senal?.aborted).toBe(true);
    entrega.resolver(respuesta());
    await new Promise((r) => setTimeout(r, 0));
    expect(await leerImagenDeGoogle(15, 3, 4)).toBeNull();
    usarRed();
    expect((await traerRecursoDeGoogle(url())).data.byteLength).toBe(3);
  });

  it("logout invalida sincronamente y una respuesta antigua no repuebla lo borrado", async () => {
    const entrega = diferida<Response>();
    const red = vi.fn(() => entrega.promesa);
    vi.stubGlobal("fetch", red);
    const pedido = traerRecursoDeGoogle(url());
    const rechazo = expect(pedido).rejects.toMatchObject({ name: "AbortError" });
    await vi.waitFor(() => expect(red).toHaveBeenCalledTimes(1));
    expect(invalidarCacheDeGoogle()).toBeUndefined();
    await rechazo;
    await borrarTodasLasImagenesDeGoogle();
    entrega.resolver(respuesta());
    await new Promise((r) => setTimeout(r, 0));
    expect(await leerImagenDeGoogle(15, 3, 4)).toBeNull();
  });

  it("la lectura persistente pendiente tiene tope y no impide mostrar la red", async () => {
    vi.spyOn(deposito, "leerDelDeposito").mockImplementation(() => new Promise(() => {}));
    const red = usarRed();
    expect((await traerRecursoDeGoogle(url())).data.byteLength).toBe(3);
    expect(red).toHaveBeenCalledTimes(1);
  });

  it("una escritura pendiente no demora la imagen y el clear espera su orden", async () => {
    const escribir = deposito.escribirEnElDeposito;
    const liberacion = diferida<void>();
    let primera = true;
    const espia = vi.spyOn(deposito, "escribirEnElDeposito").mockImplementation(async (...args) => {
      if (primera) { primera = false; await liberacion.promesa; }
      return escribir(...args);
    });
    usarRed();
    expect((await traerRecursoDeGoogle(url())).data.byteLength).toBe(3);
    await vi.waitFor(() => expect(espia).toHaveBeenCalledTimes(1));
    let borrado = false;
    const borrar = borrarTodasLasImagenesDeGoogle().then(() => { borrado = true; });
    await Promise.resolve();
    expect(borrado).toBe(false);
    liberacion.resolver();
    await borrar;
    expect(await leerImagenDeGoogle(15, 3, 4)).toBeNull();
  });

  it("si el depósito falla, muestra la imagen y la memoria sigue reutilizándola", async () => {
    vi.spyOn(deposito, "leerDelDeposito").mockRejectedValue(new Error("depósito roto"));
    vi.spyOn(deposito, "escribirEnElDeposito").mockRejectedValue(new Error("sin espacio"));
    const red = usarRed();
    await traerRecursoDeGoogle(url());
    await traerRecursoDeGoogle(url());
    expect(red).toHaveBeenCalledTimes(1);
  });

  it("un registro persistente corrupto no bloquea ni entrega bytes inválidos", async () => {
    vi.spyOn(deposito, "leerDelDeposito").mockResolvedValue({
      bytes: "roto", venceEn: Infinity, variante: "satellite/es-AR/AR/256/v1", permisoHttp: 1,
    });
    const red = usarRed();
    expect((await traerRecursoDeGoogle(url())).data.byteLength).toBe(3);
    expect(red).toHaveBeenCalledTimes(1);
  });

  it("acota cantidad en RAM por LRU sin borrar las copias vigentes del celular", async () => {
    const red = usarRed();
    for (let x = 0; x < LIMITE_DE_IMAGENES_EN_MEMORIA_GOOGLE; x++) await traerRecursoDeGoogle(url(x));
    await traerRecursoDeGoogle(url(0)); // Conserva la usada recientemente.
    await traerRecursoDeGoogle(url(LIMITE_DE_IMAGENES_EN_MEMORIA_GOOGLE));
    expect(await leerImagenDeGoogle(15, 1, 4)).not.toBeNull(); // Expulsada de RAM, no de IDB.
    vi.spyOn(deposito, "leerDelDeposito").mockRejectedValue(new Error("sin depósito"));
    const llamadas = red.mock.calls.length;
    await traerRecursoDeGoogle(url(0));
    expect(red).toHaveBeenCalledTimes(llamadas);
    await traerRecursoDeGoogle(url(1));
    expect(red).toHaveBeenCalledTimes(llamadas + 1);
  });

  it("acota también los bytes de RAM sin recortar cobertura persistente", async () => {
    const red = usarRed("max-age=3600", new Uint8Array(6 * 1024 * 1024));
    await traerRecursoDeGoogle(url(0)); await traerRecursoDeGoogle(url(1)); await traerRecursoDeGoogle(url(2));
    expect((await leerImagenDeGoogle(15, 0, 4))?.byteLength).toBe(6 * 1024 * 1024);
    vi.spyOn(deposito, "leerDelDeposito").mockRejectedValue(new Error("sin depósito"));
    await traerRecursoDeGoogle(url(2));
    expect(red).toHaveBeenCalledTimes(3);
    await traerRecursoDeGoogle(url(0));
    expect(red).toHaveBeenCalledTimes(4);
  });

  it("no convierte una imagen vencida entre lectura y entrega en recurso sin vencimiento", async () => {
    usarRed("max-age=1");
    const primera = await traerRecursoDeGoogle(url());
    const venceEn = Date.parse(primera.expires!);
    vi.spyOn(Date, "now").mockReturnValueOnce(venceEn - 1).mockReturnValue(venceEn + 1);
    await expect(traerRecursoDeGoogle(url())).rejects.toThrow(/venció/);
  });

  it("una escritura pendiente no bloquea la lectura offline de otra imagen", async () => {
    await guardarImagenDeGoogle(15, 3, 4, new Uint8Array([1]), Date.now() + 60_000);
    const original = deposito.escribirEnElDeposito;
    const liberacion = diferida<void>();
    let demorar = true;
    vi.spyOn(deposito, "escribirEnElDeposito").mockImplementation(async (...args) => {
      if (demorar) { demorar = false; await liberacion.promesa; }
      return original(...args);
    });
    usarRed();
    await traerRecursoDeGoogle(url(9));
    try {
      const bytes = await Promise.race([
        leerImagenDeGoogle(15, 3, 4),
        new Promise<never>((_, rechazar) => setTimeout(() => rechazar(new Error("lectura bloqueada")), 250)),
      ]);
      expect([...(bytes ?? [])]).toEqual([1]);
    } finally {
      liberacion.resolver();
    }
  });
});
