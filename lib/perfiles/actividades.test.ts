import { describe, expect, it } from "vitest";
import { principalDelPerfil, revisarActividadesDelPerfil } from "./actividades";
describe("actividades del perfil", () => {
  it("prioriza la principal y conserva el orden guardado para los perfiles anteriores", () => {
    expect(principalDelPerfil(["kayak", "trekking"], "trekking")).toBe("trekking");
    expect(principalDelPerfil(["kayak", "trekking"], null)).toBe("kayak");
    expect(principalDelPerfil([], null)).toBeNull();
  });
  it("exige al menos una y una principal propia si hay varias", () => {
    expect(revisarActividadesDelPerfil([], null)).toContain("al menos una");
    expect(revisarActividadesDelPerfil(["trekking"], null)).toBeNull();
    expect(revisarActividadesDelPerfil(["trekking", "kayak"], null)).toContain("principal");
    expect(revisarActividadesDelPerfil(["trekking", "kayak"], "correr")).toContain("principal");
    expect(revisarActividadesDelPerfil(["trekking", "kayak"], "kayak")).toBeNull();
    expect(revisarActividadesDelPerfil(["inexistente"], null)).toContain("no existe");
  });
});
