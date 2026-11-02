// @vitest-environment jsdom
import { act, type ComponentProps } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { EditorDeDetalle, type QueEditar } from "@/components/marcas/editor-de-detalle";
import { DibujarCamino } from "@/components/marcas/dibujar-camino";
import type { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";

let mapa: ComponentProps<typeof CargadorDeMapa>;
const destino = { latNorte: -30, latSur: -31, lonOeste: -65, lonEste: -64 };
vi.mock("@/hooks/use-hay-senal", () => ({ useHaySenal: () => true }));
vi.mock("@/hooks/use-datos-de-la-app", () => ({
  useDatosDeLaApp: () => ({
    paquete: {
      anotaciones: [{
        id: 3, tipo: "punto", icono: "refugio", atencion: false, color: null,
        geometria: { type: "Point", coordinates: [-64.79, -31.39] },
        sectorId: null, perfilId: "otro", deAdministrador: false, origen: "manual",
        titulo: "Refugio viejo", comentario: null, fotoUrl: null, fotoChicaUrl: null,
        marcadaEn: "", precisionGpsMetros: null, creadoEn: "", actualizadoEn: "",
      }],
      zonas: [],
      sectores: [],
      caminos: [{ id: 7, perfilId: "yo", nombre: "Ya marcado", largoM: 500, actividades: ["trekking"] }],
    },
    estado: "listo",
    aviso: null,
  }),
}));
vi.mock("@/hooks/use-caminos-guardados", () => ({
  useCaminosGuardados: () => ({
    caminos: [{
      id: 7, perfilId: "yo", nombre: "Ya marcado", descripcion: null,
      actividades: ["trekking"],
      coordenadas: [[-64.8, -31.4], [-64.81, -31.41]],
      partes: [{
        desdeM: 0, hastaM: 500,
        porActividad: { trekking: { paso: "transitable", complejidad: "facil" } },
        observacion: null, comprobadoEl: null,
      }],
      largoM: 500, alturas: null, versionForma: 1,
      creadoEn: "", actualizadoEn: "", eliminadoEn: null,
    }],
    cargando: false,
  }),
}));
vi.mock("@/hooks/use-foto", () => ({ useFoto: () => ({ estado: "vacio", quitar: () => {} }) }));
vi.mock("@/components/armazon/quien-soy", () => ({
  useQuienSoy: () => ({ misActividades: ["trekking"], miActividadPrincipal: "trekking" }),
}));
vi.mock("@/components/anotaciones/campos-de-anotacion", () => ({ CamposDeAnotacion: () => null }));
vi.mock("@/components/ui/dialogos", () => ({ useDialogos: () => ({ confirmar: async () => false }) }));
vi.mock("@/lib/vibracion", () => ({ vibrarAlTocar: () => {} }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ back: () => {}, push: () => {} }) }));
vi.mock("@/components/marcas/buscador-del-mapa", () => ({
  BuscadorDelMapa: ({ alElegir }: { alElegir: (rectangulo: typeof destino, clase: null) => void }) =>
    <button onClick={() => alElegir(destino, null)}>Buscar otro lugar</button>,
}));
vi.mock("@/components/mapa/cargador-de-mapa", () => ({
  CargadorDeMapa: (propiedades: ComponentProps<typeof CargadorDeMapa>) => {
    mapa = propiedades;
    return <div data-mapa>{propiedades.controlesAdicionales}</div>;
  },
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("abrir el editor desde Marcas", () => {
  it("Camino nuevo abre en satelital, conserva la cámara y muestra las marcas que ya hay", async () => {
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    const vistaInicial = { lon: -64.8, lat: -31.4, zoom: 15.7 };
    try {
      await act(async () => raiz.render(<DibujarCamino alVolver={() => {}} vistaInicial={vistaInicial} />));
      expect(mapa.fondoInicial).toBe("satelital");
      expect(mapa.vista).toBe(vistaInicial);
      expect(mapa.encuadre).toBeNull();
      expect(mapa.caminos?.features.length).toBeGreaterThan(0);
      expect(mapa.anotaciones?.some((cada) => cada.id === 3)).toBe(true);
      expect(mapa.mostrarFichaAnotacion).toBe(false);
      await act(async () => mapa.alMarcarPunto?.(-64.8, -31.4, vistaInicial));
      await act(async () => mapa.alMarcarPunto?.(-64.81, -31.41, vistaInicial));
      const terminar = [...contenedor.querySelectorAll<HTMLButtonElement>("button")]
        .find((cada) => cada.textContent === "Terminé la línea")!;
      await act(async () => terminar.click());
      expect(contenedor.textContent).toContain("Los datos del Camino");
      expect(mapa.vista).toBe(vistaInicial);
      expect(mapa.encuadre).toBeNull();
      expect(mapa.fondoInicial).toBe("satelital");
      expect(mapa.caminos?.features.length).toBeGreaterThan(0);
      expect(contenedor.querySelector("[data-pantalla-fija]")?.children[1].classList.contains("lg:order-1")).toBe(true);
    } finally { act(() => raiz.unmount()); }
  });

  it("editar un punto existente abre en satelital y conserva el lugar de Marcas", async () => {
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    const vistaInicial = { lon: -64.805, lat: -31.405, zoom: 15.2 };
    try {
      await act(async () => raiz.render(
        <EditorDeDetalle que={{ clase: "existente", id: 3 }} alVolver={() => {}} vistaInicial={vistaInicial} />,
      ));
      expect(mapa.fondoInicial).toBe("satelital");
      expect(mapa.vista).toBe(vistaInicial);
      expect(mapa.encuadre).toBeNull();
      expect(mapa.caminos?.features.length).toBeGreaterThan(0);
      expect(mapa.anotaciones?.some((cada) => cada.id === 3)).toBe(true);
    } finally {
      act(() => raiz.unmount());
    }
  });

  it.each(["punto", "trazo"] as const)("abre %s en satelital con las marcas de referencia, conserva la cámara y permite buscar", async (tipo) => {
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    const alVolver = vi.fn();
    const vistaInicial = { lon: -64.8, lat: -31.4, zoom: 15.7 };
    const que: QueEditar = { clase: "nuevo", tipo,
      ...(tipo === "punto" ? { puntoInicial: { lon: -64.812345678, lat: -31.412345678 } } : {}) };
    try {
      await act(async () => raiz.render(<EditorDeDetalle que={que} alVolver={alVolver} vistaInicial={vistaInicial} />));
      expect(mapa.fondoInicial).toBe("satelital");
      expect(mapa.vista).toBe(vistaInicial);
      expect(mapa.encuadre).toBeNull();
      expect(mapa.consultaGoogle).not.toBe(true);
      expect(mapa.caminos?.features.length).toBeGreaterThan(0);
      expect(mapa.anotaciones?.some((cada) => cada.id === 3)).toBe(true);
      expect(mapa.marcandoPunto).toBe(tipo === "trazo");
      if (tipo === "punto") {
        expect(contenedor.querySelector<HTMLInputElement>("#coordenada-de-la-anotacion")?.value)
          .toBe("-31.412345678, -64.812345678");
        expect(mapa.anotaciones?.at(-1)?.geometria).toEqual({
          type: "Point", coordinates: [-64.812345678, -31.412345678],
        });
      }
      const grilla = contenedor.querySelector("[data-pantalla-fija]")!;
      // El orden del celular sigue siendo mapa y datos; PC coloca los datos primero.
      expect(grilla.children[0].classList.contains("lg:order-2")).toBe(true);
      expect(grilla.children[1].classList.contains("lg:order-1")).toBe(true);
      const buscar = [...contenedor.querySelectorAll<HTMLButtonElement>("button")]
        .find((cada) => cada.textContent === "Buscar otro lugar")!;
      await act(async () => buscar.click());
      expect(mapa.vista).toBeNull();
      expect(mapa.encuadre).toBe(destino);
      const ultimaVista = { lat: -30.5, lon: -64.5, zoom: 12.8 };
      await act(async () => mapa.alMoverVista?.(ultimaVista));
      await act(async () => contenedor.querySelector<HTMLButtonElement>('[aria-label="Volver"]')!.click());
      expect(alVolver).toHaveBeenCalledWith(null, ultimaVista);
    } finally {
      act(() => raiz.unmount());
    }
  });
});
