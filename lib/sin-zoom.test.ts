// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { elGestoLoAtiendeUnaCajaDeAdentro, trabarElZoom } from "@/lib/sin-zoom";

/**
 * Marcar un punto o un trazo abre un formulario más alto que el celular.
 * Tiene que poder bajarse con el dedo. Si se le frena, queda cortado en el
 * borde y no se llega a Guardar. Pasa en la navegación libre y en la de un
 * Circuito, porque es el mismo panel.
 */

describe("el formulario de marcar se desplaza", () => {
  it("sigue el dedo hacia arriba cuando abajo queda formulario", () => {
    expect(
      elGestoLoAtiendeUnaCajaDeAdentro({
        hayContenidoArriba: false,
        hayContenidoAbajo: true,
        dedoHaciaAbajo: false,
        dedoHaciaArriba: true,
      }),
    ).toBe(true);
  });

  it("sigue el dedo hacia abajo cuando arriba queda formulario", () => {
    expect(
      elGestoLoAtiendeUnaCajaDeAdentro({
        hayContenidoArriba: true,
        hayContenidoAbajo: false,
        dedoHaciaAbajo: true,
        dedoHaciaArriba: false,
      }),
    ).toBe(true);
  });

  it("no lo atiende si de ese lado no queda nada: ahí sí se frena el rebote", () => {
    expect(
      elGestoLoAtiendeUnaCajaDeAdentro({
        hayContenidoArriba: false,
        hayContenidoAbajo: true,
        dedoHaciaAbajo: true,
        dedoHaciaArriba: false,
      }),
    ).toBe(false);
    expect(
      elGestoLoAtiendeUnaCajaDeAdentro({
        hayContenidoArriba: true,
        hayContenidoAbajo: false,
        dedoHaciaAbajo: false,
        dedoHaciaArriba: true,
      }),
    ).toBe(false);
  });
});

describe("el dedo sobre el formulario de marcar", () => {
  let soltar: (() => void) | null = null;

  afterEach(() => {
    soltar?.();
    soltar = null;
    document.body.replaceChildren();
  });

  function armar() {
    const pagina = document.createElement("main");
    pagina.className = "app-scroll-pane";
    Object.defineProperty(pagina, "scrollHeight", { value: 100 });
    Object.defineProperty(pagina, "clientHeight", { value: 800 });

    const panel = document.createElement("section");
    panel.style.overflowY = "auto";
    Object.defineProperty(panel, "scrollHeight", { value: 2000 });
    Object.defineProperty(panel, "clientHeight", { value: 400 });
    panel.scrollTop = 0;

    const dibujo = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    panel.append(dibujo);
    pagina.append(panel);
    document.body.append(pagina);
    soltar = trabarElZoom();
    return { panel, dibujo };
  }

  function mover(desde: Element, desdeY: number, hastaY: number) {
    const apoyar = new Event("touchstart", { bubbles: true, cancelable: true });
    Object.defineProperty(apoyar, "touches", { value: [{ clientY: desdeY }] });
    desde.dispatchEvent(apoyar);

    const gesto = new Event("touchmove", { bubbles: true, cancelable: true });
    Object.defineProperty(gesto, "touches", { value: [{ clientY: hastaY }] });
    desde.dispatchEvent(gesto);
    return gesto;
  }

  it("deja bajar el formulario aunque la navegación no se desplace", () => {
    const { dibujo } = armar();
    const gesto = mover(dibujo, 200, 80);
    expect(gesto.defaultPrevented).toBe(false);
  });

  it("frena el tirón hacia abajo cuando el formulario ya está arriba de todo", () => {
    const { panel } = armar();
    const gesto = mover(panel, 80, 200);
    expect(gesto.defaultPrevented).toBe(true);
  });
});
