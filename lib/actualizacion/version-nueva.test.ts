import { describe, expect, it } from "vitest";
import {
  convieneRecargarPorVersionNueva,
  cuandoRecargarPorVersionNueva,
  esLaPantallaDeNavegar,
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

describe("cuándo recargar al llegar la versión nueva", () => {
  it("nunca en la primera instalación: no hay nada viejo abierto", () => {
    expect(
      cuandoRecargarPorVersionNueva({ habiaVersionAntes: false, visible: false, navegando: false }),
    ).toBe("nunca");
  });

  it("nunca navegando una ruta, aunque la app esté en segundo plano", () => {
    expect(
      cuandoRecargarPorVersionNueva({ habiaVersionAntes: true, visible: false, navegando: true }),
    ).toBe("nunca");
  });

  it("con la pantalla a la vista, se espera a que se esconda", () => {
    expect(
      cuandoRecargarPorVersionNueva({ habiaVersionAntes: true, visible: true, navegando: false }),
    ).toBe("cuando-se-esconda");
  });

  it("ya en segundo plano, ahora mismo", () => {
    expect(
      cuandoRecargarPorVersionNueva({ habiaVersionAntes: true, visible: false, navegando: false }),
    ).toBe("ahora");
  });

  it("reconoce la pantalla de navegar por su dirección", () => {
    expect(esLaPantallaDeNavegar("/navegacion/12")).toBe(true);
    expect(esLaPantallaDeNavegar("/mapa-libre")).toBe(true);
    expect(esLaPantallaDeNavegar("/mapas")).toBe(false);
    expect(esLaPantallaDeNavegar("/rutas/12")).toBe(false);
    expect(esLaPantallaDeNavegar("/")).toBe(false);
  });
});
