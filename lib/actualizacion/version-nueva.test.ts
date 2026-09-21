import { describe, expect, it } from "vitest";
import {
  convieneRecargarPorVersionNueva,
  esUnArchivoDeLaAppQueYaNoExiste,
} from "@/lib/actualizacion/version-nueva";

/**
 * Lo que se prueba acá es que una actualización de la app no termine en el
 * cartel de «se rompió» —pasó el 2026-09-21— y que el arreglo no pueda dejar
 * el celular recargando sin parar.
 */

function memoria(): Map<string, string> & Storage {
  const datos = new Map<string, string>();
  return Object.assign(datos, {
    getItem: (clave: string) => datos.get(clave) ?? null,
    setItem: (clave: string, valor: string) => void datos.set(clave, valor),
    removeItem: (clave: string) => void datos.delete(clave),
    clear: () => datos.clear(),
    key: () => null,
    length: 0,
  }) as Map<string, string> & Storage;
}

describe("reconocer un archivo de la app que ya no existe", () => {
  it("por el nombre del error", () => {
    expect(esUnArchivoDeLaAppQueYaNoExiste({ name: "ChunkLoadError", message: "" })).toBe(true);
  });

  it("por el mensaje, como lo vio Ale", () => {
    expect(
      esUnArchivoDeLaAppQueYaNoExiste({
        name: "Error",
        message:
          "Loading chunk 7417 failed. (error: https://track-app-hazel.vercel.app/_next/static/chunks/app/(app)/navegacion/%5Bid%5D/page-eae3ca16ec287d7b.js)",
      }),
    ).toBe(true);
  });

  it("cualquier otra falla no es esto", () => {
    expect(esUnArchivoDeLaAppQueYaNoExiste({ name: "TypeError", message: "x is not a function" })).toBe(false);
    expect(esUnArchivoDeLaAppQueYaNoExiste({})).toBe(false);
  });
});

describe("recargar una sola vez", () => {
  it("la primera vez conviene, y queda anotado", () => {
    const m = memoria();
    expect(convieneRecargarPorVersionNueva(m, 1000)).toBe(true);
    expect(m.size).toBe(1);
  });

  it("si acaba de recargar por lo mismo, no vuelve a recargar", () => {
    const m = memoria();
    convieneRecargarPorVersionNueva(m, 1000);
    expect(convieneRecargarPorVersionNueva(m, 1000 + 5000)).toBe(false);
  });

  it("pasado un rato, vuelve a intentar", () => {
    const m = memoria();
    convieneRecargarPorVersionNueva(m, 1000);
    expect(convieneRecargarPorVersionNueva(m, 1000 + 60 * 1000)).toBe(true);
  });

  it("sin dónde anotar, no recarga: mejor el cartel que un bucle", () => {
    expect(convieneRecargarPorVersionNueva(null)).toBe(false);
    const rota = memoria();
    rota.setItem = () => {
      throw new Error("bloqueado");
    };
    expect(convieneRecargarPorVersionNueva(rota, 1000)).toBe(false);
  });
});
