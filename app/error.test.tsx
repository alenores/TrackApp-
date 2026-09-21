// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PantallaRota from "@/app/error";

/**
 * La red de rescate frente a una actualización de la app.
 *
 * Pasó el 2026-09-21: con cinco versiones publicadas en el medio, el celular
 * de Ale abrió la navegación de una ruta y vio «Esta pantalla se rompió». No
 * había nada roto: pedía un archivo de la versión anterior. Esto prueba que
 * ese caso se recarga solo, una vez, y que no queda en un bucle.
 */

const COMO_LO_VIO_ALE = Object.assign(
  new Error(
    "Loading chunk 7417 failed. (error: https://track-app-hazel.vercel.app/_next/static/chunks/app/(app)/navegacion/%5Bid%5D/page-eae3ca16ec287d7b.js)",
  ),
  { name: "ChunkLoadError" },
);

const OTRA_FALLA = new TypeError("x is not a function");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let contenedor: HTMLDivElement;
let raiz: Root;
const recargar = vi.fn();

function dibujar(error: Error) {
  act(() => {
    raiz.render(<PantallaRota error={error} reset={() => {}} />);
  });
}

beforeEach(() => {
  contenedor = document.createElement("div");
  document.body.appendChild(contenedor);
  raiz = createRoot(contenedor);
  recargar.mockClear();
  vi.stubGlobal("location", { ...window.location, reload: recargar });
  window.sessionStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  act(() => raiz.unmount());
  contenedor.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("cuando la app se actualizó mientras estaba abierta", () => {
  it("no muestra «se rompió»: avisa que hay versión nueva y recarga sola", () => {
    dibujar(COMO_LO_VIO_ALE);
    expect(contenedor.textContent).toContain("versión nueva");
    expect(contenedor.textContent).not.toContain("se rompió");
    expect(recargar).toHaveBeenCalledTimes(1);
  });

  it("si acaba de recargar por lo mismo, muestra el cartel y no recarga otra vez sola", () => {
    dibujar(COMO_LO_VIO_ALE);
    act(() => raiz.unmount());
    raiz = createRoot(contenedor);
    recargar.mockClear();

    dibujar(COMO_LO_VIO_ALE);
    expect(contenedor.textContent).toContain("se rompió");
    expect(recargar).not.toHaveBeenCalled();
  });

  it("en ese caso, «Probar de nuevo» recarga la página entera", () => {
    dibujar(COMO_LO_VIO_ALE);
    act(() => raiz.unmount());
    raiz = createRoot(contenedor);
    recargar.mockClear();
    dibujar(COMO_LO_VIO_ALE);

    const boton = Array.from(contenedor.querySelectorAll("button")).find((cada) =>
      cada.textContent?.includes("Probar de nuevo"),
    );
    act(() => boton?.click());
    expect(recargar).toHaveBeenCalledTimes(1);
  });
});

describe("cualquier otra falla", () => {
  it("muestra el cartel con el motivo y no recarga nada", () => {
    dibujar(OTRA_FALLA);
    expect(contenedor.textContent).toContain("se rompió");
    expect(contenedor.textContent).toContain("x is not a function");
    expect(recargar).not.toHaveBeenCalled();
  });
});
