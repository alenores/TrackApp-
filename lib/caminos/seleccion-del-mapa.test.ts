import { describe, expect, it } from "vitest";
import { alternarActividadDelMapa, comparteActividad, leerSeleccionDelMapa } from "./seleccion-del-mapa";

describe("actividades visibles y principal independientes", () => {
  it("incluye Caminos de cualquiera de las elegidas, sin exigir la principal", () => {
    expect(comparteActividad(["mountain_bike"], ["trekking", "mountain_bike"])).toBe(true);
    expect(comparteActividad(["kayak"], ["trekking", "mountain_bike"])).toBe(false);
    expect(comparteActividad(["trekking", "correr"], ["trekking", "mountain_bike"])).toBe(true);
  });
  it("conserva una principal visible y permite volver a cero", () => {
    const dos = alternarActividadDelMapa({ visibles: ["trekking"], principal: "trekking" }, "mountain_bike");
    expect(dos.principal).toBe("trekking");
    const una = alternarActividadDelMapa(dos, "trekking");
    expect(una).toEqual({ visibles: ["mountain_bike"], principal: "mountain_bike" });
    expect(alternarActividadDelMapa(una, "mountain_bike")).toEqual({ visibles: [], principal: null });
  });
  it("valida la selección y descarta actividades inexistentes", () => {
    expect(leerSeleccionDelMapa({ visibles: ["trekking", "trekking", "inexistente"], principal: "kayak" }))
      .toEqual({ visibles: ["trekking"], principal: "trekking" });
    expect(leerSeleccionDelMapa({ visibles: [], principal: "trekking" })).toEqual({ visibles: [], principal: null });
  });
});
