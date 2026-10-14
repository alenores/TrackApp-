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
      expect(document.querySelector('[role="menu"]')).toBeNull();
      await act(async () => (contenedor.querySelector('button[aria-label="Opciones"]') as HTMLButtonElement).click());
      expect(document.querySelectorAll('[role="menuitem"]')).toHaveLength(2);
      await act(async () => (document.querySelector('[role="menuitem"]') as HTMLButtonElement).click());
      expect(editar).toHaveBeenCalledOnce();
      expect(eliminar).not.toHaveBeenCalled();
      expect(document.querySelector('[role="menu"]')).toBeNull();
    } finally {
      await act(async () => raiz.unmount());
    }
  });

  it("dibuja las acciones afuera de la tarjeta, así ningún borde las recorta", async () => {
    const contenedor = document.createElement("div");
    document.body.appendChild(contenedor);
    const raiz = createRoot(contenedor);
    try {
      await act(async () => raiz.render(<MenuDeAcciones acciones={[{ etiqueta: "Editar", alElegir: () => {} }]} />));
      await act(async () => (contenedor.querySelector('button[aria-label="Opciones"]') as HTMLButtonElement).click());
      const abierto = document.querySelector('[role="menu"]') as HTMLElement;
      expect(abierto).not.toBeNull();
      expect(contenedor.contains(abierto)).toBe(false);
      expect(abierto.className).toContain("fixed");
    } finally {
      await act(async () => raiz.unmount());
      contenedor.remove();
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

  it("muestra siempre tres puntos verticales y ningún círculo (decisión de Ale del 2026-10-13)", async () => {
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    try {
      await act(async () => raiz.render(
        <MenuDeAcciones acciones={[{ etiqueta: "Editar", alElegir: () => {} }]} />,
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
