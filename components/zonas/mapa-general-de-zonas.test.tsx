// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { MapaGeneralDeZonas } from "@/components/zonas/mapa-general-de-zonas";
import type { Anotacion, Zona } from "@/types/database";
import type { RectanguloEnElMapa } from "@/lib/mapas/rectangulos";

vi.mock("@/lib/vibracion", () => ({ vibrarAlTocar: () => {} }));
vi.mock("@/components/mapa/cargador-de-mapa", () => ({
  CargadorDeMapa: ({ rectangulos, anotaciones, alSenalarZona, fichaSobreElMapa, alturaExtendida }: {
    rectangulos: RectanguloEnElMapa[];
    anotaciones: Anotacion[];
    alSenalarZona: (id: number | null) => void;
    fichaSobreElMapa: React.ReactNode;
    alturaExtendida: boolean;
  }) => (
    <div data-clases={rectangulos.map((cada) => cada.clase).join(",")} data-puntos={anotaciones.length} data-altura-extendida={alturaExtendida}>
      <button onClick={() => alSenalarZona(1)}>Señalar zona</button>
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
      expect(contenedor.querySelector("[data-altura-extendida]")?.getAttribute("data-altura-extendida")).toBe("true");
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

  it("cierra la ficha al hacer clic o tocar afuera, pero no al interactuar dentro", async () => {
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
      await act(async () => (contenedor.querySelector("button") as HTMLButtonElement).click());
      expect(contenedor.querySelector("[data-ficha-zona]")).not.toBeNull();
      const ficha = contenedor.querySelector("[data-ficha-zona]") as HTMLElement;
      const adentro = new Event("pointerdown", { bubbles: true });
      Object.defineProperty(adentro, "pointerType", { value: "mouse" });
      await act(async () => ficha.dispatchEvent(adentro));
      expect(contenedor.querySelector("[data-ficha-zona]")).not.toBeNull();
      const afuera = new Event("pointerdown", { bubbles: true });
      Object.defineProperty(afuera, "pointerType", { value: "mouse" });
      await act(async () => document.body.dispatchEvent(afuera));
      expect(contenedor.querySelector("[data-ficha-zona]")).toBeNull();

      await act(async () => (contenedor.querySelector("button") as HTMLButtonElement).click());
      const toqueAfuera = new Event("pointerdown", { bubbles: true });
      Object.defineProperty(toqueAfuera, "pointerType", { value: "touch" });
      await act(async () => document.body.dispatchEvent(toqueAfuera));
      expect(contenedor.querySelector("[data-ficha-zona]")).toBeNull();
    } finally {
      act(() => raiz.unmount());
    }
  });
});
