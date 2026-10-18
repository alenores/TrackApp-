// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { InicioDeSalidas } from "@/components/salidas/inicio-de-salidas";
import type { EstadoDeLaSenal } from "@/lib/conexion";

const estado = vi.hoisted(() => ({
  senal: "pensando" as EstadoDeLaSenal,
  reemplazar: vi.fn(),
}));
vi.mock("@/hooks/use-hay-senal", () => ({ useEstadoDeLaSenal: () => estado.senal }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: estado.reemplazar }) }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

async function dibujar() {
  const contenedor = document.createElement("div");
  const raiz = createRoot(contenedor);
  await act(async () => raiz.render(<InicioDeSalidas />));
  return { contenedor, raiz };
}

describe("entrada de la app", () => {
  it("mientras piensa no ofrece accesos ni abre otra pantalla", async () => {
    estado.senal = "pensando";
    estado.reemplazar.mockClear();
    const { contenedor, raiz } = await dibujar();
    try {
      expect(contenedor.textContent).not.toContain("Salidas necesita conexión");
      expect(contenedor.querySelector("a")).toBeNull();
      expect(contenedor.querySelector('[role="status"]')?.getAttribute("aria-label")).toBe("Abriendo la app");
      expect(estado.reemplazar).not.toHaveBeenCalled();
    } finally {
      await act(async () => raiz.unmount());
    }
  });

  it("sin señal abre Circuitos", async () => {
    estado.senal = "no_hay";
    estado.reemplazar.mockClear();
    const { contenedor, raiz } = await dibujar();
    try {
      expect(contenedor.querySelector("a")).toBeNull();
      expect(estado.reemplazar).toHaveBeenCalledExactlyOnceWith("/circuitos");
    } finally {
      await act(async () => raiz.unmount());
    }
  });

  it("con señal abre Salidas", async () => {
    estado.senal = "hay";
    estado.reemplazar.mockClear();
    const { raiz } = await dibujar();
    try {
      expect(estado.reemplazar).toHaveBeenCalledExactlyOnceWith("/salidas");
    } finally {
      await act(async () => raiz.unmount());
    }
  });
});
