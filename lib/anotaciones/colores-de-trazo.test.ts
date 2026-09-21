import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  claveDelColor,
  COLOR_DE_TRAZO_POR_DEFECTO,
  COLORES_DE_TRAZO,
  nombreDelColor,
  TRAZO,
} from "@/lib/anotaciones/colores-de-trazo";

/**
 * Un trazo marca lo que el mapa no muestra. Si su color se pareciera al del
 * sendero o al del arroyo del fondo, en el cerro no se sabría cuál es cuál.
 */

const CSS = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8").replace(
  /\r\n/g,
  "\n",
);

function coloresDelFondo(): string[] {
  const encontrados: string[] = [];
  for (const linea of CSS.split("\n")) {
    const par = linea.match(/^\s*--mapa-(?:sendero|agua):\s*(#[0-9a-f]{6});/i);
    if (par) encontrados.push(par[1].toLowerCase());
  }
  return encontrados;
}

function distancia(a: string, b: string): number {
  const canal = (color: string, desde: number) => parseInt(color.slice(desde, desde + 2), 16);
  return Math.hypot(
    canal(a, 1) - canal(b, 1),
    canal(a, 3) - canal(b, 3),
    canal(a, 5) - canal(b, 5),
  );
}

describe("los colores del trazo", () => {
  it.each(COLORES_DE_TRAZO)("%s tiene nombre y color, y se recupera de lo guardado", (clave) => {
    expect(TRAZO[clave].nombre.length).toBeGreaterThan(0);
    expect(TRAZO[clave].color).toMatch(/^#[0-9a-f]{6}$/);
    expect(claveDelColor(TRAZO[clave].color)).toBe(clave);
    expect(nombreDelColor(TRAZO[clave].color)).toBe(TRAZO[clave].nombre);
  });

  it("un color que no es de los nuestros no rompe nada", () => {
    expect(nombreDelColor("#123456")).toBe("Trazo");
    expect(nombreDelColor(null)).toBe("Trazo");
    expect(claveDelColor(null)).toBe(COLOR_DE_TRAZO_POR_DEFECTO);
  });

  it("ninguno se confunde con el sendero ni con el arroyo del fondo", () => {
    const fondo = coloresDelFondo();
    expect(fondo.length).toBe(4);
    for (const clave of COLORES_DE_TRAZO) {
      for (const delFondo of fondo) {
        expect(distancia(TRAZO[clave].color, delFondo)).toBeGreaterThan(80);
      }
    }
  });
});
