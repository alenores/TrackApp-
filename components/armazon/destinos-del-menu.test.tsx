import { describe, expect, it } from "vitest";
import { DESTINOS_DEL_MENU, destinoActivo, subdestinoActivo, SUBDESTINOS_DE_MAPAS } from "@/components/armazon/destinos-del-menu";

describe("menú principal", () => {
  it("mantiene el mismo orden y reconoce Salidas como inicio", () => {
    expect(DESTINOS_DEL_MENU.map((item) => item.etiqueta)).toEqual([
      "Salidas", "Circuitos", "Navegación libre", "Mapas", "Perfiles",
    ]);
    expect(destinoActivo("/salidas", "/")).toBe(true);
    expect(destinoActivo("/circuitos", "/")).toBe(false);
  });

  it("Mapas tiene sus cuatro entradas en el orden decidido y desaparece sin señal", () => {
    const mapas = DESTINOS_DEL_MENU.find((item) => item.etiqueta === "Mapas");
    expect(mapas?.necesitaSenal).toBe(true);
    expect(SUBDESTINOS_DE_MAPAS.map((sub) => sub.etiqueta)).toEqual(["Consultas", "Marcas", "Zonas", "Descargas"]);
  });

  it("Mapas queda marcado en su pantalla de tarjetas, en sus cuatro pantallas y en el detalle de una zona", () => {
    const mapas = DESTINOS_DEL_MENU.find((item) => item.etiqueta === "Mapas")!;
    expect(mapas.href).toBe("/mapas");
    for (const direccion of ["/mapas", "/mapas/consultas", "/mapas/marcas", "/zonas", "/zonas/3", "/mapas/descargas"]) {
      expect(destinoActivo(mapas.href, direccion)).toBe(true);
    }
    expect(destinoActivo(mapas.href, "/circuitos")).toBe(false);
    expect(subdestinoActivo(SUBDESTINOS_DE_MAPAS, "/zonas/3")?.etiqueta).toBe("Zonas");
    expect(subdestinoActivo(SUBDESTINOS_DE_MAPAS, "/mapas/marcas")?.etiqueta).toBe("Marcas");
  });
});
