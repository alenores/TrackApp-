import { describe, expect, it } from "vitest";
import { actividadesVisiblesDesdeTexto } from "@/hooks/use-actividades-visibles";

describe("actividades visibles en la navegación", () => {
  it("sin nada guardado vienen las cinco prendidas", () => {
    expect(actividadesVisiblesDesdeTexto(null)).toEqual([
      "trekking", "correr", "mountain_bike", "kayak", "canyoning",
    ]);
  });

  it("respeta las que se dejaron prendidas y el orden de la app", () => {
    expect(actividadesVisiblesDesdeTexto(JSON.stringify(["kayak", "trekking"]))).toEqual([
      "trekking", "kayak",
    ]);
  });

  it("si el guardado no sirve, vuelven las cinco", () => {
    expect(actividadesVisiblesDesdeTexto("no-es-json")).toEqual([
      "trekking", "correr", "mountain_bike", "kayak", "canyoning",
    ]);
    expect(actividadesVisiblesDesdeTexto("[]")).toEqual([
      "trekking", "correr", "mountain_bike", "kayak", "canyoning",
    ]);
  });
});
