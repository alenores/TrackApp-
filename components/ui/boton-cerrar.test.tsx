// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BotonCerrar } from "@/components/ui/boton-redondo";
import { useCerrarConAtras } from "@/hooks/use-cerrar-con-atras";
import { olvidarCierresConEscape } from "@/lib/emergentes/tecla-escape";
import { olvidarLaEntradaDeSobra } from "@/lib/emergentes/historial";

vi.mock("@/lib/vibracion", () => ({ vibrarAlTocar: () => {} }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function apretarEscape() {
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
}

function Ventana({ cerrar, conCruz = true }: { cerrar: () => void; conCruz?: boolean }) {
  useCerrarConAtras(true, cerrar);
  return conCruz ? <BotonCerrar onClick={cerrar} /> : <p>Sin cruz</p>;
}

beforeEach(() => {
  olvidarCierresConEscape();
  olvidarLaEntradaDeSobra();
  window.history.replaceState({}, "");
});

describe("la cruz se aprieta con Escape", () => {
  let contenedor: HTMLDivElement;
  let raiz: ReturnType<typeof createRoot>;

  beforeEach(() => {
    contenedor = document.createElement("div");
    document.body.appendChild(contenedor);
    raiz = createRoot(contenedor);
  });

  afterEach(async () => {
    await act(async () => raiz.unmount());
    contenedor.remove();
  });

  it("Escape aprieta la cruz", async () => {
    const cerrar = vi.fn();
    await act(async () => raiz.render(<BotonCerrar onClick={cerrar} />));

    await act(async () => apretarEscape());

    expect(cerrar).toHaveBeenCalledOnce();
  });

  it("con dos ventanas, Escape cierra solo la de adelante y una sola vez", async () => {
    const atras = vi.fn();
    const adelante = vi.fn();
    await act(async () => raiz.render(
      <>
        <Ventana cerrar={atras} />
        <Ventana cerrar={adelante} />
      </>,
    ));

    await act(async () => apretarEscape());

    expect(adelante).toHaveBeenCalledOnce();
    expect(atras).not.toHaveBeenCalled();
  });

  it("si la de adelante no tiene cruz, Escape igual la cierra y no toca la de atrás", async () => {
    const atras = vi.fn();
    const menu = vi.fn();
    await act(async () => raiz.render(
      <>
        <Ventana cerrar={atras} />
        <Ventana cerrar={menu} conCruz={false} />
      </>,
    ));

    await act(async () => apretarEscape());

    expect(menu).toHaveBeenCalledOnce();
    expect(atras).not.toHaveBeenCalled();
  });

  it("con la cruz deshabilitada, Escape no cierra lo de atrás", async () => {
    const atras = vi.fn();
    const adelante = vi.fn();
    await act(async () => raiz.render(
      <>
        <BotonCerrar onClick={atras} />
        <BotonCerrar disabled onClick={adelante} />
      </>,
    ));

    await act(async () => apretarEscape());

    expect(adelante).not.toHaveBeenCalled();
    expect(atras).not.toHaveBeenCalled();
  });
});
