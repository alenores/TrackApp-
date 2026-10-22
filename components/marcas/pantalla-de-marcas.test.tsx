// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { PantallaDeMarcas } from "@/components/marcas/pantalla-de-marcas";
import type { VistaDelMapa } from "@/lib/mapas/vista";
import { ACTIVIDADES_RUTA, type Rectangulo } from "@/types/database";

let moverVista: ((vista: VistaDelMapa) => void) | undefined;
let ordenDeCamara: { encuadre?: Rectangulo | null; dondeEstaba?: VistaDelMapa | null; viaje?: number };

vi.mock("@/hooks/use-hay-senal", () => ({ useHaySenal: () => true }));
vi.mock("@/hooks/use-datos-de-la-app", () => ({
  useDatosDeLaApp: () => ({
    paquete: {
      zonas: [{ id: 1, nombre: "Gigantes Este", rectangulo: { latNorte: -31, latSur: -32, lonOeste: -65, lonEste: -64 } }],
      sectores: [{ id: 3, zonaId: 1, nombre: "A1", rectangulo: { latNorte: -31, latSur: -32, lonOeste: -65, lonEste: -64 } }],
      anotaciones: [],
      caminos: [{ id: 7, perfilId: "yo", nombre: "Camino de prueba", largoM: 1000, actividades: ACTIVIDADES_RUTA }],
    },
    estado: "listo",
    aviso: null,
  }),
}));
vi.mock("@/hooks/use-caminos-guardados", () => ({
  useCaminosGuardados: () => ({ caminos: [], error: null, cargando: false }),
}));
vi.mock("@/lib/vibracion", () => ({ vibrarAlTocar: () => {} }));
vi.mock("@/components/armazon/quien-soy", () => ({
  useQuienSoy: () => ({ miCategoria: "normal", miPerfilId: "yo" }),
}));
vi.mock("@/components/ui/dialogos", () => ({
  useDialogos: () => ({ confirmar: async () => false, avisar: async () => {} }),
}));
vi.mock("@/components/marcas/mapa-de-marcas", () => ({
  MapaDeMarcas: ({ lineas, sectores, alMoverVista, encuadre, dondeEstaba, viaje }: {
    lineas?: string;
    sectores?: unknown[];
    alMoverVista?: (vista: VistaDelMapa) => void;
    encuadre?: Rectangulo | null;
    dondeEstaba?: VistaDelMapa | null;
    viaje?: number;
  }) => {
    moverVista = alMoverVista;
    ordenDeCamara = { encuadre, dondeEstaba, viaje };
    return <div data-lineas={lineas} data-sectores={sectores?.length ?? 0} />;
  },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ back: () => {}, push: () => {}, refresh: () => {} }) }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (consulta: string) => ({
    matches: true,
    media: consulta,
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
});

function radio(contenedor: HTMLElement, texto: string): HTMLButtonElement {
  const boton = [...contenedor.querySelectorAll('[role="radio"]')].find((cada) => cada.textContent === texto);
  if (!boton) throw new Error(`No está el circulito «${texto}»`);
  return boton as HTMLButtonElement;
}

