// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { MapaDeMarcas } from "@/components/marcas/mapa-de-marcas";
import type { Anotacion, Sector, Zona } from "@/types/database";
import type { ComponentProps } from "react";
import type { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";

let mapa: ComponentProps<typeof CargadorDeMapa>;

vi.mock("@/lib/vibracion", () => ({ vibrarAlTocar: () => {} }));
vi.mock("@/components/mapa/cargador-de-mapa", () => ({
  CargadorDeMapa: (propiedades: ComponentProps<typeof CargadorDeMapa>) => {
    mapa = propiedades;
    const { rectangulos = [], anotaciones = [], alSenalarZona, fichaSobreElMapa, alturaExtendida } = propiedades;
    return (
    <div data-clases={rectangulos.map((cada) => cada.clase).join(",")} data-puntos={anotaciones.length} data-altura-extendida={alturaExtendida}>
      <button onClick={() => alSenalarZona?.(1)}>Señalar zona</button>
      {fichaSobreElMapa}
    </div>
    );
  },
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("mapa de las marcas", () => {
  it("elige un punto sobre Google sin abrir fichas y conserva la vista exacta del toque", async () => {
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    const elegir = vi.fn();
    const vista = { lon: -64.8, lat: -31.4, zoom: 15.7 };
    try {
      await act(async () => raiz.render(<MapaDeMarcas zonas={[]} anotaciones={[]} actividad="trekking"
        sectoresPorZona={{}} alElegirPunto={elegir} />));
      expect(mapa.consultaGoogle).toBe(true);
      expect(mapa.enVivo).toBe(true);
      expect(mapa.chequeoDeDescarga).toBe(false);
      expect(mapa.marcandoPunto).toBe(true);
      expect(mapa.mostrarFichaAnotacion).toBe(false);
      expect(mapa.fichaSobreElMapa).toBeNull();
      await act(async () => mapa.alMarcarPunto?.(-64.82, -31.42, vista));
      expect(elegir).toHaveBeenCalledWith(-64.82, -31.42, vista);
    } finally { act(() => raiz.unmount()); }
  });

  it("en Consultas lee Simple y Satelital de lo bajado, con los tres fondos", async () => {
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    try {
      await act(async () => raiz.render(
        <MapaDeMarcas zonas={[]} anotaciones={[]} actividad="trekking" sectoresPorZona={{}} chequeoDeDescarga />,
      ));
      expect(mapa.consultaGoogle).toBe(true);
      expect(mapa.chequeoDeDescarga).toBe(true);
      expect(mapa.enVivo).toBe(false);
    } finally { act(() => raiz.unmount()); }
  });

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
    const alEditarDetalle = vi.fn();
    const puedeEditarDetalle = vi.fn(() => true);
    try {
      await act(async () => raiz.render(
        <MapaDeMarcas zonas={[zona]} anotaciones={[punto]} actividad="trekking" sectoresPorZona={{ 1: 4 }}
          alEditarDetalle={alEditarDetalle} puedeEditarDetalle={puedeEditarDetalle} />,
      ));
      expect(contenedor.querySelector("[data-clases]")?.getAttribute("data-clases")).toBe("zona_general");
      expect(contenedor.querySelector("[data-puntos]")?.getAttribute("data-puntos")).toBe("1");
      expect(contenedor.querySelector("[data-altura-extendida]")?.getAttribute("data-altura-extendida")).toBe("true");
      expect(mapa.alCambiarAnotacion).toBe(alEditarDetalle);
      expect(mapa.puedeCambiarAnotacion).toBe(puedeEditarDetalle);
      await act(async () => {
        ([...contenedor.querySelectorAll("button")].find((boton) => boton.textContent === "Señalar zona") as HTMLButtonElement).click();
      });
      expect(contenedor.textContent).toContain("Zona de prueba");
      expect(contenedor.textContent).toContain("4 sectores");
      expect(contenedor.querySelector('a[href="/zonas/1"]')?.textContent).toContain("Abrir");
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
        <MapaDeMarcas zonas={[zona]} anotaciones={[]} actividad="trekking" sectoresPorZona={{ 1: 4 }} />,
      ));
      await act(async () => ([...contenedor.querySelectorAll("button")].find((boton) => boton.textContent === "Señalar zona") as HTMLButtonElement).click());
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

      await act(async () => ([...contenedor.querySelectorAll("button")].find((boton) => boton.textContent === "Señalar zona") as HTMLButtonElement).click());
      const toqueAfuera = new Event("pointerdown", { bubbles: true });
      Object.defineProperty(toqueAfuera, "pointerType", { value: "touch" });
      await act(async () => document.body.dispatchEvent(toqueAfuera));
      expect(contenedor.querySelector("[data-ficha-zona]")).toBeNull();
    } finally {
      act(() => raiz.unmount());
    }
  });

  it("esconde las líneas o suma las de los sectores", async () => {
    const zona = {
      id: 1,
      nombre: "Zona de prueba",
      rectangulo: { latNorte: -31, latSur: -32, lonOeste: -65, lonEste: -64 },
    } as Zona;
    const sector = { id: 3, zonaId: 1, nombre: "A1 - Cumbre", rectangulo: zona.rectangulo } as Sector;
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    try {
      await act(async () => raiz.render(
        <MapaDeMarcas zonas={[zona]} sectores={[sector]} lineas="nada" anotaciones={[]} actividad="trekking" sectoresPorZona={{}} />,
      ));
      expect(contenedor.querySelector("[data-clases]")?.getAttribute("data-clases")).toBe("");
      await act(async () => raiz.render(
        <MapaDeMarcas zonas={[zona]} sectores={[sector]} lineas="zonas_y_sectores" anotaciones={[]} actividad="trekking" sectoresPorZona={{}} />,
      ));
      expect(contenedor.querySelector("[data-clases]")?.getAttribute("data-clases")).toBe("zona_general,sector");
    } finally {
      act(() => raiz.unmount());
    }
  });
});
