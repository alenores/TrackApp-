// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { AvisoCompactoDeMapas } from "@/components/rutas/aviso-compacto-de-mapas";
import type { CircuitoSinMapa, MapaPerdido } from "@/lib/mapas/lo-que-falta";

vi.mock("@/components/rutas/aviso-de-mapas-que-faltan", () => ({
  AvisoDeMapasQueFaltan: () => <p>detalle de los mapas que faltan</p>,
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const perdido = { sector: { id: 1, nombre: "A1" } } as unknown as MapaPerdido;
const sinMapa = { circuito: { id: 2, nombre: "Vuelta" }, sectores: [] } as unknown as CircuitoSinMapa;

describe("aviso compacto de mapas en Circuitos", () => {
  it("muestra solo una franja con cuántos avisos hay, y el detalle recién al tocarla", async () => {
    const contenedor = document.createElement("div");
    document.body.appendChild(contenedor);
    const raiz = createRoot(contenedor);
    try {
      await act(async () => raiz.render(<AvisoCompactoDeMapas perdidos={[perdido, perdido]} circuitos={[sinMapa]} aviso={null} />));
      expect(contenedor.textContent).toContain("2 mapas que tenías ya no están · 1 Circuito sin mapa");
      expect(document.body.textContent).not.toContain("detalle de los mapas que faltan");
      await act(async () => (contenedor.querySelector("button") as HTMLButtonElement).click());
      expect(document.body.textContent).toContain("detalle de los mapas que faltan");
    } finally {
      act(() => raiz.unmount());
      contenedor.remove();
    }
  });

  it("sin nada que avisar no ocupa lugar", async () => {
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    try {
      await act(async () => raiz.render(<AvisoCompactoDeMapas perdidos={[]} circuitos={[]} aviso={null} />));
      expect(contenedor.innerHTML).toBe("");
    } finally { act(() => raiz.unmount()); }
  });
});