describe("Marcas: líneas de zonas y sectores", () => {
  it.each([true, false])("cambiar o repetir cualquier actividad conserva la cámara; elegir una marca sigue viajando (pantalla ancha: %s)", async (ancha) => {
    const consulta = vi.spyOn(window, "matchMedia").mockImplementation((media) => ({
      matches: ancha, media, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => true,
    }));
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    const abrirPanel = async () => {
      if (ancha) return;
      await act(async () => contenedor.querySelector<HTMLElement>('[aria-label="Abrir marcas"]')!
        .dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
    };
    const tocarGrupo = async (nombre: string) => {
      const boton = [...contenedor.querySelectorAll<HTMLButtonElement>("button[aria-expanded]")]
        .find((cada) => cada.textContent?.startsWith(nombre));
      if (!boton) throw new Error(`No está el grupo ${nombre}`);
      await act(async () => boton.click());
    };
    try {
      await act(async () => raiz.render(<PantallaDeMarcas />));
      await abrirPanel();
      await tocarGrupo("Zonas");
      const mostrarZona = contenedor.querySelector<HTMLButtonElement>('button[title="Mostrar en el mapa"]');
      expect(mostrarZona?.textContent).toContain("Gigantes Este");
      await act(async () => mostrarZona!.click());
      const encuadreElegido = ordenDeCamara.encuadre;
      const viajeElegido = ordenDeCamara.viaje;
      expect(encuadreElegido).toEqual({ latNorte: -31, latSur: -32, lonOeste: -65, lonEste: -64 });
      await act(async () => moverVista?.({ lat: -31.4, lon: -64.8, zoom: 14.3 }));
      await abrirPanel();
      await tocarGrupo("Caminos");
      for (const actividad of ["Todas", "Trekking", "Correr", "Mountain bike", "Kayak", "Canyoning", "Todas"]) {
        for (let vez = 0; vez < 2; vez++) {
          await act(async () => radio(contenedor, actividad).click());
          expect(ordenDeCamara.encuadre).toBe(encuadreElegido);
          expect(ordenDeCamara.viaje).toBe(viajeElegido);
          expect(ordenDeCamara.dondeEstaba).toBeNull();
          expect(radio(contenedor, actividad).getAttribute("aria-checked")).toBe("true");
        }
      }
      if (!ancha) await tocarGrupo("Zonas");
      const volverAMostrarZona = [...contenedor.querySelectorAll<HTMLButtonElement>('button[title="Mostrar en el mapa"]')]
        .find((cada) => cada.textContent?.includes("Gigantes Este"));
      await act(async () => volverAMostrarZona!.click());
      expect(ordenDeCamara.viaje).toBe(viajeElegido! + 1);
      expect(ordenDeCamara.encuadre).toEqual(encuadreElegido);
    } finally {
      act(() => raiz.unmount());
      consulta.mockRestore();
    }
  });

  it.each([true, false])("abre Google Maps desde fuera del mapa con el último centro (pantalla ancha: %s)", async (ancha) => {
    const consulta = vi.spyOn(window, "matchMedia").mockImplementation((media) => ({
      matches: ancha, media, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => true,
    }));
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    try {
      await act(async () => raiz.render(<PantallaDeMarcas />));
      expect(contenedor.querySelector('a[aria-label="Abrir esta zona en Google Maps"]')).toBeNull();
      expect(contenedor.querySelector('button[aria-label="Google Maps: esperando que abra el mapa"]')?.hasAttribute("disabled")).toBe(true);
      for (const vista of [
        { lat: -31.4, lon: -64.8, zoom: 12 },
        { lat: -32.1, lon: -65.2, zoom: 14.3 },
      ]) {
        await act(async () => moverVista?.(vista));
        const enlace = contenedor.querySelector('a[aria-label="Abrir esta zona en Google Maps"]') as HTMLAnchorElement;
        expect(enlace).not.toBeNull();
        const direccion = new URL(enlace.href);
        expect(direccion.hostname).toBe("www.google.com");
        expect(direccion.searchParams.get("map_action")).toBe("map");
        expect(direccion.searchParams.get("center")).toBe(`${vista.lat},${vista.lon}`);
        expect(direccion.searchParams.get("zoom")).toBe(String(Math.round(vista.zoom)));
        expect(enlace.target).toBe("_blank");
        expect(enlace.rel).toContain("noopener");
        expect(enlace.parentElement?.contains(contenedor.querySelector("[data-lineas]"))).toBe(false);
        expect(contenedor.textContent).not.toContain(String(vista.lat));
        expect(contenedor.textContent).not.toContain(String(vista.lon));
      }
    } finally {
      act(() => raiz.unmount());
      consulta.mockRestore();
    }
  });

  it("al abrir muestra las zonas tildadas y deja elegir nada o sumar sectores", async () => {
    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);
    try {
      await act(async () => raiz.render(<PantallaDeMarcas />));
      expect(contenedor.querySelector("[data-lineas]")?.getAttribute("data-lineas")).toBe("zonas");
      expect(radio(contenedor, "Nada")).toBeTruthy();
      expect(radio(contenedor, "Zonas")).toBeTruthy();
      expect(radio(contenedor, "Zonas y sectores")).toBeTruthy();

      await act(async () => radio(contenedor, "Nada").click());
      expect(contenedor.querySelector("[data-lineas]")?.getAttribute("data-lineas")).toBe("nada");

      await act(async () => radio(contenedor, "Zonas y sectores").click());
      expect(contenedor.querySelector("[data-lineas]")?.getAttribute("data-lineas")).toBe("zonas_y_sectores");
      expect(contenedor.querySelector("[data-sectores]")?.getAttribute("data-sectores")).toBe("1");
    } finally {
      act(() => raiz.unmount());
    }
  });
});
