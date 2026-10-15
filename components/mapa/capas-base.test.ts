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
  opcionesDelMapa,
  QUIEN_HIZO_LA_FOTO,
  todasLasCapasDelFondo,
} from "@/components/mapa/capas-base";
import { coloresDelMapa } from "@/components/mapa/colores";

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
  it("la consulta conserva Google aunque falte señal o sesión; navegar conserva solo lo descargado", () => {
    const datos = {
      enVivo: true,
      consultaGoogle: true,
      fondosDescargados: ["dibujo", "satelital", "google"] as Array<"dibujo" | "satelital" | "google">,
    };
    expect(opcionesDelMapa(datos)).toEqual(["google"]);
    expect(opcionesDelMapa({ ...datos, enVivo: false })).toEqual(["dibujo", "satelital"]);
    expect(opcionesDelMapa({ ...datos, consultaGoogle: false })).toEqual(["dibujo", "satelital"]);
  });

  it("el fondo de Google no mezcla nombres ni teselas del proveedor propio", () => {
    const capas = capasDelFondo("sol", "google");
    expect(capas).toHaveLength(1);
    expect(capas[0].id).toBe("foto-google");
    expect(estiloDelMapa("sol", false).sources).not.toHaveProperty("google");
  });

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
    const declaradas = Object.keys(estilo.sources);
    expect(declaradas.sort()).toEqual([FUENTE_DEL_FONDO, FUENTE_SATELITAL].sort());

    for (const tipo of ["dibujo", "satelital"] as const) {
      for (const capa of capasDelFondo("noche", tipo)) {
        const fuente = (capa as { source?: string }).source;
        expect(declaradas).toContain(fuente);
      }
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
  it("navegando sale solo del celular, nunca de internet", () => {
    // Si el estilo de lo guardado tuviera una dirección de internet, navegando
    // el mapa saldría a pedirla, que es lo único que esta app no puede hacer.
    const deLoGuardado = estiloDelMapa("noche", false).sources[FUENTE_SATELITAL];
    expect(deLoGuardado).toBeDefined();
    const direcciones = (deLoGuardado as { tiles: string[] }).tiles;
    expect(direcciones.every((cada) => cada.startsWith("foto-guardada://"))).toBe(true);

    const enVivo = estiloDelMapa("noche", true).sources[FUENTE_SATELITAL] as {
      tiles: string[];
    };
    expect(enVivo.tiles[0]).toMatch(/^https:/);
  });

  it("al marcar un rectángulo, sobre la foto van solo los nombres", () => {
    // El relleno y los caminos taparían el terreno, que es justo lo que se
    // quiere mirar al marcar un rectángulo.
    const capas = capasDelFondo("sol", "satelital");

    expect(capas[0].type).toBe("raster");
    expect(capas.slice(1).every((capa) => capa.type === "symbol")).toBe(true);
    expect(capas.length).toBeLessThan(capasDelFondo("sol", "dibujo").length);
  });

  it("navegando, sobre la foto van ríos, arroyos, senderos y huellas, sin tapar el terreno", () => {
    const capas = capasDelFondo("sol", "satelital", true, true);
    const ids = capas.map((capa) => capa.id);
    const colores = coloresDelMapa();

    expect(capas[0].id).toBe("foto-del-terreno");
    expect(capas.some((capa) => capa.type === "fill")).toBe(false);
    expect(ids).toEqual(expect.arrayContaining(["water_stream", "water_river", "roads_other", "senderos"]));
    expect(ids).not.toContain("earth");
    expect(ids).not.toContain("water");
    expect(ids).not.toContain("roads_minor_casing");
    expect(ids).not.toContain("roads_rail");

    const arroyo = capas.find((capa) => capa.id === "water_stream") as { paint: Record<string, unknown> };
    const huella = capas.find((capa) => capa.id === "roads_other") as { paint: Record<string, unknown> };
    const sendero = capas.find((capa) => capa.id === "senderos") as { paint: Record<string, unknown> };
    expect(arroyo.paint["line-color"]).toBe(colores.agua);
    expect(huella.paint["line-color"]).toBe(colores.texto);
    expect(sendero.paint["line-color"]).toBe(colores.sendero);
    expect(sendero.paint["line-dasharray"]).toEqual([2, 1.5]);

    const primerNombre = capas.findIndex((capa) => capa.type === "symbol");
    expect(ids.indexOf("water_stream")).toBeLessThan(ids.indexOf("roads_other"));
    expect(ids.indexOf("roads_other")).toBeLessThan(ids.indexOf("senderos"));
    expect(ids.indexOf("senderos")).toBeLessThan(primerNombre);
    expect(capas.length).toBeLessThan(capasDelFondo("sol", "dibujo").length);
  });

  it("las líneas sobre la foto son las mismas de día y de noche", () => {
    const deSol = capasDelFondo("sol", "satelital", true, true).map((capa) => capa.id);
    const deNoche = capasDelFondo("noche", "satelital", true, true).map((capa) => capa.id);
    expect(deSol).toEqual(deNoche);
  });

  it("se puede sacar todo el fondo al cambiar de tipo", () => {
    // Si una capa quedara sin sacar, el dibujo y la foto se encimarían.
    const todas = todasLasCapasDelFondo("sol").map((capa) => capa.id);

    for (const tipo of ["dibujo", "satelital"] as const) {
      for (const capa of capasDelFondo("sol", tipo)) {
        expect(todas).toContain(capa.id);
      }
    }
    for (const capa of capasDelFondo("sol", "satelital", true, true)) {
      expect(todas).toContain(capa.id);
    }
  });

  it("con curvas la foto lleva velo, y sin curvas se ve limpia", () => {
    const conCurvas = capasDelFondo("sol", "satelital", true)[0] as { paint?: object };
    const sinCurvas = capasDelFondo("sol", "satelital", false)[0] as { paint?: object };
    expect(Object.keys(conCurvas.paint ?? {}).length).toBeGreaterThan(0);
    expect(sinCurvas.paint).toEqual({});
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
