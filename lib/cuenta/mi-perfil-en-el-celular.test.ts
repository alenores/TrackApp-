// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  anotarMiPerfil,
  categoriaGuardada,
  miPerfilGuardado,
  mirarMiPerfil,
  olvidarMiPerfil,
} from "@/lib/cuenta/mi-perfil-en-el-celular";

afterEach(() => {
  olvidarMiPerfil();
  localStorage.clear();
});

describe("categoría disponible durante la navegación sin internet", () => {
  it("avisa en la misma pestaña cuando se guarda el perfil", () => {
    const cambio = vi.fn();
    const dejarDeMirar = mirarMiPerfil(cambio);
    try {
      expect(categoriaGuardada()).toBeNull();
      anotarMiPerfil("usuario-1", "premium");
      expect(miPerfilGuardado()).toBe("usuario-1");
      expect(categoriaGuardada()).toBe("premium");
      expect(cambio).toHaveBeenCalledOnce();
    } finally {
      dejarDeMirar();
    }
  });

  it("una categoría vieja desconocida no habilita escribir", () => {
    localStorage.setItem("trackapp-mi-categoria", "amigos");
    expect(categoriaGuardada()).toBeNull();
  });
});
