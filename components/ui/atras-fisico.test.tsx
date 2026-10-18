// @vitest-environment jsdom
import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ListaYMapa } from "@/components/ui/lista-y-mapa";
import { Emergente } from "@/components/ui/emergente";
import { ProveedorDeDialogos, useDialogos } from "@/components/ui/dialogos";
import { olvidarLaEntradaDeSobra } from "@/lib/emergentes/historial";
import { olvidarCierresConEscape } from "@/lib/emergentes/tecla-escape";

vi.mock("@/lib/vibracion", () => ({ vibrarAlTocar: () => {} }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: () => {}, push: () => {} }),
}));
vi.mock("@/hooks/use-pantalla-ancha", () => ({
  usePantallaAncha: () => false,
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Lo que hace el botón físico de atrás: vuelve una entrada del historial. */
async function apretarAtras() {
  await act(async () => {
    const cuandoVuelva = new Promise<void>((resolver) => {
      const listo = () => {
        window.removeEventListener("popstate", listo);
        resolver();
      };
      window.addEventListener("popstate", listo);
    });
    window.history.back();
    await cuandoVuelva;
  });
}

function PedirConfirmacion({ alResponder }: { alResponder: (acepto: boolean) => void }) {
  const { confirmar } = useDialogos();
  return (
    <button
      type="button"
      onClick={() => {
        void confirmar({ titulo: "¿Borrar esto?", textoDeAceptar: "Borrar", destructivo: true }).then(alResponder);
      }}
    >
      Borrar
    </button>
  );
}

beforeEach(() => {
  olvidarLaEntradaDeSobra();
  olvidarCierresConEscape();
  window.history.replaceState({}, "");
});

describe("el atrás del celular cierra igual que la cruz", () => {
  let contenedor: HTMLDivElement;
  let raiz: ReturnType<typeof createRoot>;

  beforeEach(() => {
    contenedor = document.createElement("div");
    document.body.appendChild(contenedor);
    raiz = createRoot(contenedor);
  });

  afterEach(async () => {
    await act(async () => raiz.unmount());
    contenedor.remove();
  });

  it("un modal se cierra", async () => {
    const cerrar = vi.fn();
    await act(async () => raiz.render(
      <Emergente abierto alCerrar={cerrar} titulo="Ficha">
        <p>Datos</p>
      </Emergente>,
    ));

    await apretarAtras();

    expect(cerrar).toHaveBeenCalledOnce();
  });

  it("una confirmación se cancela y no se acepta", async () => {
    const alResponder = vi.fn();
    await act(async () => raiz.render(
      <ProveedorDeDialogos>
        <PedirConfirmacion alResponder={alResponder} />
      </ProveedorDeDialogos>,
    ));
    await act(async () => (contenedor.querySelector("button") as HTMLButtonElement).click());
    expect(document.body.textContent).toContain("¿Borrar esto?");

    await apretarAtras();

    expect(alResponder).toHaveBeenCalledOnce();
    expect(alResponder).toHaveBeenCalledWith(false);
    expect(document.body.textContent).not.toContain("¿Borrar esto?");
  });

  it("el panel del celular se baja y no se sale de la pantalla", async () => {
    const alCambiar = vi.fn();
    await act(async () => raiz.render(
      <ListaYMapa
        tituloDelPanel="Marcas"
        resumen="3 marcas"
        panel={<p>La lista</p>}
        mapa={<p>El mapa</p>}
        abierto
        alCambiarAbierto={alCambiar}
      />,
    ));

    await apretarAtras();

    expect(alCambiar).toHaveBeenCalledOnce();
    expect(alCambiar).toHaveBeenCalledWith(false);
  });

  it("con dos ventanas, el atrás cierra solo la activa", async () => {
    function Dos() {
      const [activa, setActiva] = useState(true);
      const [fondo, setFondo] = useState(true);
      return (
        <>
          {fondo ? <Emergente abierto alCerrar={() => setFondo(false)} titulo="Ventana de atrás"><p>Fondo</p></Emergente> : null}
          {activa ? <Emergente abierto alCerrar={() => setActiva(false)} titulo="Ventana activa"><p>Adelante</p></Emergente> : null}
        </>
      );
    }
    await act(async () => raiz.render(<Dos />));

    await apretarAtras();

    expect(document.body.textContent).toContain("Ventana de atrás");
    expect(document.body.textContent).not.toContain("Ventana activa");

    await apretarAtras();

    expect(document.body.textContent).not.toContain("Ventana de atrás");
  });

  it("con una confirmación encima de un modal, el atrás cierra solo la confirmación", async () => {
    const cerrarModal = vi.fn();
    const alResponder = vi.fn();
    await act(async () => raiz.render(
      <ProveedorDeDialogos>
        <Emergente abierto alCerrar={cerrarModal} titulo="Ficha">
          <PedirConfirmacion alResponder={alResponder} />
        </Emergente>
      </ProveedorDeDialogos>,
    ));
    await act(async () => {
      const botones = [...document.body.querySelectorAll("button")];
      botones.find((boton) => boton.textContent === "Borrar")?.click();
    });
    expect(document.body.textContent).toContain("¿Borrar esto?");

    await apretarAtras();

    expect(alResponder).toHaveBeenCalledWith(false);
    expect(cerrarModal).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain("Ficha");
  });
});
