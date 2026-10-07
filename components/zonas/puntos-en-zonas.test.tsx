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
vi.mock("@/components/zonas/mapa-general-de-zonas", () => ({ MapaGeneralDeZonas: () => null }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
describe("pestaña de anotaciones en Mapas (antes «Puntos»)", () => {
  it.each([
    ["administrador", true], ["administrador", false],
    ["premium", true], ["premium", false],
    ["normal", true], ["normal", false],
  ] as const)("categoría %s y señal %s: visible para consultar", async (categoria, senal) => {
    estado.senal = senal;
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    try {
      await act(async () => raiz.render(<PantallaDeZonas categoria={categoria} miPerfilId="usuario" />));
      expect(Boolean(contenedor.querySelector('#pestana-anotaciones'))).toBe(true);
    } finally { act(() => raiz.unmount()); }
  });
});
