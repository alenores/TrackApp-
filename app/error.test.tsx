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
 * había nada roto: pedía un archivo de la versión anterior.
 *
 * Y pasó el 2026-09-24 en el mapa libre: la recarga no alcanzaba, porque esa
 * pantalla se abre siempre desde lo guardado en el celular, que era de la
 * versión vieja. Ahora se le pregunta a internet por la pieza: si no existe,
 * se tiran las pantallas guardadas y se recarga. **Si no contesta —el cerro,
 * sin señal— no se tira nada**, porque es lo único que deja navegar.
 */

const COMO_LO_VIO_ALE = Object.assign(
  new Error(
    "Loading chunk 5237 failed. (error: https://track-app.vercel.app/_next/static/chunks/5237-fe6b342f49ea7183.js)",
  ),
  { name: "ChunkLoadError" },
);

const OTRA_FALLA = new TypeError("x is not a function");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let contenedor: HTMLDivElement;
let raiz: Root;
const recargar = vi.fn();
const tirarDeposito = vi.fn(async () => true);

function internetContesta(como: number | "nada") {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      if (como === "nada") throw new TypeError("Failed to fetch");
      return { status: como };
    }),
  );
}

async function dibujar(error: Error) {
  await act(async () => {
    raiz.render(<PantallaRota error={error} reset={() => {}} />);
  });
  // La consulta a internet y lo que sigue.
  await act(async () => {
    await new Promise((listo) => setTimeout(listo, 0));
  });
}

async function volverADibujar(error: Error) {
  act(() => raiz.unmount());
  raiz = createRoot(contenedor);
  recargar.mockClear();
  tirarDeposito.mockClear();
  await dibujar(error);
}

beforeEach(() => {
  contenedor = document.createElement("div");
  document.body.appendChild(contenedor);
  raiz = createRoot(contenedor);
  recargar.mockClear();
  tirarDeposito.mockClear();
  vi.stubGlobal("location", { ...window.location, reload: recargar });
  vi.stubGlobal("caches", { delete: tirarDeposito });
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
  it("con señal y la pieza ya no existe: tira las pantallas guardadas y recarga sola", async () => {
    internetContesta(404);
    await dibujar(COMO_LO_VIO_ALE);

    expect(contenedor.textContent).toContain("versión nueva");
    expect(contenedor.textContent).not.toContain("se rompió");
    expect(tirarDeposito).toHaveBeenCalled();
    expect(recargar).toHaveBeenCalledTimes(1);
  });

  it("sin señal no tira nada: lo guardado es lo único que deja navegar en el cerro", async () => {
    internetContesta("nada");
    await dibujar(COMO_LO_VIO_ALE);

    expect(tirarDeposito).not.toHaveBeenCalled();
    expect(recargar).not.toHaveBeenCalled();
    expect(contenedor.textContent).toContain("no hay señal");
  });

  it("si la pieza existe fue un corte pasajero: recarga sin tirar nada", async () => {
    internetContesta(200);
    await dibujar(COMO_LO_VIO_ALE);

    expect(tirarDeposito).not.toHaveBeenCalled();
    expect(recargar).toHaveBeenCalledTimes(1);
  });

  it("si acaba de recargar por lo mismo, muestra el cartel y no recarga otra vez sola", async () => {
    internetContesta(404);
    await dibujar(COMO_LO_VIO_ALE);
    await volverADibujar(COMO_LO_VIO_ALE);

    expect(contenedor.textContent).toContain("se rompió");
    expect(recargar).not.toHaveBeenCalled();
  });

  it("en ese caso, «Probar de nuevo» tira las pantallas guardadas y recarga", async () => {
    internetContesta(404);
    await dibujar(COMO_LO_VIO_ALE);
    await volverADibujar(COMO_LO_VIO_ALE);

    const boton = Array.from(contenedor.querySelectorAll("button")).find((cada) =>
      cada.textContent?.includes("Probar de nuevo"),
    );
    await act(async () => {
      boton?.click();
      await new Promise((listo) => setTimeout(listo, 0));
    });
    expect(tirarDeposito).toHaveBeenCalled();
    expect(recargar).toHaveBeenCalledTimes(1);
  });
});

describe("el cartel dice todo lo que se sabe", () => {
  it("muestra los datos para arreglarlo, con la pieza y lo que contestó internet", async () => {
    internetContesta("nada");
    await dibujar(COMO_LO_VIO_ALE);

    const texto = contenedor.textContent ?? "";
    expect(texto).toContain("Datos para arreglarlo");
    expect(texto).toContain("5237-fe6b342f49ea7183.js");
    expect(texto).toContain("no contestó");
    expect(texto).toContain("Versión de la app");
    expect(texto).toContain("Copiar los datos");
  });
});

describe("cualquier otra falla", () => {
  it("muestra el cartel con el motivo y los datos, y no recarga nada", async () => {
    await dibujar(OTRA_FALLA);
    expect(contenedor.textContent).toContain("se rompió");
    expect(contenedor.textContent).toContain("x is not a function");
    expect(contenedor.textContent).toContain("Datos para arreglarlo");
    expect(recargar).not.toHaveBeenCalled();
  });
});
