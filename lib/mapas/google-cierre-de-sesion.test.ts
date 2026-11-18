// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ServicioDeGoogle = typeof import("@/lib/mapas/google-guardado");
type Deposito = typeof import("@/lib/offline/deposito");
let google: ServicioDeGoogle;
let deposito: Deposito;

function diferido<T>() {
  let resolver!: (valor: T) => void;
  const promesa = new Promise<T>((seguir) => { resolver = seguir; });
  return { promesa, resolver };
}

function direccion(x = 4) {
  return `google-en-vivo://15/${x}/7?sesion=sesion_de_esta_pantalla`;
}

function respuesta() {
  return new Response(new Uint8Array([9, 8, 7]), {
    headers: { "x-guardado-de-google": "private, max-age=600" },
  });
}

function simularRed() {
  const red = vi.fn(async () => respuesta());
  vi.stubGlobal("fetch", red);
  return red;
}

async function imagenesPersistidas() {
  return deposito.leerDelDeposito<IDBValidKey[]>(
    deposito.ESTANTES.imagenesDeGoogle, (estante) => estante.getAllKeys(),
  );
}

beforeEach(async () => {
  // El bloqueo dura lo que el documento. Cada caso nace con módulos nuevos,
  // sin alterar el singleton que usan las pruebas estáticas del servicio.
  vi.resetModules();
  google = await import("@/lib/mapas/google-guardado");
  deposito = await import("@/lib/offline/deposito");
  await google.borrarTodasLasImagenesDeGoogle();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  deposito.cerrarElDeposito();
});

