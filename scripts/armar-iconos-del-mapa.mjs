import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

/**
 * Arma la hoja de íconos del mapa: **los de Protomaps más los propios**.
 *
 * **Por qué hay propios.** La hoja de Protomaps es de ciudad: tiene bar, café,
 * escuela y zoológico, y no tiene refugio, carpa, mirador, cueva ni
 * manantial. En la sierra son justo lo que hace falta ver, y el archivo del
 * mapa ya los trae: se medían sobre el Champaquí y estaban. Sin su ícono, el
 * motor no los dibuja.
 *
 * **Cómo se suman.** Los propios se dibujan en `scripts/iconos-de-montana`,
 * con las palabras FONDO, TRAZO y RELLENO en vez de colores. Acá se pintan
 * con la misma paleta que usa Protomaps para cada familia —verde para lo
 * natural, la del agua para el manantial— en el modo claro y en el oscuro, y
 * se pegan en una fila nueva debajo de la hoja original. La hoja original se
 * guarda aparte, como `protomaps-*`, y no se toca: si un día se cambia por
 * una más nueva, los propios se vuelven a sumar solos.
 *
 * **Por qué la del doble también.** El motor del mapa pide los íconos en dos
 * tamaños: en una pantalla común pide `light.json` y `light.png`; en la de un
 * celular moderno pide `light@2x.json` y `light@2x.png`. Faltaba la receta al
 * doble y **en el celular el fondo del mapa no se dibujaba**. La receta al
 * doble es la común con todas las medidas multiplicadas por dos, y se genera
 * para que no pueda quedar desactualizada.
 */

const HOJA = join(process.cwd(), "public", "iconos-del-mapa");
const DIBUJOS = join(process.cwd(), "scripts", "iconos-de-montana");
const MODOS = ["light", "dark"];

/** El lado de un ícono en la hoja común, y el hueco que se deja entre dos. */
const LADO = 19;
const HUECO = 2;

/** Cuánto más grande es la hoja de alta densidad. */
const AL_DOBLE = 2;

/**
 * Cada ícono propio: con qué nombre lo pide el mapa (el `kind` de Protomaps),
 * de qué dibujo sale y con qué paleta se pinta.
 */
const PROPIOS = [
  { nombre: "alpine_hut", dibujo: "refugio", paleta: "natural" },
  { nombre: "wilderness_hut", dibujo: "refugio", paleta: "natural" },
  { nombre: "camp_site", dibujo: "carpa", paleta: "natural" },
  { nombre: "viewpoint", dibujo: "mirador", paleta: "natural" },
  { nombre: "cave_entrance", dibujo: "cueva", paleta: "natural" },
  { nombre: "spring", dibujo: "manantial", paleta: "agua" },
];

/** Medidos sobre los íconos de Protomaps de cada familia, píxel por píxel. */
const PALETAS = {
  natural: {
    light: { FONDO: "#d6f2e3", TRAZO: "#4fa074", RELLENO: "#bde3cf" },
    dark: { FONDO: "#202623", TRAZO: "#2c9c5e", RELLENO: "#223c2d" },
  },
  agua: {
    light: { FONDO: "#dcebfa", TRAZO: "#8780ab", RELLENO: "#ccd8ec" },
    dark: { FONDO: "#242425", TRAZO: "#76767f", RELLENO: "#333335" },
  },
};

function pintar(svg, colores) {
  return Object.entries(colores).reduce(
    (dibujo, [palabra, color]) => dibujo.replaceAll(palabra, color),
    svg,
  );
}

async function medidas(archivo) {
  const { width, height } = await sharp(archivo).metadata();
  return { ancho: width, alto: height };
}

async function sumarPropios(modo, escala) {
  const sufijo = escala === 1 ? "" : `@${escala}x`;
  const base = join(HOJA, `protomaps-${modo}${sufijo}.png`);
  const { ancho, alto } = await medidas(base);
  const lado = LADO * escala;
  const hueco = HUECO * escala;
  const filaEnY = alto + hueco;

  const pegados = [];
  const receta = {};

  for (const [indice, propio] of PROPIOS.entries()) {
    const crudo = await readFile(join(DIBUJOS, `${propio.dibujo}.svg`), "utf8");
    const svg = pintar(crudo, PALETAS[propio.paleta][modo]);
    const x = hueco + indice * (lado + hueco);
    pegados.push({
      input: await sharp(Buffer.from(svg)).resize(lado, lado).png().toBuffer(),
      left: x,
      top: filaEnY,
    });
    receta[propio.nombre] = { x, y: filaEnY, width: lado, height: lado, pixelRatio: escala };
  }

  const anchoNecesario = hueco + PROPIOS.length * (lado + hueco);
  const anchoFinal = Math.max(ancho, anchoNecesario);
  const altoFinal = filaEnY + lado + hueco;

  await sharp({
    create: { width: anchoFinal, height: altoFinal, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: base, left: 0, top: 0 }, ...pegados])
    .png()
    .toFile(join(HOJA, `${modo}${sufijo}.png`));

  return receta;
}

async function armarHoja(modo) {
  const original = JSON.parse(await readFile(join(HOJA, `protomaps-${modo}.json`), "utf8"));

  const propios = await sumarPropios(modo, 1);
  await sumarPropios(modo, AL_DOBLE);

  const comun = { ...original, ...propios };
  await writeFile(join(HOJA, `${modo}.json`), JSON.stringify(comun));

  const alDoble = {};
  for (const [nombre, icono] of Object.entries(comun)) {
    alDoble[nombre] = {
      ...icono,
      x: icono.x * AL_DOBLE,
      y: icono.y * AL_DOBLE,
      width: icono.width * AL_DOBLE,
      height: icono.height * AL_DOBLE,
      pixelRatio: AL_DOBLE,
    };
  }
  await writeFile(join(HOJA, `${modo}@2x.json`), JSON.stringify(alDoble));

  return { modo, cuantos: Object.keys(comun).length, propios: Object.keys(propios).length };
}

const hechos = await Promise.all(MODOS.map(armarHoja));

console.log(
  "Íconos del mapa: " +
    hechos.map(({ modo, cuantos, propios }) => `${modo} (${cuantos}, ${propios} propios)`).join(", "),
);
