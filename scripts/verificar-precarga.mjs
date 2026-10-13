/**
 * Frena la compilación si a la precarga del motor offline le falta código.
 *
 * Sin señal, la app solo tiene lo que bajó al instalarse. Si una pieza de
 * código no está en la precarga, la pantalla que la usa revienta en el cerro:
 * pasó el 2026-10-13 con el motor del mapa, que faltaba en toda instalación
 * nueva hasta ver un mapa con señal. Ver `buildExcludes` en `next.config.ts`.
 *
 * Lo único que puede faltar es lo que pasa de 2 MB (el convertidor de fotos
 * del iPhone), que se usa con señal.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const TOPE = 2 * 1024 * 1024;
const ESTATICOS = join(process.cwd(), ".next", "static");
const MOTOR = readFileSync(join(process.cwd(), "public", "sw.js"), "utf8");

function archivos(carpeta) {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}

const faltan = archivos(ESTATICOS)
  .filter((ruta) => /\.(js|css)$/.test(ruta) && statSync(ruta).size <= TOPE)
  .map((ruta) => `/_next/static/${relative(ESTATICOS, ruta).split(sep).join("/")}`)
  // El motor escribe las direcciones codificadas: «[id]» queda «%5Bid%5D».
  .filter((direccion) => !MOTOR.includes(`"${direccion}"`) && !MOTOR.includes(`"${encodeURI(direccion)}"`));

if (faltan.length > 0) {
  console.error(`La precarga no tiene ${faltan.length} piezas de código. Sin señal, las pantallas que las usan revientan:`);
  for (const direccion of faltan.slice(0, 20)) console.error(`  ${direccion}`);
  process.exit(1);
}

console.log("Precarga: todo el código está para usar sin señal.");
