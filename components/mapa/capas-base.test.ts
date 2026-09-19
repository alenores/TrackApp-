// @vitest-environment jsdom
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  capasDelFondo,
  estiloDelMapa,
  FUENTE_DEL_FONDO,
  iconosDelFondo,
} from "@/components/mapa/capas-base";

/**
 * Las pruebas del fondo del mapa.
 *
 * **Lo que se prueba acá es que el mapa se arme.** Un detalle mal puesto en la
 * receta del fondo no da un error a la vista: el mapa entero deja de armarse y
 * el usuario ve un cuadro gris, sin ruta, sin su posición y sin recuadros. Pasó
 * en producción el 2026-09-19 por una dirección escrita como atajo en vez de
 * completa.
 */

const CARPETA_DE_LETRAS = join(process.cwd(), "public", "fuentes-del-mapa");
const CARPETA_DE_ICONOS = join(process.cwd(), "public", "iconos-del-mapa");

/** Las pilas de letras que el fondo va a pedir, leídas de las capas de verdad. */
function pilasDeLetras(): Set<string> {
  const pilas = new Set<string>();

  const recorrer = (valor: unknown) => {
    if (!Array.isArray(valor)) return;
    if (valor.every((cada) => typeof cada === "string")) {
      pilas.add((valor as string[]).join(","));
      return;
    }
    valor.forEach(recorrer);
  };

  for (const capa of capasDelFondo("noche")) {
    const layout = (capa as { layout?: Record<string, unknown> }).layout;
    if (layout?.["text-font"]) recorrer(layout["text-font"]);
  }

  return pilas;
}

describe("la receta del fondo", () => {
  it("las direcciones son completas, no atajos", () => {
    // El motor del mapa rechaza un camino que arranca con barra, y al
    // rechazarlo no arma nada: ni el fondo, ni la ruta, ni el punto del GPS.
    const estilo = estiloDelMapa("noche");

    expect(estilo.sprite).toMatch(/^https?:\/\//);
    expect(estilo.glyphs).toMatch(/^https?:\/\//);
    expect(iconosDelFondo("sol")).toMatch(/^https?:\/\//);
  });

  it("los dos modos piden íconos distintos", () => {
    expect(iconosDelFondo("sol")).not.toBe(iconosDelFondo("noche"));
  });

  it("no trae la capa de fondo liso, que taparía el color de la app", () => {
    for (const modo of ["sol", "noche"] as const) {
      expect(capasDelFondo(modo).some((capa) => capa.type === "background")).toBe(false);
    }
  });

  it("todas las capas leen de la fuente que la receta declara", () => {
    const estilo = estiloDelMapa("noche");
    expect(Object.keys(estilo.sources)).toEqual([FUENTE_DEL_FONDO]);

    for (const capa of capasDelFondo("noche")) {
      const fuente = (capa as { source?: string }).source;
      expect(fuente).toBe(FUENTE_DEL_FONDO);
    }
  });

  it("los dos modos dibujan exactamente las mismas capas", () => {
    // Si un modo trajera una capa que el otro no, al cambiar de sol a noche
    // quedarían capas viejas sin sacar, encimadas con las nuevas.
    const deSol = capasDelFondo("sol").map((capa) => capa.id);
    const deNoche = capasDelFondo("noche").map((capa) => capa.id);
    expect(deSol).toEqual(deNoche);
  });
});

describe("lo que el fondo necesita tener guardado en la app", () => {
  it("las letras que pide están todas adentro", () => {
    // Si falta una, el mapa sin señal se dibuja sin un solo nombre escrito.
    const pilas = [...pilasDeLetras()].filter((pila) => pila.startsWith("Noto"));
    expect(pilas.length).toBeGreaterThan(0);

    for (const pila of pilas) {
      expect(existsSync(join(CARPETA_DE_LETRAS, pila, "0-255.pbf"))).toBe(true);
    }
  });

  it("los íconos de los dos modos están adentro", () => {
    for (const nombre of ["light", "dark"]) {
      expect(existsSync(join(CARPETA_DE_ICONOS, `${nombre}.json`))).toBe(true);
      expect(existsSync(join(CARPETA_DE_ICONOS, `${nombre}.png`))).toBe(true);
    }
  });
});
