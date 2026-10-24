import { describe, expect, it } from "vitest";
import { TRAZO } from "@/lib/anotaciones/colores-de-trazo";
import {
  candidatasDeOsm,
  firma,
  iconoPorElNombre,
  type RespuestaDeOsm,
} from "@/lib/anotaciones/importar";

/**
 * Que lo que viene de afuera entre como corresponde: con el ícono que uno
 * esperaría, y las tranqueras y alambrados con su forma. Que no se repitan lo
 * prueba `lib/marcas/osm.test.ts`.
 */

describe("adivinar el ícono por el nombre", () => {
  it.each([
    ["Refugio Los Tabaquillos", "refugio"],
    ["Puesto de Irene", "refugio"],
    ["Cerro Champaquí", "cumbre"],
    ["Vado del arroyo", "arroyo"],
    ["Tranquera de la estancia", "tranquera"],
    ["Estacionamiento del Champaquí", "estacionamiento"],
    ["Sitio del Mortero", "sitio"],
    ["Camping La Cumbrecita", "campamento"],
    ["Zona de acampe", "campamento"],
    ["Casa de los Ortiz", "casa"],
    ["Refugio Casa Vieja", "refugio"],
    ["Mirador", "mirador"],
    ["", "cruce"],
    ["Cosa rara", "cruce"],
  ])("«%s» → %s", (nombre, icono) => {
    expect(iconoPorElNombre(nombre)).toBe(icono);
  });
});

describe("la firma de una geometría", () => {
  it("dos puntos a menos de un metro son el mismo; uno más lejos, no", () => {
    expect(firma({ type: "Point", coordinates: [-64.950001, -31.95] }))
      .toBe(firma({ type: "Point", coordinates: [-64.950002, -31.95] }));
    expect(firma({ type: "Point", coordinates: [-64.95, -31.95] }))
      .not.toBe(firma({ type: "Point", coordinates: [-64.9502, -31.95] }));
  });

  it("un punto y una línea nunca firman igual", () => {
    expect(firma({ type: "Point", coordinates: [-64.95, -31.95] }))
      .not.toBe(firma({ type: "LineString", coordinates: [[-64.95, -31.95]] }));
  });
});

describe("desde OpenStreetMap", () => {
  const respuesta: RespuestaDeOsm = {
    elements: [
      { type: "node", lat: -31.95, lon: -64.95, tags: { barrier: "gate" } },
      { type: "node", lat: -31.96, lon: -64.96, tags: { barrier: "gate", name: "La Estancia" } },
      {
        type: "way",
        geometry: [
          { lat: -31.95, lon: -64.95 },
          { lat: -31.94, lon: -64.94 },
        ],
        tags: { barrier: "fence" },
      },
      { type: "node", lat: -31.95, lon: -64.95, tags: { natural: "tree" } },
      { type: "way", geometry: [{ lat: -31.95, lon: -64.95 }], tags: { barrier: "fence" } },
    ],
  };

  it("una tranquera es un punto con su ícono; un alambrado, un trazo color Límite", () => {
    const candidatas = candidatasDeOsm(respuesta).filter((cada) => cada !== null);
    const tranqueras = candidatas.filter((cada) => cada.icono === "tranquera");
    const alambrados = candidatas.filter((cada) => cada.tipo === "trazo");
    expect(tranqueras).toHaveLength(2);
    expect(tranqueras[0].comentario).toBe("Tranquera");
    expect(tranqueras[1].comentario).toBe("Tranquera: La Estancia");
    expect(alambrados).toHaveLength(1);
    expect(alambrados[0].color).toBe(TRAZO.limite.color);
    expect(alambrados[0].comentario).toBe("Alambrado");
  });

  it("lo que no es tranquera ni alambrado, o un alambrado de un solo punto, vuelve vacío para contarlo", () => {
    const candidatas = candidatasDeOsm(respuesta);
    expect(candidatas).toHaveLength(5);
    expect(candidatas.filter((cada) => cada === null)).toHaveLength(2);
  });
});
