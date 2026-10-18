// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BotonDelGps, CartelDeFallaDelGps } from "@/components/navegacion/aviso-del-gps";
import type { Gps } from "@/hooks/use-gps";
import { olvidarCierresConEscape } from "@/lib/emergentes/tecla-escape";
import { olvidarLaEntradaDeSobra } from "@/lib/emergentes/historial";

vi.mock("@/lib/vibracion", () => ({ vibrarAlTocar: () => {} }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function gpsFalso(parcial: Partial<Gps>): Gps {
  return {
    estado: "no_disponible",
    error: "El GPS tardó demasiado en dar la primera posición. Quedate quieto a cielo abierto unos segundos: sigue buscando solo.",
    posicion: null,
    precision: null,
    altura: null,
    prender: () => {},
    segundosSinNoticias: 0,
    posicionVieja: false,
    cartelAbierto: false,
    mostrarElCartel: () => {},
    ocultarElCartel: () => {},
    ...parcial,
  };
}

describe("el aviso del GPS en el mapa", () => {
  let contenedor: HTMLDivElement;
  let raiz: ReturnType<typeof createRoot>;

  beforeEach(() => {
    olvidarCierresConEscape();
    olvidarLaEntradaDeSobra();
    window.history.replaceState({}, "");
    contenedor = document.createElement("div");
    document.body.appendChild(contenedor);
    raiz = createRoot(contenedor);
  });

  afterEach(async () => {
    await act(async () => raiz.unmount());
    contenedor.remove();
  });

  it("si tarda, la mira está y el cartel no", async () => {
    await act(async () => {
      raiz.render(<><BotonDelGps gps={gpsFalso({})} alCentrar={() => {}} /><CartelDeFallaDelGps gps={gpsFalso({})} /></>);
    });

    expect(contenedor.querySelector("[aria-label='El GPS no anda']")).not.toBeNull();
    expect(contenedor.textContent).not.toContain("tardó demasiado");
  });

  it("sin permiso, el cartel está y se puede cerrar", async () => {
    const ocultar = vi.fn();
    const gps = gpsFalso({
      estado: "sin_permiso",
      error: "La app no tiene permiso para usar el GPS. Entrá a los ajustes del navegador, buscá los permisos de esta página y activá la ubicación. Después salí y volvé a entrar a esta pantalla.",
      cartelAbierto: true,
      ocultarElCartel: ocultar,
    });

    await act(async () => {
      raiz.render(<CartelDeFallaDelGps gps={gps} />);
    });

    expect(contenedor.textContent).toContain("no tiene permiso");
    contenedor.querySelector<HTMLButtonElement>("[aria-label='Cerrar el aviso del GPS']")?.click();
    expect(ocultar).toHaveBeenCalledOnce();
  });

  it("tocar la mira roja pide el cartel", async () => {
    const mostrar = vi.fn();
    await act(async () => {
      raiz.render(<BotonDelGps gps={gpsFalso({ mostrarElCartel: mostrar })} alCentrar={() => {}} />);
    });

    contenedor.querySelector<HTMLButtonElement>("[aria-label='El GPS no anda']")?.click();
    expect(mostrar).toHaveBeenCalledOnce();
  });
});
