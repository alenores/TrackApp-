import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Copia el motor del mapa adentro de la app.
 *
 * **Sin esto el mapa no dibuja absolutamente nada.** El motor del mapa reparte
 * su trabajo en dos: una parte dibuja y otra, aparte, procesa los datos. La
 * segunda vive en un archivo suelto, y el motor la busca sola calculando dónde
 * quedó. Ese cálculo **no funciona con la forma en que se empaqueta esta app**:
 * devuelve vacío, el motor termina cargando la página web en lugar de su propio
 * código, esa parte muere al instante y el mapa se queda para siempre esperando
 * datos que nunca llegan. Ni el fondo, ni la ruta, ni el punto del GPS.
 *
 * La solución es dejarle los dos archivos en un lugar fijo de la app y decirle
 * exactamente dónde están (ver `lib/mapas/motor.ts`).
 *
 * **Se copian en cada compilación, no se guardan a mano en el repositorio.**
 * Así no se puede quedar viejo uno respecto del otro el día que se actualice la
 * librería: un motor de una versión con la otra parte de otra no se entienden.
 */

const ARCHIVOS = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const desde = join(raiz, "node_modules", "maplibre-gl", "dist");
const hasta = join(raiz, "public", "motor-del-mapa");

await mkdir(hasta, { recursive: true });

for (const archivo of ARCHIVOS) {
  await copyFile(join(desde, archivo), join(hasta, archivo));
}

console.log(`Motor del mapa copiado: ${ARCHIVOS.join(", ")}`);
