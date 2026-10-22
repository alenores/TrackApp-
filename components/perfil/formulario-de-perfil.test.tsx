// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { FormularioDePerfil } from "./formulario-de-perfil";
const guardar = vi.hoisted(() => vi.fn(async () => ({ success: true, emailConfirmationRequired: false })));
vi.mock("@/app/actions/perfil", () => ({ editarPerfil: guardar }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/hooks/use-foto", () => ({ useFoto: () => ({ archivo: null, quitar: vi.fn() }) }));
vi.mock("@/components/fotos/selector-de-foto", () => ({ SelectorDeFoto: () => null }));
vi.mock("@/components/ui/menu-de-acciones", () => ({ MenuDeAcciones: ({ acciones }: { acciones: { alElegir: () => void }[] }) => <button onClick={acciones[0].alElegir}>Editar</button> }));
vi.mock("@/lib/vibracion", () => ({ vibrarAlTocar: () => {} }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
it("elegir no guarda: con varias exige principal y guarda ambas al confirmar", async () => {
  guardar.mockClear();
  const contenedor=document.createElement("div"), raiz=createRoot(contenedor);
  const tocar=async (texto:string) => { await act(async () => [...contenedor.querySelectorAll<HTMLButtonElement>("button")].find(b=>b.textContent===texto)!.click()); };
  const enviar=async () => { await act(async () => { contenedor.querySelector("form")!.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true})); }); };
  try {
    await act(async()=>raiz.render(<FormularioDePerfil initialNombre="Ale" displayNombre="Ale" email="ale@example.com" actividades={["trekking"]} actividadPrincipal="trekking" />));
    await tocar("Editar");
    await tocar("Kayak");
    expect(guardar).not.toHaveBeenCalled();
    await enviar();
    expect(contenedor.querySelector('[role="alert"]')?.textContent).toContain("principal");
    expect(guardar).not.toHaveBeenCalled();
    await act(async()=>contenedor.querySelector<HTMLButtonElement>('[role="radio"]:last-child')!.click());
    await enviar();
    expect(guardar).toHaveBeenCalledWith(expect.objectContaining({actividades:["trekking","kayak"],actividadPrincipal:"kayak"}));
    expect(contenedor.textContent).toContain("Perfil actualizado");
  } finally { await act(async()=>raiz.unmount()); }
});
