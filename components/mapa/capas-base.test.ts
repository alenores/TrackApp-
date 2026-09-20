// @vitest-environment jsdom
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  capasDelFondo,
  estiloDelMapa,
  FUENTE_DEL_FONDO,
  FUENTE_SATELITAL,
  iconosDelFondo,
  QUIEN_HIZO_LA_FOTO,
  todasLasCapasDelFondo,
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

type MedidasDeIcono = {
  x: number;
  y: number;
  width: number;
  height: number;
  pixelRatio: number;
};

function leerReceta(archivo: string): Record<string, MedidasDeIcono> {
  return JSON.parse(readFileSync(join(CARPETA_DE_ICONOS, archivo), "utf8"));
}

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

describe("la foto del terreno", () => {
  it("solo existe con el mapa en vivo, nunca en lo que se descarga", () => {
    // Si estuviera en el estilo de lo guardado, navegando el mapa saldría a
    // pedirla a internet, que es lo único que esta app no puede hacer.
    expect(Object.keys(estiloDelMapa("noche", false).sources)).toEqual([
      FUENTE_DEL_FONDO,
    ]);
    expect(Object.keys(estiloDelMapa("noche", true).sources)).toContain(
      FUENTE_SATELITAL,
    );
  });

  it("sobre la foto van solo los nombres, no el dibujo entero", () => {
    // El relleno y los caminos taparían el terreno, que es justo lo que se
    // quiere mirar al marcar un rectángulo.
    const capas = capasDelFondo("sol", "satelital");

    expect(capas[0].type).toBe("raster");
    expect(capas.slice(1).every((capa) => capa.type === "symbol")).toBe(true);
    expect(capas.length).toBeLessThan(capasDelFondo("sol", "dibujo").length);
  });

  it("se puede sacar todo el fondo al cambiar de tipo", () => {
    // Si una capa quedara sin sacar, el dibujo y la foto se encimarían.
    const todas = todasLasCapasDelFondo("sol").map((capa) => capa.id);

    for (const tipo of ["dibujo", "satelital"] as const) {
      for (const capa of capasDelFondo("sol", tipo)) {
        expect(todas).toContain(capa.id);
      }
    }
  });

  it("se dice quién hizo la foto, que su licencia lo exige", () => {
    expect(QUIEN_HIZO_LA_FOTO).toMatch(/EOX/);
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

  it("el motor que procesa los datos está copiado adentro de la app", () => {
    // Sin estos dos archivos el mapa no dibuja NADA: ni el fondo, ni la ruta,
    // ni el punto del GPS. El motor los busca solo y no los encuentra por cómo
    // se empaqueta esta app, así que se los deja acá y se le dice dónde están.
    const motor = join(process.cwd(), "public", "motor-del-mapa");
    expect(existsSync(join(motor, "maplibre-gl-worker.mjs"))).toBe(true);
    expect(existsSync(join(motor, "maplibre-gl-shared.mjs"))).toBe(true);
  });

  it("los íconos de los dos modos están adentro, en los dos tamaños", () => {
    // El motor pide los íconos en dos tamaños: el común en una computadora y
    // el del doble en la pantalla de un celular moderno. Si falta uno de los
    // cuatro archivos de un modo, **el fondo del mapa no se dibuja en el
    // celular** aunque en la computadora se vea perfecto. Pasó en producción el
    // 2026-09-20: faltaba la receta del doble y nadie lo veía desde la compu.
    for (const nombre of ["light", "dark"]) {
      for (const tamano of ["", "@2x"]) {
        expect(existsSync(join(CARPETA_DE_ICONOS, `${nombre}${tamano}.json`))).toBe(true);
        expect(existsSync(join(CARPETA_DE_ICONOS, `${nombre}${tamano}.png`))).toBe(true);
      }
    }
  });

  it("la receta del doble mide el doble que la común", () => {
    // Si no, los íconos salen recortados o en el lugar equivocado.
    for (const nombre of ["light", "dark"]) {
      const comun = leerReceta(`${nombre}.json`);
      const alDoble = leerReceta(`${nombre}@2x.json`);

      expect(Object.keys(alDoble)).toEqual(Object.keys(comun));

      for (const [icono, medidas] of Object.entries(comun)) {
        expect(alDoble[icono]).toMatchObject({
          x: medidas.x * 2,
          y: medidas.y * 2,
          width: medidas.width * 2,
          height: medidas.height * 2,
          pixelRatio: 2,
        });
      }
    }
  });
});
