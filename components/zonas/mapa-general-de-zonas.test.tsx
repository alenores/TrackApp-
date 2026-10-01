// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { MapaGeneralDeZonas } from "@/components/zonas/mapa-general-de-zonas";
import type { Anotacion, Zona } from "@/types/database";
import type { RectanguloEnElMapa } from "@/lib/mapas/rectangulos";

vi.mock("@/lib/vibracion", () => ({ vibrarAlTocar: () => {} }));
vi.mock("@/components/mapa/cargador-de-mapa", () => ({
  CargadorDeMapa: ({ rectangulos, anotaciones, alSenalarZona, fichaSobreElMapa }: {
    rectangulos: RectanguloEnElMapa[];
    anotaciones: Anotacion[];
    alSenalarZona: (id: number | null, fijar: boolean) => void;
    fichaSobreElMapa: React.ReactNode;
  }) => (
    <div data-clases={rectangulos.map((cada) => cada.clase).join(",")} data-puntos={anotaciones.length}>
      <button onClick={() => alSenalarZona(1, true)}>Señalar zona</button>
      <button onClick={() => alSenalarZona(1, false)}>Pasar cursor</button>
      <button onClick={() => alSenalarZona(null, false)}>Sacar cursor</button>
      {fichaSobreElMapa}
    </div>
  ),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("mapa general", () => {
  it("muestra solo perímetros de zona, todos los puntos y la ficha que abre su detalle", async () => {
    const zona = {
      id: 1,
      nombre: "Zona de prueba",
      descripcion: "Vista general",
      rectangulo: { latNorte: -31, latSur: -32, lonOeste: -65, lonEste: -64 },
    } as Zona;
    const punto = { id: 5, tipo: "punto" } as Anotacion;
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    try {
      await act(async () => raiz.render(
        <MapaGeneralDeZonas zonas={[zona]} anotaciones={[punto]} sectoresPorZona={{ 1: 4 }} />,
      ));
      expect(contenedor.querySelector("[data-clases]")?.getAttribute("data-clases")).toBe("zona_general");
      expect(contenedor.querySelector("[data-puntos]")?.getAttribute("data-puntos")).toBe("1");
      await act(async () => {
        (contenedor.querySelector("button") as HTMLButtonElement).click();
      });
      expect(contenedor.textContent).toContain("Zona de prueba");
      expect(contenedor.textContent).toContain("4 sectores");
      expect(contenedor.querySelector('a[href="/zonas/1"]')?.textContent).toBe("Ver zona");
    } finally {
      act(() => raiz.unmount());
    }
  });

  it("cierra sola la ficha al sacar el cursor de la zona", async () => {
    vi.useFakeTimers();
    const zona = {
      id: 1,
      nombre: "Zona de prueba",
      descripcion: "Vista general",
      rectangulo: { latNorte: -31, latSur: -32, lonOeste: -65, lonEste: -64 },
    } as Zona;
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    try {
      await act(async () => raiz.render(
        <MapaGeneralDeZonas zonas={[zona]} anotaciones={[]} sectoresPorZona={{ 1: 4 }} />,
      ));
      await act(async () => (contenedor.querySelector("button:nth-of-type(2)") as HTMLButtonElement).click());
      expect(contenedor.querySelector("[data-ficha-zona]")).not.toBeNull();
      await act(async () => (contenedor.querySelector("button:nth-of-type(3)") as HTMLButtonElement).click());
      await act(async () => vi.advanceTimersByTimeAsync(120));
      expect(contenedor.querySelector("[data-ficha-zona]")).toBeNull();
    } finally {
      act(() => raiz.unmount());
      vi.useRealTimers();
    }
  });
});
