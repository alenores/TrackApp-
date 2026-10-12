// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { InicioDeSalidas } from "@/components/salidas/inicio-de-salidas";

const estado = vi.hoisted(() => ({ senal: false, reemplazar: vi.fn() }));
vi.mock("@/hooks/use-hay-senal", () => ({ useHaySenal: () => estado.senal }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: estado.reemplazar }) }));
vi.mock("@/lib/vibracion", () => ({ vibrarAlTocar: () => {} }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("inicio de Salidas", () => {
  it("sin señal conserva accesos a las navegaciones sin abrir Salidas", async () => {
    estado.senal = false;
    estado.reemplazar.mockClear();
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    try {
      await act(async () => raiz.render(<InicioDeSalidas />));
      expect(contenedor.textContent).toContain("Salidas necesita conexión");
      expect(contenedor.querySelector('a[href="/circuitos"]')).not.toBeNull();
      expect(contenedor.querySelector('a[href="/mapa-libre"]')).not.toBeNull();
      expect(estado.reemplazar).not.toHaveBeenCalled();
      estado.senal = true;
      await act(async () => raiz.render(<InicioDeSalidas />));
      expect(estado.reemplazar).toHaveBeenCalledWith("/salidas");
    } finally {
      await act(async () => raiz.unmount());
    }
  });
});
