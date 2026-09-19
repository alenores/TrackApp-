// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const registrados = new Map<string, unknown>();

vi.mock("maplibre-gl", () => ({
  addProtocol: (nombre: string, accion: unknown) => registrados.set(nombre, accion),
  removeProtocol: (nombre: string) => registrados.delete(nombre),
}));

import { guardarTeselas } from "@/lib/mapas/deposito";
import {
  claveDeLaDireccion,
  DIRECCION_DE_LAS_TESELAS,
  olvidarElMapaGuardado,
  PROTOCOLO,
  registrarElMapaGuardado,
  servirTeselaGuardada,
} from "@/lib/mapas/protocolo";

/**
 * Las pruebas del candado.
 *
 * La regla más dura de la app es que navegar no consulta internet **nunca**.
 * Acá se prueba que la única puerta por la que el mapa pide pedazos da al
 * celular y no a la red, y que esa puerta nunca deja al mapa sin respuesta.
 */

beforeEach(() => {
  olvidarElMapaGuardado();
  registrados.clear();
});

describe("leer un pedazo guardado", () => {
  it("devuelve los bytes que están en el celular", async () => {
    await guardarTeselas([{ clave: "7/40/75", bytes: new Uint8Array([4, 5, 6]) }]);

    const servido = await servirTeselaGuardada("guardado://7/40/75");

    expect(new Uint8Array(servido)).toEqual(new Uint8Array([4, 5, 6]));
  });

  it("NO sale a internet, ni siquiera cuando el pedazo no está", async () => {
    const red = vi.fn();
    vi.stubGlobal("fetch", red);

    await servirTeselaGuardada("guardado://9/100/200");

    expect(red).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("un pedazo que no está devuelve vacío, no un error", async () => {
    const servido = await servirTeselaGuardada("guardado://9/100/200");

    expect(servido.byteLength).toBe(0);
  });

  it("una dirección con cualquier cosa adentro tampoco rompe el mapa", async () => {
    for (const rara of [
      "guardado://",
      "guardado://hola",
      "guardado://9/100",
      "guardado://9/100/200/300",
      "cualquiercosa",
    ]) {
      await expect(servirTeselaGuardada(rara)).resolves.toHaveProperty("byteLength", 0);
    }
  });
});

describe("el nombre que viaja en la dirección", () => {
  it("saca el nombre de grilla", () => {
    expect(claveDeLaDireccion("guardado://12/1234/5678")).toBe("12/1234/5678");
  });

  it("no acepta nombres que no son nombres", () => {
    expect(claveDeLaDireccion("guardado://12/1234")).toBeNull();
    expect(claveDeLaDireccion("guardado://a/b/c")).toBeNull();
    expect(claveDeLaDireccion("12/1234/5678")).toBeNull();
  });

  it("la dirección del estilo usa el mismo protocolo que se registra", () => {
    expect(DIRECCION_DE_LAS_TESELAS.startsWith(`${PROTOCOLO}://`)).toBe(true);
  });
});

describe("registrar el protocolo", () => {
  it("queda registrado una sola vez y se puede sacar", () => {
    registrarElMapaGuardado();
    registrarElMapaGuardado();

    expect(registrados.has(PROTOCOLO)).toBe(true);
    expect(registrados.size).toBe(1);

    olvidarElMapaGuardado();
    expect(registrados.has(PROTOCOLO)).toBe(false);
  });
});

describe("entregar el mismo pedazo dos veces", () => {
  it("cada pedido recibe su propia copia", async () => {
    // El mapa se queda con lo que recibe: deja de estar disponible de este
    // lado. Si se entregara el mismo bloque dos veces, el segundo pedido
    // encontraría un bloque vacío y el mapa se rompería entero.
    await guardarTeselas([{ clave: "3/2/5", bytes: new Uint8Array([7, 7]) }]);

    const primero = await servirTeselaGuardada("guardado://3/2/5");
    const segundo = await servirTeselaGuardada("guardado://3/2/5");

    expect(primero).not.toBe(segundo);
    expect(new Uint8Array(primero)).toEqual(new Uint8Array(segundo));
  });

  it("dos pedazos vacíos tampoco comparten el mismo bloque", async () => {
    const uno = await servirTeselaGuardada("guardado://9/1/1");
    const otro = await servirTeselaGuardada("guardado://9/2/2");

    expect(uno).not.toBe(otro);
    expect(uno.byteLength).toBe(0);
  });
});
