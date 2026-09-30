// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { PantallaDeZonas } from "@/components/zonas/pantalla-de-zonas";
const estado = vi.hoisted(() => ({ senal: true }));
vi.mock("@/hooks/use-hay-senal", () => ({ useHaySenal: () => estado.senal }));
vi.mock("@/hooks/use-datos-de-la-app", () => ({ useDatosDeLaApp: () => ({ paquete: { zonas: [], sectores: [] }, estado: "listo", aviso: null }) }));
vi.mock("@/lib/vibracion", () => ({ vibrarAlTocar: () => {} }));
vi.mock("@/components/zonas/tarjeta-de-zona", () => ({ TarjetaDeZona: () => null }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
describe("botón de puntos en Zonas", () => {
  it.each([
    [true, true, true], [true, false, false], [false, true, false], [false, false, false],
  ])("administrador %s y señal %s: visible %s", async (administrador, senal, visible) => {
    estado.senal = senal;
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    try {
      await act(async () => raiz.render(<PantallaDeZonas soyAdministrador={administrador} />));
      expect(Boolean(contenedor.querySelector('a[href="/zonas/puntos"]'))).toBe(visible);
    } finally { act(() => raiz.unmount()); }
  });
});
