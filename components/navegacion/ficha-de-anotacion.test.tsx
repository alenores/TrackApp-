// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FichaDeAnotacion } from "@/components/navegacion/ficha-de-anotacion";
import type { AnotacionEnPantalla } from "@/lib/anotaciones/en-pantalla";

vi.mock("@/components/ui/emergente", () => ({
  Emergente: ({ abierto, titulo, children, acciones }: {
    abierto: boolean;
    titulo: string;
    children: React.ReactNode;
    acciones?: React.ReactNode;
  }) => abierto ? <section aria-label={titulo}>{children}{acciones}</section> : null,
  BotonDeEmergente: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));
vi.mock("@/hooks/use-foto-del-celular", () => ({
  useFotoDelCelular: (direccion: string | null) => direccion ? { paso: "no_esta" } : { paso: "no_tiene" },
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const anotacion = {
  id: 7,
  sectorId: null,
  perfilId: "perfil",
  deAdministrador: true,
  tipo: "punto",
  origen: "manual",
  icono: "refugio",
  color: null,
  comentario: "Agua a la sombra",
  fotoUrl: "https://fotos.test/refugio.webp",
  fotoChicaUrl: "https://fotos.test/refugio-chica.webp",
  geometria: { type: "Point", coordinates: [-64, -31] },
  marcadaEn: "2026-10-01T00:00:00.000Z",
  precisionGpsMetros: null,
  creadoEn: "2026-10-01T00:00:00.000Z",
  actualizadoEn: "2026-10-01T00:00:00.000Z",
  subida: null,
  codigoDeLaMarca: null,
} as AnotacionEnPantalla;

function montar(props: Partial<React.ComponentProps<typeof FichaDeAnotacion>> = {}) {
  const contenedor = document.createElement("div");
  const raiz = createRoot(contenedor);
  act(() => raiz.render(
    <FichaDeAnotacion anotacion={anotacion} alCerrar={() => {}} miPerfilId={null} {...props} />,
  ));
  return { contenedor, desmontar: () => act(() => raiz.unmount()) };
}

afterEach(() => vi.clearAllMocks());

describe("ficha de anotación en mapas", () => {
  it("muestra el nombre y el comentario, y abre la foto remota solo cuando se habilita", () => {
    const { contenedor, desmontar } = montar({ fotoRemotaAlFaltar: true });
    try {
      expect(contenedor.querySelector("section")?.getAttribute("aria-label")).toBe("Refugio");
      expect(contenedor.textContent).toContain("Agua a la sombra");
      expect(contenedor.querySelector("img")?.getAttribute("src")).toBe("https://fotos.test/refugio.webp");
    } finally {
      desmontar();
    }
  });

  it("conserva el aviso de foto local cuando no se habilita la copia remota", () => {
    const { contenedor, desmontar } = montar();
    try {
      expect(contenedor.querySelector("img")).toBeNull();
      expect(contenedor.textContent).toContain("no está en el celular");
    } finally {
      desmontar();
    }
  });

  it("avisa si la foto remota no se puede abrir", () => {
    const { contenedor, desmontar } = montar({ fotoRemotaAlFaltar: true });
    try {
      act(() => contenedor.querySelector("img")?.dispatchEvent(new Event("error")));
      expect(contenedor.querySelector('[role="alert"]')?.textContent).toContain("Revisá la conexión");
      expect(contenedor.textContent).toContain("Volver a intentar");
    } finally {
      desmontar();
    }
  });
});
