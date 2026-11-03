// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { FichaDeCamino } from "@/components/caminos/ficha-de-camino";
import type { CaminoGuardado } from "@/lib/caminos/datos";

vi.mock("@/lib/vibracion", () => ({ vibrarAlTocar: () => {} }));
vi.mock("@/components/ui/emergente", () => ({
  Emergente: ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
    <div>
      <h1>{titulo}</h1>
      {children}
    </div>
  ),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const caminoDeTrekking: CaminoGuardado = {
  id: 7,
  perfilId: "yo",
  nombre: "Sendero Norte",
  descripcion: null,
  actividades: ["trekking"],
  coordenadas: [[-64.8, -31.4], [-64.81, -31.41]],
  partes: [{
    desdeM: 0,
    hastaM: 1000,
    porActividad: { trekking: { paso: "transitable", complejidad: "facil" } },
    observacion: "Pasó bien",
    comprobadoEl: "2026-10-01",
  }],
  largoM: 1000,
  alturas: null,
  versionForma: 1,
  creadoEn: "2026-01-01T00:00:00Z",
  actualizadoEn: "2026-01-01T00:00:00Z",
  eliminadoEn: null,
};

describe("ficha de un Camino", () => {
  it("con otra actividad principal muestra todos los datos y Editar si hay permiso", async () => {
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    const editar = vi.fn();
    try {
      await act(async () => raiz.render(
        <FichaDeCamino
          camino={caminoDeTrekking}
          indice={0}
          actividad="mountain_bike"
          alCerrar={() => {}}
          alEditar={editar}
        />,
      ));
      expect(contenedor.textContent).toContain("Sendero Norte");
      expect(contenedor.textContent).toContain("Largo");
      expect(contenedor.textContent).toContain("Trekking");
      expect(contenedor.textContent).toContain("Pasó bien");
      expect(contenedor.textContent).not.toContain("Se muestra como referencia");
      expect(contenedor.textContent).not.toContain("No está indicado");
      const boton = [...contenedor.querySelectorAll("button")].find((cada) => cada.getAttribute("aria-label") === "Editar");
      expect(boton).toBeTruthy();
      await act(async () => boton?.click());
      expect(editar).toHaveBeenCalledOnce();
    } finally {
      act(() => raiz.unmount());
    }
  });
});
