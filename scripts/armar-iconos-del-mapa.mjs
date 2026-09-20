import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Arma la receta de los íconos del mapa para pantallas de alta densidad.
 *
 * **Por qué existe.** El motor del mapa pide los íconos en dos tamaños: en una
 * pantalla común pide `light.json` y `light.png`; en la de un celular moderno
 * pide `light@2x.json` y `light@2x.png`. La hoja de íconos al doble estaba, la
 * receta al doble no, así que **en el celular el fondo del mapa no se dibujaba**
 * y aparecía un cartel de error. En la computadora andaba bien, que es lo que
 * lo hacía difícil de ver.
 *
 * **Por qué se genera y no se guarda escrito.** La hoja al doble es la misma
 * grilla que la común, al doble de tamaño: se comprobó midiendo, recortando
 * cada ícono de las dos hojas y comparándolos. Entonces la receta al doble es
 * la común con todas las medidas multiplicadas por dos. Generándola no puede
 * quedar desactualizada el día que los íconos se cambien.
 */

const CARPETA = join(process.cwd(), "public", "iconos-del-mapa");
const MODOS = ["light", "dark"];

/** Cuánto más grande es la hoja de alta densidad. */
const AL_DOBLE = 2;

async function armarElDelDoble(modo) {
  const comun = JSON.parse(await readFile(join(CARPETA, `${modo}.json`), "utf8"));
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

  const destino = join(CARPETA, `${modo}@2x.json`);
  await writeFile(destino, JSON.stringify(alDoble));
  return { modo, cuantos: Object.keys(alDoble).length };
}

const hechos = await Promise.all(MODOS.map(armarElDelDoble));

console.log(
  "Íconos del mapa para pantalla de alta densidad: " +
    hechos.map(({ modo, cuantos }) => `${modo}@2x (${cuantos})`).join(", "),
);
