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

// Las mismas identidades que las insignias de la app. Todas las combinaciones
// se generan en casa, sin imágenes externas ni dibujos duplicados.
const actividades = JSON.parse(await readFile(join(process.cwd(), "lib/rutas/catalogo-de-actividades.json"), "utf8"));
const variables = await readFile(join(process.cwd(), "app/globals.css"), "utf8");
const color = (nombre) => variables.match(new RegExp(`--${nombre}:\\s*(#[a-fA-F0-9]+)`))[1];
/** El mismo color, pero del modo pedido: `light` es el modo sol y `dark`, el de noche. */
const MODO_SOL = variables.indexOf(':root[data-modo="sol"]');
const colorDelModo = (nombre, modo) => {
  const bloque = modo === "light" ? variables.slice(MODO_SOL) : variables.slice(0, MODO_SOL);
  return bloque.match(new RegExp(`--${nombre}:\\s*(#[a-fA-F0-9]+)`))[1];
};

/**
 * El marco rojo de un punto con Atención (decisión 078). Es más grande que los
 * íconos (19) y va debajo, así que el rojo asoma alrededor del dibujo. El rojo
 * es el único de la app, el de cada modo.
 */
const LADO_DEL_MARCO = 25;
const marcoDeAtencion = (modo) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${LADO_DEL_MARCO}" height="${LADO_DEL_MARCO}"><rect x="1.5" y="1.5" width="${LADO_DEL_MARCO - 3}" height="${LADO_DEL_MARCO - 3}" rx="5" fill="none" stroke="${colorDelModo("rojo", modo)}" stroke-width="3"/></svg>`;
/**
 * Una sola actividad: círculo, para no confundirse con un punto (que es
 * cuadrado redondeado). Varias: rectángulo bien redondeado (Ale, 2026-11-02).
 */
