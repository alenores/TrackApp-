// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AvisoDeMapaFaltante } from "@/components/mapa/aviso-de-mapa-faltante";
import { olvidarCierresConEscape } from "@/lib/emergentes/tecla-escape";
import { olvidarLaEntradaDeSobra } from "@/lib/emergentes/historial";

vi.mock("@/lib/vibracion", () => ({ vibrarAlTocar: () => {} }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const TEXTO = "Hay 0,4 km de este Circuito sin mapa. Por ese tramo vas a ver la línea y tu punto, pero sin fondo.";

describe("el aviso de mapa faltante", () => {
  let contenedor: HTMLDivElement;
  let raiz: ReturnType<typeof createRoot>;

  beforeEach(() => {
    olvidarCierresConEscape();
    olvidarLaEntradaDeSobra();
    window.history.replaceState({}, "");
    contenedor = document.createElement("div");
    document.body.appendChild(contenedor);
    raiz = createRoot(contenedor);
  });

  afterEach(async () => {
    await act(async () => raiz.unmount());
    contenedor.remove();
  });

  async function dibujar() {
    await act(async () => {
      raiz.render(<AvisoDeMapaFaltante texto={TEXTO} />);
    });
  }

  function boton() {
    return contenedor.querySelector<HTMLButtonElement>("[aria-label='Ver el aviso del mapa']");
  }

  it("muestra el círculo y esconde el texto", async () => {
    await dibujar();

    expect(boton()?.textContent).toBe("!");
    expect(contenedor.textContent).not.toContain("0,4 km");
  });

  it("el texto aparece al tocar el círculo y se va al tocarlo de nuevo", async () => {
    await dibujar();

    await act(async () => { boton()?.click(); });
    expect(contenedor.textContent).toContain("0,4 km");

    await act(async () => { boton()?.click(); });
    expect(contenedor.textContent).not.toContain("0,4 km");
  });

  it("tocar afuera cierra el cartel", async () => {
    await dibujar();
    await act(async () => { boton()?.click(); });

    await act(async () => {
      document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    });

    expect(contenedor.textContent).not.toContain("0,4 km");
  });

  it("Escape cierra el cartel", async () => {
    await dibujar();
    await act(async () => { boton()?.click(); });

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });

    expect(contenedor.textContent).not.toContain("0,4 km");
  });
});
