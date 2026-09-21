// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { pedirQueNoLoBorren } from "@/lib/offline/permanente";

/**
 * Las pruebas de la protección de lo guardado.
 *
 * **Si esto falla, falla en silencio y completo.** El navegador borra todo lo
 * de la app de una vez —datos, mapas, fotos y pantallas— y el usuario se entera
 * en el cerro, cuando ya no puede hacer nada.
 */

function conAlmacenamiento(storage: unknown) {
  Object.defineProperty(navigator, "storage", {
    value: storage,
    configurable: true,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("pedir que no lo borren", () => {
  it("si ya estaba protegido, no vuelve a pedir", async () => {
    const pedir = vi.fn();
    conAlmacenamiento({ persisted: async () => true, persist: pedir });

    expect(await pedirQueNoLoBorren()).toBe("ya_era");
    expect(pedir).not.toHaveBeenCalled();
  });

  it("lo pide cuando todavía no estaba", async () => {
    conAlmacenamiento({ persisted: async () => false, persist: async () => true });
    expect(await pedirQueNoLoBorren()).toBe("concedido");
  });

  it("dice que se lo negaron, no que salió bien", async () => {
    conAlmacenamiento({ persisted: async () => false, persist: async () => false });
    expect(await pedirQueNoLoBorren()).toBe("negado");
  });

  it("un navegador que no sabe de esto no rompe nada", async () => {
    conAlmacenamiento(undefined);
    expect(await pedirQueNoLoBorren()).toBe("no_se_puede");
  });

  it("si el navegador tira al preguntar, tampoco rompe nada", async () => {
    conAlmacenamiento({
      persisted: async () => {
        throw new Error("modo privado");
      },
      persist: async () => true,
    });
    expect(await pedirQueNoLoBorren()).toBe("no_se_puede");
  });
});
