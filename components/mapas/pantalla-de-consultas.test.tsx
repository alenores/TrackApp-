// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { PantallaDeConsultas } from "@/components/mapas/pantalla-de-consultas";

vi.mock("@/hooks/use-hay-senal", () => ({ useHaySenal: () => true }));
vi.mock("@/hooks/use-datos-de-la-app", () => ({
  useDatosDeLaApp: () => ({
    paquete: {
      zonas: [{ id: 1, nombre: "Gigantes Este", rectangulo: { latNorte: -31, latSur: -32, lonOeste: -65, lonEste: -64 } }],
      sectores: [],
      anotaciones: [],
      caminos: [{ id: 2, nombre: "Subida al Mogote" }],
    },
    estado: "listo",
    aviso: null,
  }),
}));
vi.mock("@/hooks/use-caminos-guardados", () => ({
  useCaminosGuardados: () => ({ caminos: [], error: null, cargando: false }),
}));
vi.mock("@/lib/vibracion", () => ({ vibrarAlTocar: () => {} }));
vi.mock("@/components/marcas/mapa-de-marcas", () => ({ MapaDeMarcas: () => <div /> }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ back: () => {}, push: () => {} }) }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (consulta: string) => ({
    matches: true,
    media: consulta,
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
});

function vaDespues(anterior: Node, siguiente: Node): boolean {
  return (anterior.compareDocumentPosition(siguiente) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
}

describe("Consultas: líneas adentro de Zonas y resultados bajo el buscador", () => {
  it("no deja los circulitos sueltos y pone los resultados justo debajo del cuadro", async () => {
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    try {
      await act(async () => raiz.render(<PantallaDeConsultas />));

      expect(contenedor.textContent).toContain("Solo las zonas");
      expect(contenedor.textContent).toContain("Zonas y sectores");
      expect(contenedor.textContent).not.toContain("Nada");

      const lineas = Array.from(contenedor.querySelectorAll("legend")).find((cada) => cada.textContent === "Qué líneas");
      const mostrar = Array.from(contenedor.querySelectorAll("p")).find((cada) => cada.textContent === "Mostrar");
      expect(lineas).toBeTruthy();
      expect(mostrar).toBeTruthy();
      expect(vaDespues(mostrar!, lineas!)).toBe(true);

      const cuadro = contenedor.querySelector('input[type="search"]') as HTMLInputElement;
      await act(async () => {
        const poner = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
        poner?.call(cuadro, "gig");
        cuadro.dispatchEvent(new Event("input", { bubbles: true }));
      });

      const resultados = Array.from(contenedor.querySelectorAll("p")).find((cada) => cada.textContent === "Resultados");
      const lista = contenedor.querySelector('[aria-label="Resultados de la búsqueda"]');
      expect(resultados).toBeTruthy();
      expect(lista?.textContent).toContain("Gigantes Este");
      expect(lista?.parentElement?.className).toContain("rounded-xl");
      expect(vaDespues(cuadro, resultados!)).toBe(true);
      expect(vaDespues(resultados!, mostrar!)).toBe(true);
    } finally {
      act(() => raiz.unmount());
    }
  });

  it("destildar Zonas apaga la elección de líneas", async () => {
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    try {
      await act(async () => raiz.render(<PantallaDeConsultas />));
      const casilla = contenedor.querySelector('[aria-label="Mostrar Zonas"]') as HTMLButtonElement;
      await act(async () => casilla.click());
      expect(contenedor.textContent).not.toContain("Qué líneas");
      expect(contenedor.textContent).not.toContain("Solo las zonas");
    } finally {
      act(() => raiz.unmount());
    }
  });
});
