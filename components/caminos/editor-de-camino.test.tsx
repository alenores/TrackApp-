// @vitest-environment jsdom
import { act, type ComponentProps } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { EditorDeCamino } from "@/components/caminos/editor-de-camino";
import type { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import type { CaminoGuardado } from "@/lib/caminos/datos";

let mapa: ComponentProps<typeof CargadorDeMapa>;

const camino: CaminoGuardado = {
  id: 7,
  perfilId: "yo",
  nombre: "Camino de prueba",
  descripcion: null,
  actividades: ["trekking"],
  coordenadas: [[-64.8, -31.4], [-64.81, -31.41], [-64.82, -31.42]],
  partes: [{
    desdeM: 0,
    hastaM: 1000,
    porActividad: { trekking: { paso: "por_explorar", complejidad: null } },
    observacion: null,
    comprobadoEl: null,
  }],
  largoM: 1000,
  alturas: null,
  versionForma: 1,
  creadoEn: "2026-01-01T00:00:00Z",
  actualizadoEn: "2026-01-01T00:00:00Z",
  eliminadoEn: null,
};

vi.mock("@/app/actions/caminos", () => ({
  leerCamino: async () => ({ ok: true as const, datos: camino }),
  cambiarActividadesDelCamino: async () => ({ ok: false as const, error: "no" }),
  cambiarDatosDeParteDelCamino: async () => ({ ok: false as const, error: "no" }),
  cambiarNombreDelCamino: async () => ({ ok: false as const, error: "no" }),
  clasificarParteDelCamino: async () => ({ ok: false as const, error: "no" }),
  corregirLineaDelCamino: async () => ({ ok: false as const, error: "no" }),
  partirEntreEnElCamino: async () => ({ ok: false as const, error: "no" }),
  quitarParteDelCamino: async () => ({ ok: false as const, error: "no" }),
  retirarCamino: async () => ({ ok: false as const, error: "no" }),
}));
vi.mock("@/lib/datos/una-vez-por-apertura", () => ({
  unaVezPorApertura: (_clave: string, pedir: () => Promise<unknown>) => pedir(),
}));
vi.mock("@/lib/offline/puesta-al-dia", () => ({
  ponerAlDiaDespuesDeGuardar: async () => ({ clase: "ok" }),
}));
vi.mock("@/lib/vibracion", () => ({ vibrarAlTocar: () => {} }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ back: () => {}, push: () => {} }) }));
vi.mock("@/components/mapa/cargador-de-mapa", () => ({
  CargadorDeMapa: (propiedades: ComponentProps<typeof CargadorDeMapa>) => {
    mapa = propiedades;
    return <div data-mapa />;
  },
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("editar un Camino desde Marcas", () => {
  it("abre en satelital y conserva el centro y el zoom que se estaban mirando", async () => {
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    const alVolver = vi.fn();
    const vistaInicial = { lon: -64.805, lat: -31.405, zoom: 15.4 };
    try {
      await act(async () => raiz.render(
        <EditorDeCamino id={7} alVolver={alVolver} vistaInicial={vistaInicial} />,
      ));
      expect(mapa.fondoInicial).toBe("satelital");
      expect(mapa.vista).toBe(vistaInicial);
      expect(mapa.encuadre).toBeNull();

      const ultimaVista = { lon: -64.81, lat: -31.41, zoom: 16 };
      await act(async () => mapa.alMoverVista?.(ultimaVista));
      await act(async () => contenedor.querySelector<HTMLButtonElement>('[aria-label="Volver"]')!.click());
      expect(alVolver).toHaveBeenCalledWith(ultimaVista);
    } finally {
      act(() => raiz.unmount());
    }
  });

  it("sin vista previa encuadra el Camino entero", async () => {
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    try {
      await act(async () => raiz.render(<EditorDeCamino id={7} alVolver={() => {}} />));
      expect(mapa.fondoInicial).toBe("satelital");
      expect(mapa.vista).toBeNull();
      expect(mapa.encuadre).toEqual({
        latNorte: -31.4,
        latSur: -31.42,
        lonOeste: -64.82,
        lonEste: -64.8,
      });
    } finally {
      act(() => raiz.unmount());
    }
  });
});
