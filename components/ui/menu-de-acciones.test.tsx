// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { MenuDeAcciones } from "@/components/ui/menu-de-acciones";

vi.mock("@/lib/vibracion", () => ({ vibrarAlTocar: () => {} }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("menú de acciones", () => {
  it("ofrece editar y eliminar solo después de tocar los tres puntos", async () => {
    const editar = vi.fn();
    const eliminar = vi.fn();
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    try {
      await act(async () => raiz.render(<MenuDeAcciones acciones={[
        { etiqueta: "Editar", alElegir: editar },
        { etiqueta: "Eliminar", destructiva: true, alElegir: eliminar },
      ]} />));
      expect(contenedor.querySelector('[role="menu"]')).toBeNull();
      await act(async () => (contenedor.querySelector('button[aria-label="Opciones"]') as HTMLButtonElement).click());
      expect(contenedor.querySelectorAll('[role="menuitem"]')).toHaveLength(2);
      await act(async () => (contenedor.querySelector('[role="menuitem"]') as HTMLButtonElement).click());
      expect(editar).toHaveBeenCalledOnce();
      expect(eliminar).not.toHaveBeenCalled();
      expect(contenedor.querySelector('[role="menu"]')).toBeNull();
    } finally {
      await act(async () => raiz.unmount());
    }
  });

  it("respeta la esquina que pide la tarjeta", async () => {
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    try {
      await act(async () => raiz.render(
        <MenuDeAcciones className="absolute right-3 top-3 z-10" acciones={[{ etiqueta: "Editar", alElegir: () => {} }]} />,
      ));
      const colocado = contenedor.firstElementChild as HTMLElement;
      expect(colocado.className).toContain("absolute");
      expect(colocado.className).toContain("right-3");
      expect(colocado.className).toContain("top-3");
      expect(colocado.className.split(/\s+/)).not.toContain("relative");
    } finally {
      await act(async () => raiz.unmount());
    }
  });

  it("en la tarjeta muestra tres puntos verticales y ningún círculo", async () => {
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    try {
      await act(async () => raiz.render(
        <MenuDeAcciones soloLosPuntos acciones={[{ etiqueta: "Editar", alElegir: () => {} }]} />,
      ));
      const boton = contenedor.querySelector("button") as HTMLButtonElement;
      expect(boton.className).not.toContain("rounded-full");
      expect(boton.className).not.toContain("border");
      const puntos = [...contenedor.querySelectorAll("circle")];
      expect(puntos).toHaveLength(3);
      expect(new Set(puntos.map((punto) => punto.getAttribute("cx"))).size).toBe(1);
      expect(new Set(puntos.map((punto) => punto.getAttribute("cy"))).size).toBe(3);
    } finally {
      await act(async () => raiz.unmount());
    }
  });
});
