// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { ProveedorDeQuienSoy, type QuienSoy } from "@/components/armazon/quien-soy";
import { useSeleccionDelMapa } from "./use-seleccion-del-mapa";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
it("cada consulta empieza por la principal del perfil aunque haya preferencias anteriores y no guarda la elección", async () => {
  localStorage.setItem("seleccion-de-actividades-del-mapa", JSON.stringify({ visibles: ["kayak"], principal: "kayak" }));
  localStorage.setItem("filtros-de-marcas", JSON.stringify({ actividad: "trekking" }));
  localStorage.setItem("actividad-principal-del-mapa", "correr");
  const antes = JSON.stringify(localStorage);
  const quienSoy: QuienSoy = { miPerfilId: "yo", miCategoria: "normal", misActividades: ["mountain_bike", "trekking"], miActividadPrincipal: "mountain_bike" };
  const contenedor = document.createElement("div");
  let raiz = createRoot(contenedor);
  function Consulta() {
    const [seleccion, elegir] = useSeleccionDelMapa();
    return <button onClick={() => elegir({ visibles: ["trekking"], principal: "trekking" })}>{JSON.stringify(seleccion)}</button>;
  }
  try {
    await act(async () => raiz.render(<ProveedorDeQuienSoy quienSoy={quienSoy}><Consulta /></ProveedorDeQuienSoy>));
    expect(contenedor.textContent).toBe(JSON.stringify({ visibles: ["mountain_bike"], principal: "mountain_bike" }));
    await act(async () => contenedor.querySelector("button")!.click());
    expect(contenedor.textContent).toContain("trekking");
    expect(JSON.stringify(localStorage)).toBe(antes);
    await act(async () => raiz.unmount());
    raiz = createRoot(contenedor);
    await act(async () => raiz.render(<ProveedorDeQuienSoy quienSoy={quienSoy}><Consulta /></ProveedorDeQuienSoy>));
    expect(contenedor.textContent).toBe(JSON.stringify({ visibles: ["mountain_bike"], principal: "mountain_bike" }));
  } finally {
    await act(async () => raiz.unmount());
    localStorage.clear();
  }
});
