// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  anotarCierreConEscape,
  atenderTeclaEscape,
  olvidarCierresConEscape,
  type TeclaDeEscape,
} from "@/lib/emergentes/tecla-escape";

function tecla(parcial: Partial<TeclaDeEscape> = {}): TeclaDeEscape {
  return {
    key: "Escape",
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...parcial,
  };
}

beforeEach(() => {
  olvidarCierresConEscape();
});

describe("Escape cierra solo lo de adelante", () => {
  it("no hace nada si no hay nada abierto", () => {
    const evento = tecla();
    expect(atenderTeclaEscape(evento)).toBe(false);
    expect(evento.preventDefault).not.toHaveBeenCalled();
  });

  it("con dos cruces abiertas, cierra solo la última", () => {
    const primera = vi.fn();
    const segunda = vi.fn();
    anotarCierreConEscape(primera);
    anotarCierreConEscape(segunda);

    expect(atenderTeclaEscape(tecla())).toBe(true);
    expect(segunda).toHaveBeenCalledOnce();
    expect(primera).not.toHaveBeenCalled();
  });

  it("al cerrarse la de adelante, la siguiente queda lista", () => {
    const primera = vi.fn();
    const soltarSegunda = anotarCierreConEscape(vi.fn());
    anotarCierreConEscape(primera);
    soltarSegunda();

    atenderTeclaEscape(tecla());
    expect(primera).toHaveBeenCalledOnce();
  });

  it("ignora la tecla si se queda apretada o viene con otra tecla", () => {
    const cerrar = vi.fn();
    anotarCierreConEscape(cerrar);

    atenderTeclaEscape(tecla({ repeat: true }));
    atenderTeclaEscape(tecla({ ctrlKey: true }));
    atenderTeclaEscape(tecla({ key: "Enter" }));

    expect(cerrar).not.toHaveBeenCalled();
  });
});
