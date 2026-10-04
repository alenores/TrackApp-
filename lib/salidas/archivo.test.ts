import { describe, expect, it } from "vitest";
import { nombreParaBajar } from "@/lib/salidas/archivo";

describe("nombreParaBajar", () => {
  it("usa el título de la salida y la extensión del archivo guardado", () => {
    expect(
      nombreParaBajar("San Cle con Diegote", "https://base.test/archivos-ruta/ale/salida-1.gpx?v=123"),
    ).toBe("San Cle con Diegote.gpx");
    expect(nombreParaBajar("Champaquí", "https://base.test/x/salida-2.kml")).toBe("Champaquí.kml");
  });

  it("saca lo que un nombre de archivo no admite", () => {
    expect(nombreParaBajar('Ida/vuelta: "cerro"', "https://base.test/x/salida-3.gpx")).toBe(
      "Ida vuelta cerro.gpx",
    );
  });
});