const GRUPOS = Array.from({ length: (1 << actividades.length) - 1 }, (_, indice) => {
  const elegidas = actividades.filter((_, bit) => (indice + 1) & (1 << bit));
  const sola = elegidas.length === 1;
  const ancho = sola ? 32 : 24 * elegidas.length + 8;
  const trazos = elegidas.map((cada, posicion) => `<g transform="translate(${4 + posicion * 24},4)"><path d="${cada.trazo}" fill="none" stroke="${color("parte-x")}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></g>`).join("");
  const fondo = sola
    ? `<circle cx="16" cy="16" r="14.5" fill="${color("parte-x-halo")}" stroke="${color("parte-x")}" stroke-width="2"/>`
    : `<rect x="1" y="1" width="${ancho - 2}" height="30" rx="12" fill="${color("parte-x-halo")}" stroke="${color("parte-x")}" stroke-width="2"/>`;
  return {
    nombre: `actividades-${elegidas.map((cada) => cada.tipo).join("-")}`,
    ancho,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="32">${fondo}${trazos}</svg>`,
  };
});

/** Cuánto más grande es la hoja de alta densidad. */
const AL_DOBLE = 2;

/**
 * Cada ícono propio: con qué nombre lo pide el mapa (el `kind` de Protomaps),
 * de qué dibujo sale y con qué paleta se pinta.
 */
const PROPIOS = [
  // Edificio: blanco y gris (refugio, campamento, casa, iglesia, posible escalada, objeto).
  { nombre: "alpine_hut", dibujo: "refugio", paleta: "edificio" },
  { nombre: "wilderness_hut", dibujo: "refugio", paleta: "edificio" },
  { nombre: "camp_site", dibujo: "carpa", paleta: "edificio" },
  { nombre: "casa", dibujo: "casa", paleta: "edificio" },
  { nombre: "iglesia", dibujo: "iglesia", paleta: "edificio" },
  { nombre: "posible_escalada", dibujo: "escalada", paleta: "edificio" },
  { nombre: "objeto", dibujo: "objeto", paleta: "edificio" },
  // Agua: azul (arroyo, fuente, cascada, puente, lago, laguna, juntura).
  { nombre: "spring", dibujo: "manantial", paleta: "agua" },
  { nombre: "arroyo", dibujo: "arroyo", paleta: "agua" },
  { nombre: "cascada", dibujo: "cascada", paleta: "agua" },
  { nombre: "puente", dibujo: "puente", paleta: "agua" },
  { nombre: "lago", dibujo: "lago", paleta: "agua" },
  { nombre: "laguna", dibujo: "lago", paleta: "agua" },
  // Mismo dibujo que el cruce, en azul.
  { nombre: "juntura", dibujo: "cruce", paleta: "agua" },
  // Montaña: marrón (cumbre, tranquera, quebrada).
  { nombre: "cumbre", dibujo: "cumbre", paleta: "montana" },
  { nombre: "tranquera", dibujo: "tranquera", paleta: "montana" },
  { nombre: "quebrada", dibujo: "quebrada", paleta: "montana" },
  // Estacionamiento: amarillo.
  { nombre: "estacionamiento", dibujo: "estacionamiento", paleta: "estacionamiento" },
  // Escalada: naranja.
  { nombre: "escalada", dibujo: "escalada", paleta: "escalada" },
  // El resto sigue en verde natural.
  { nombre: "viewpoint", dibujo: "mirador", paleta: "natural" },
  { nombre: "cave_entrance", dibujo: "cueva", paleta: "natural" },
  { nombre: "cartel", dibujo: "cartel", paleta: "natural" },
  { nombre: "cruce", dibujo: "cruce", paleta: "natural" },
  { nombre: "sitio", dibujo: "sitio", paleta: "natural" },
];

/** Paletas por familia de punto (Ale, 2026-11-02). */
const PALETAS = {
  natural: {
    light: { FONDO: "#d6f2e3", TRAZO: "#4fa074", RELLENO: "#bde3cf" },
    dark: { FONDO: "#202623", TRAZO: "#2c9c5e", RELLENO: "#223c2d" },
  },
  agua: {
    light: { FONDO: "#dbeafe", TRAZO: "#0284c7", RELLENO: "#bfdbfe" },
    dark: { FONDO: "#0c4a6e", TRAZO: "#7dd3fc", RELLENO: "#075985" },
  },
  edificio: {
    light: { FONDO: "#f3f4f6", TRAZO: "#4b5563", RELLENO: "#e5e7eb" },
    dark: { FONDO: "#374151", TRAZO: "#e5e7eb", RELLENO: "#4b5563" },
  },
  montana: {
    light: { FONDO: "#f5e6d3", TRAZO: "#92400e", RELLENO: "#e7d3b8" },
    dark: { FONDO: "#451a03", TRAZO: "#fdba74", RELLENO: "#78350f" },
  },
  estacionamiento: {
    light: { FONDO: "#fef08a", TRAZO: "#ca8a04", RELLENO: "#fde047" },
    dark: { FONDO: "#713f12", TRAZO: "#facc15", RELLENO: "#a16207" },
  },
  escalada: {
    light: { FONDO: "#ffedd5", TRAZO: "#ea580c", RELLENO: "#fed7aa" },
    dark: { FONDO: "#7c2d12", TRAZO: "#fb923c", RELLENO: "#9a3412" },
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
  const filaActividades = filaEnY + lado + hueco;
  let xActividad = hueco;
  for (const grupo of GRUPOS) {
    const anchoGrupo = grupo.ancho * escala;
    const altoGrupo = 32 * escala;
    pegados.push({ input: await sharp(Buffer.from(grupo.svg)).resize(anchoGrupo, altoGrupo).png().toBuffer(), left: xActividad, top: filaActividades });
    receta[grupo.nombre] = { x: xActividad, y: filaActividades, width: anchoGrupo, height: altoGrupo, pixelRatio: escala };
    xActividad += anchoGrupo + hueco;
  }
  const ladoDelMarco = LADO_DEL_MARCO * escala;
  pegados.push({ input: await sharp(Buffer.from(marcoDeAtencion(modo))).resize(ladoDelMarco, ladoDelMarco).png().toBuffer(), left: xActividad, top: filaActividades });
  receta["marco-de-atencion"] = { x: xActividad, y: filaActividades, width: ladoDelMarco, height: ladoDelMarco, pixelRatio: escala };
  xActividad += ladoDelMarco + hueco;
  const anchoFinal = Math.max(ancho, anchoNecesario, xActividad);
  const altoFinal = filaActividades + 32 * escala + hueco;

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