describe("las consultas Google después de cerrar sesión", () => {
  it("bloquea de inmediato una imagen recordada y una nueva, sin leer ni escribir ni salir a red", async () => {
    const red = simularRed();
    await google.traerRecursoDeGoogle(direccion());
    await vi.waitFor(async () => expect(await imagenesPersistidas()).toEqual(["15/4/7"]));
    const leer = vi.spyOn(deposito, "leerDelDeposito");
    const escribir = vi.spyOn(deposito, "escribirEnElDeposito");

    google.bloquearConsultasDeGoogleAlSalir();

    await expect(google.traerRecursoDeGoogle(direccion())).rejects.toMatchObject({ name: "AbortError" });
    await expect(google.traerRecursoDeGoogle(direccion(5))).rejects.toMatchObject({ name: "AbortError" });
    expect(red).toHaveBeenCalledOnce();
    expect(leer).not.toHaveBeenCalled();
    expect(escribir).not.toHaveBeenCalled();
  });

  it("las invalidaciones y los borrados posteriores no reabren consultas ni escrituras", async () => {
    const red = simularRed();
    google.bloquearConsultasDeGoogleAlSalir();
    google.invalidarCacheDeGoogle();
    await google.borrarTodasLasImagenesDeGoogle();
    await google.borrarTodasLasImagenesDeGoogle();
    const escribir = vi.spyOn(deposito, "escribirEnElDeposito");

    await expect(google.traerRecursoDeGoogle(direccion())).rejects.toMatchObject({ name: "AbortError" });
    // El ayudante antiguo tampoco puede reponer una imagen durante la salida.
    await google.guardarImagenDeGoogle(15, 8, 7, new Uint8Array([1]), Date.now() + 60_000).catch(() => {});

    expect(red).not.toHaveBeenCalled();
    expect(escribir).not.toHaveBeenCalled();
    expect(await imagenesPersistidas()).toEqual([]);
  });

  it("un fallo del depósito al borrar no desactiva el bloqueo", async () => {
    const red = simularRed();
    google.bloquearConsultasDeGoogleAlSalir();
    const escribir = vi.spyOn(deposito, "escribirEnElDeposito")
      .mockRejectedValueOnce(new Error("El navegador negó el depósito."));

    await expect(google.borrarTodasLasImagenesDeGoogle()).rejects.toThrow("El navegador negó el depósito.");
    const llamadasTrasElFallo = escribir.mock.calls.length;
    await expect(google.traerRecursoDeGoogle(direccion())).rejects.toMatchObject({ name: "AbortError" });
    await google.guardarImagenDeGoogle(15, 8, 7, new Uint8Array([1]), Date.now() + 60_000).catch(() => {});

    expect(red).not.toHaveBeenCalled();
    expect(escribir).toHaveBeenCalledTimes(llamadasTrasElFallo);
  });

  it("una respuesta de red tardía que ignora abort no entrega ni repone imágenes", async () => {
    const llegada = diferido<Response>();
    const senalesDeRed: AbortSignal[] = [];
    const red = vi.fn((_url: RequestInfo | URL, opciones?: RequestInit) => {
      if (opciones?.signal) senalesDeRed.push(opciones.signal);
      return llegada.promesa;
    });
    vi.stubGlobal("fetch", red);
    const pedido = google.traerRecursoDeGoogle(direccion());
    const cancelado = expect(pedido).rejects.toMatchObject({ name: "AbortError" });
    await vi.waitFor(() => expect(red).toHaveBeenCalledOnce());

    google.bloquearConsultasDeGoogleAlSalir();
    await google.borrarTodasLasImagenesDeGoogle();
    await cancelado;
    expect(senalesDeRed[0]?.aborted).toBe(true);
    const escribir = vi.spyOn(deposito, "escribirEnElDeposito");
    llegada.resolver(respuesta());
    // Una lectura cruza la cola de persistencia y deja correr la continuación
    // de la respuesta tardía antes de comprobar el resultado duradero.
    await google.leerImagenDeGoogle(15, 4, 7);

    expect(escribir).not.toHaveBeenCalled();
    expect(await imagenesPersistidas()).toEqual([]);
    await expect(google.traerRecursoDeGoogle(direccion())).rejects.toMatchObject({ name: "AbortError" });
    expect(red).toHaveBeenCalledOnce();
  });

  it("una lectura local que termina después del bloqueo no vuelve a alimentar la memoria", async () => {
    const lectura = diferido<unknown>();
    const leer = vi.spyOn(deposito, "leerDelDeposito")
      .mockImplementationOnce(<T>() => lectura.promesa as Promise<T>);
    const red = simularRed();
    const pedido = google.traerRecursoDeGoogle(direccion());
    const cancelado = expect(pedido).rejects.toMatchObject({ name: "AbortError" });
    await vi.waitFor(() => expect(leer).toHaveBeenCalledOnce());

    google.bloquearConsultasDeGoogleAlSalir();
    await google.borrarTodasLasImagenesDeGoogle();
    lectura.resolver({
      bytes: new Uint8Array([1]), venceEn: Date.now() + 60_000,
      variante: "satellite/es-AR/AR/256/v1", permisoHttp: 1,
    });
    await cancelado;
    await google.leerImagenDeGoogle(15, 4, 7);

    await expect(google.traerRecursoDeGoogle(direccion())).rejects.toMatchObject({ name: "AbortError" });
    expect(red).not.toHaveBeenCalled();
    expect(await imagenesPersistidas()).toEqual([]);
  });

  it("el borrado espera una escritura ya iniciada y elimina también esa imagen", async () => {
    const permisoDeEscritura = diferido<void>();
    const escrituraReal = deposito.escribirEnElDeposito;
    const escribir = vi.spyOn(deposito, "escribirEnElDeposito")
      .mockImplementationOnce(async (...argumentos) => {
        await permisoDeEscritura.promesa;
        return escrituraReal(...argumentos);
      });
    const red = simularRed();
    await google.traerRecursoDeGoogle(direccion());
    await vi.waitFor(() => expect(escribir).toHaveBeenCalledOnce());

    google.bloquearConsultasDeGoogleAlSalir();
    const limpieza = google.borrarTodasLasImagenesDeGoogle();
    permisoDeEscritura.resolver();
    await limpieza;

    expect(await imagenesPersistidas()).toEqual([]);
    await expect(google.traerRecursoDeGoogle(direccion())).rejects.toMatchObject({ name: "AbortError" });
    expect(red).toHaveBeenCalledOnce();
  });

  it("un documento nuevo permite consultar sin que un clear reactive el documento anterior", async () => {
    const red = simularRed();
    const documentoAnterior = google;
    google.bloquearConsultasDeGoogleAlSalir();
    await google.borrarTodasLasImagenesDeGoogle();
    await expect(documentoAnterior.traerRecursoDeGoogle(direccion())).rejects.toMatchObject({ name: "AbortError" });

    deposito.cerrarElDeposito();
    vi.resetModules();
    google = await import("@/lib/mapas/google-guardado");
    deposito = await import("@/lib/offline/deposito");
    const recurso = await google.traerRecursoDeGoogle(direccion());

    expect(new Uint8Array(recurso.data)).toEqual(new Uint8Array([9, 8, 7]));
    expect(red).toHaveBeenCalledOnce();
    await vi.waitFor(async () => expect(await imagenesPersistidas()).toEqual(["15/4/7"]));
    await expect(documentoAnterior.traerRecursoDeGoogle(direccion())).rejects.toMatchObject({ name: "AbortError" });
  });
});
