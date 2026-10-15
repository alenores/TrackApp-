import { describe, expect, it } from "vitest";
import { rectangulosDeLineas } from "@/lib/mapas/lineas-del-territorio";
import type { Sector, Zona } from "@/types/database";

const ZONA: Zona = {
  id: 1,
  perfilId: "a",
  nombre: "Champaquí",
  descripcion: null,
  rectangulo: { latNorte: -31, latSur: -32, lonOeste: -65, lonEste: -64 },
  creadoEn: "",
  actualizadoEn: "",
};

const SECTOR: Sector = {
  id: 7,
  zonaId: 1,
  perfilId: "a",
  nombre: "A1 - Cumbre",
  descripcion: null,
  rectangulo: { latNorte: -31.2, latSur: -31.4, lonOeste: -64.8, lonEste: -64.6 },
  creadoEn: "",
  actualizadoEn: "",
};

const AJENO: Sector = { ...SECTOR, id: 8, zonaId: 99, nombre: "B2 - Otra" };

describe("líneas del territorio", () => {
  it("empieza sin líneas", () => {
    expect(rectangulosDeLineas([ZONA], [SECTOR], "nada")).toEqual([]);
  });

  it("con zonas dibuja solo su perímetro y su nombre", () => {
    const lineas = rectangulosDeLineas([ZONA], [SECTOR], "zonas");
    expect(lineas.map((cada) => cada.clase)).toEqual(["zona_general"]);
    expect(lineas[0]?.etiqueta).toBe("Champaquí");
  });

  it("con sectores los pone encima, y solo los de esas zonas", () => {
    const lineas = rectangulosDeLineas([ZONA], [SECTOR, AJENO], "zonas_y_sectores");
    expect(lineas.map((cada) => cada.clase)).toEqual(["zona_general", "sector"]);
    expect(lineas[1]?.etiqueta).toBe("A1");
  });

  it("sin zonas no dibuja sectores sueltos", () => {
    expect(rectangulosDeLineas([], [SECTOR], "zonas_y_sectores")).toEqual([]);
  });
});
