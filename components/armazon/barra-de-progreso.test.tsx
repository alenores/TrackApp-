// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { ProveedorDeBarraDeProgreso } from "@/components/armazon/barra-de-progreso";

const estado = vi.hoisted(() => ({ pantalla: "/mapas" }));
vi.mock("next/navigation", () => ({
  usePathname: () => estado.pantalla,
  useRouter: () => ({ push: () => {}, back: () => {} }),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function dibujo() {
  // Un link pelado a propósito: la barra escucha los toques sobre cualquier link.
  const link = createElement("a", { href: "/zonas", onClick: (evento: Event) => evento.preventDefault() }, "Zonas");
  return <ProveedorDeBarraDeProgreso>{link}</ProveedorDeBarraDeProgreso>;
}

function barraPrendida(contenedor: HTMLElement): boolean {
  return contenedor.querySelector("[aria-hidden]")?.getAttribute("aria-hidden") === "false";
}

describe("barra de progreso", () => {
  it("se prende al tocar un link y se apaga al llegar", async () => {
    estado.pantalla = "/mapas";
    window.history.replaceState(null, "", "/mapas");
    const contenedor = document.createElement("div");
    document.body.appendChild(contenedor);
    const raiz = createRoot(contenedor);
    try {
      await act(async () => raiz.render(dibujo()));
      await act(async () => contenedor.querySelector("a")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })));
      expect(barraPrendida(contenedor)).toBe(true);

      estado.pantalla = "/zonas";
      await act(async () => raiz.render(dibujo()));
      expect(barraPrendida(contenedor)).toBe(false);
    } finally {
      act(() => raiz.unmount());
      contenedor.remove();
    }
  });

  it("no se prende sola al volver a la pantalla de la que se salió (pasó de Zonas a Mapas)", async () => {
    estado.pantalla = "/mapas";
    window.history.replaceState(null, "", "/mapas");
    const contenedor = document.createElement("div");
    document.body.appendChild(contenedor);
    const raiz = createRoot(contenedor);
    try {
      await act(async () => raiz.render(dibujo()));
      await act(async () => contenedor.querySelector("a")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })));
      estado.pantalla = "/zonas";
      await act(async () => raiz.render(dibujo()));
      // La flecha de volver no es un link: no prende la barra, y nada sale a internet.
      estado.pantalla = "/mapas";
      await act(async () => raiz.render(dibujo()));
      expect(barraPrendida(contenedor)).toBe(false);
    } finally {
      act(() => raiz.unmount());
      contenedor.remove();
    }
  });
});
