// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { PantallaDeMapas } from "@/components/mapas/pantalla-de-mapas";

const estado = vi.hoisted(() => ({ senal: true }));
vi.mock("@/hooks/use-hay-senal", () => ({ useHaySenal: () => estado.senal }));
vi.mock("@/hooks/use-datos-de-la-app", () => ({ useDatosDeLaApp: () => ({ paquete: { zonas: [], sectores: [] }, estado: "listo", aviso: null }) }));
vi.mock("@/lib/vibracion", () => ({ vibrarAlTocar: () => {} }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

async function dibujar() {
  const contenedor = document.createElement("div");
  const raiz = createRoot(contenedor);
  await act(async () => raiz.render(
    <PantallaDeMapas titulo="Marcas">{() => <p>contenido de Marcas</p>}</PantallaDeMapas>,
  ));
  return { contenedor, raiz };
}

describe("pantallas de Mapas (decisión 052: solo con conexión)", () => {
  it("con señal muestra su contenido", async () => {
    estado.senal = true;
    const { contenedor, raiz } = await dibujar();
    try {
      expect(contenedor.textContent).toContain("contenido de Marcas");
    } finally { act(() => raiz.unmount()); }
  });

  it("sin señal no muestra nada que falle: dice por qué y ofrece Circuitos y navegación libre", async () => {
    estado.senal = false;
    const { contenedor, raiz } = await dibujar();
    try {
      expect(contenedor.textContent).not.toContain("contenido de Marcas");
      expect(contenedor.textContent).toContain("Mapas necesita conexión");
      expect(contenedor.querySelector('a[href="/circuitos"]')).not.toBeNull();
      expect(contenedor.querySelector('a[href="/mapa-libre"]')).not.toBeNull();
    } finally { act(() => raiz.unmount()); }
  });
});
