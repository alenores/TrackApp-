import { describe, expect, it } from "vitest";
import { DESTINOS_DEL_MENU, destinoActivo } from "@/components/armazon/destinos-del-menu";

describe("menú principal", () => {
  it("mantiene el mismo orden y reconoce Salidas como inicio", () => {
    expect(DESTINOS_DEL_MENU.map((item) => item.etiqueta)).toEqual([
      "Salidas", "Circuitos", "Navegación libre", "Mapas", "Perfiles",
    ]);
    expect(destinoActivo("/salidas", "/")).toBe(true);
    expect(destinoActivo("/circuitos", "/")).toBe(false);
  });
});
