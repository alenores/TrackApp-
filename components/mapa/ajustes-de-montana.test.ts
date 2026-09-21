// @vitest-environment jsdom
import { layers, namedFlavor } from "@protomaps/basemaps";
import type { LayerSpecification } from "maplibre-gl";
import { describe, expect, it } from "vitest";
import {
  ajustarParaLaMontana,
  ARROYOS_DESDE,
  type CapaConFiltro,
  NOMBRES_DE_SENDEROS,
  SENDEROS,
} from "@/components/mapa/ajustes-de-montana";
import { coloresDelMapa } from "@/components/mapa/colores";

/**
 * Lo que se prueba acá es que la corrección **siga aplicándose** sobre las
 * capas de verdad de Protomaps. Si Protomaps renombra una capa, el ajuste deja
 * de tocarla en silencio y el mapa vuelve a esconder los senderos sin que
 * nadie se entere. Estas pruebas son el aviso.
 */

const FUENTE = "fondo";
const colores = coloresDelMapa();

function originales(sabor: "light" | "dark"): LayerSpecification[] {
  return layers(FUENTE, namedFlavor(sabor), { lang: "es" });
}

function ajustadas(sabor: "light" | "dark"): LayerSpecification[] {
  return ajustarParaLaMontana(originales(sabor), FUENTE, colores);
}

function buscar(capas: LayerSpecification[], id: string): CapaConFiltro {
  const capa = capas.find((cada) => cada.id === id);
  if (!capa || capa.type === "background") throw new Error(`No está la capa ${id}`);
  return capa;
}

function menciona(valor: unknown, palabra: string): boolean {
  return JSON.stringify(valor).includes(`"${palabra}"`);
}

describe("los senderos se dibujan aparte de los caminos", () => {
  it.each(["light", "dark"] as const)("en el sabor %s", (sabor) => {
    const capas = ajustadas(sabor);

    const senderos = buscar(capas, SENDEROS);
    expect(senderos.type).toBe("line");
    expect(menciona(senderos.filter, "path")).toBe(true);
    expect((senderos as { paint: Record<string, unknown> }).paint["line-color"]).toBe(
      colores.sendero,
    );

    /* Sacados de la bolsa de «otros caminos»: si no, se dibujan dos veces. */
    expect(menciona(buscar(capas, "roads_other").filter, "path")).toBe(false);
    expect(menciona(buscar(capas, "roads_labels_minor").filter, "path")).toBe(false);
  });

  it("van justo encima de los otros caminos, no al final de todo", () => {
    const ids = ajustadas("light").map((capa) => capa.id);
    expect(ids.indexOf(SENDEROS)).toBe(ids.indexOf("roads_other") + 1);
    expect(ids.indexOf(NOMBRES_DE_SENDEROS)).toBe(ids.indexOf("roads_labels_minor") + 1);
  });

  it("agrega dos capas y no pierde ninguna", () => {
    expect(ajustadas("light")).toHaveLength(originales("light").length + 2);
  });
});

describe("el agua se ve", () => {
  it("los arroyos aparecen antes de lo que Protomaps quería", () => {
    const antes = buscar(originales("light"), "water_stream");
    const despues = buscar(ajustadas("light"), "water_stream");
    expect(antes.minzoom).toBeGreaterThan(ARROYOS_DESDE);
    expect(despues.minzoom).toBe(ARROYOS_DESDE);
  });

  it.each(["water_stream", "water_river"])("%s va del color del agua", (id) => {
    const capa = buscar(ajustadas("dark"), id) as { paint: Record<string, unknown> };
    expect(capa.paint["line-color"]).toBe(colores.agua);
  });
});

describe("lo que no se conoce no se toca", () => {
  it("una lista de capas ajena sale igual que entró", () => {
    const ajena: LayerSpecification[] = [
      { id: "cualquiera", type: "line", source: FUENTE, "source-layer": "x" },
    ];
    expect(ajustarParaLaMontana(ajena, FUENTE, colores)).toEqual(ajena);
  });
});
