import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * La prueba que sostiene los dos modos.
 *
 * Sin esto, que un color falte en un modo no se nota hasta que alguien abre la
 * app en el cerro y encuentra letra clara sobre fondo claro. Nadie lee el CSS
 * para darse cuenta: lo tiene que ver la máquina.
 *
 * Chequea dos cosas:
 *   1. Que los dos modos definan exactamente los mismos colores.
 *   2. Que cada combinación de texto y fondo llegue al contraste mínimo que
 *      pide AGENTS.md, en los dos modos.
 */

/* En Windows, Git deja los archivos con fin de línea propio; se leen igual. */
const CSS = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8").replace(
  /\r\n/g,
  "\n",
);

function bloque(selector: string): string {
  const desde = CSS.indexOf(selector);
  if (desde === -1) throw new Error(`No está el bloque ${selector} en globals.css`);
  const abre = CSS.indexOf("{", desde);
  const cierra = CSS.indexOf("\n}", abre);
  return CSS.slice(abre + 1, cierra);
}

function colores(texto: string): Record<string, string> {
  const encontrados: Record<string, string> = {};
  for (const linea of texto.split("\n")) {
    const par = linea.match(/^\s*(--[a-z0-9-]+):\s*(.+?);\s*$/);
    if (par) encontrados[par[1]] = par[2].trim();
  }
  return encontrados;
}

const NOCHE = colores(bloque(':root,\n:root[data-modo="noche"]'));
const SOL = colores(bloque(':root[data-modo="sol"]'));

/** Los colores que no son colores: sombras y el aviso al navegador. */
const NO_SON_COLORES = ["--sombra", "--sombra-alta"];

function aCanal(valor: number): number {
  const v = valor / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminancia(hex: string): number {
  const limpio = hex.replace("#", "");
  const r = parseInt(limpio.slice(0, 2), 16);
  const g = parseInt(limpio.slice(2, 4), 16);
  const b = parseInt(limpio.slice(4, 6), 16);
  return 0.2126 * aCanal(r) + 0.7152 * aCanal(g) + 0.0722 * aCanal(b);
}

function contraste(frente: string, fondo: string): number {
  const a = luminancia(frente);
  const b = luminancia(fondo);
  const claro = Math.max(a, b);
  const oscuro = Math.min(a, b);
  return (claro + 0.05) / (oscuro + 0.05);
}

/** Texto normal: 7:1. Ver la tabla de AGENTS.md. */
const PARES_DE_TEXTO: Array<[string, string]> = [
  ["--texto", "--fondo"],
  ["--texto", "--superficie"],
  ["--texto", "--superficie-alta"],
  ["--texto-suave", "--fondo"],
  ["--texto-suave", "--superficie"],
  ["--acento-texto", "--acento"],
  ["--acento-texto", "--acento-hover"],
  ["--dato", "--fondo"],
  ["--dato", "--superficie"],
  ["--rojo-texto", "--rojo-fondo"],
  ["--rojo-texto", "--rojo-fondo-fuerte"],
  ["--ambar-texto", "--ambar-fondo"],
  ["--verde-texto", "--verde-fondo"],
];

/** Íconos, bordes de lo que se toca y texto grande: 4.5:1. */
const PARES_DE_ICONOS: Array<[string, string]> = [
  ["--acento-tenue", "--fondo"],
  ["--acento-tenue", "--superficie"],
  ["--ambar-icono", "--ambar-fondo"],
  ["--verde-icono", "--verde-fondo"],
  ["--rojo", "--fondo"],
  ["--rojo", "--superficie"],
  ["--borde-fuerte", "--fondo"],
  ["--borde-fuerte", "--superficie"],
  // Lo que se dibuja sobre el mapa. Si no se ve, no sirve de nada.
  ["--mapa-linea", "--mapa-fondo"],
  ["--gps", "--mapa-fondo"],
  ["--anotacion", "--mapa-fondo"],
];

const MODOS: Array<[string, Record<string, string>]> = [
  ["noche", NOCHE],
  ["sol", SOL],
];

describe("los dos modos de color", () => {
  it("definen exactamente los mismos colores", () => {
    const enNoche = Object.keys(NOCHE).filter((c) => c.startsWith("--")).sort();
    const enSol = Object.keys(SOL).filter((c) => c.startsWith("--")).sort();

    expect(enSol).toEqual(enNoche);
  });

  it("no dejan ningún color vacío", () => {
    for (const [nombre, modo] of MODOS) {
      for (const [color, valor] of Object.entries(modo)) {
        expect(valor, `${color} en modo ${nombre}`).not.toBe("");
      }
    }
  });

  it("escriben los colores de aviso sin transparencia, para poder medirlos", () => {
    const deAviso = [
      "--rojo-fondo",
      "--rojo-fondo-fuerte",
      "--ambar-fondo",
      "--verde-fondo",
      "--fondo",
      "--superficie",
      "--superficie-alta",
      "--mapa-fondo",
      "--mapa-linea",
      "--gps",
      "--anotacion",
    ];

    for (const [nombre, modo] of MODOS) {
      for (const color of deAviso) {
        expect(modo[color], `${color} en modo ${nombre}`).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });
});

describe("el contraste, en los dos modos", () => {
  for (const [nombre, modo] of MODOS) {
    for (const [frente, fondo] of PARES_DE_TEXTO) {
      it(`modo ${nombre}: ${frente} sobre ${fondo} llega a 7:1`, () => {
        const medido = contraste(modo[frente], modo[fondo]);
        expect(
          Number(medido.toFixed(2)),
          `${frente} sobre ${fondo} da ${medido.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(7);
      });
    }

    for (const [frente, fondo] of PARES_DE_ICONOS) {
      it(`modo ${nombre}: ${frente} sobre ${fondo} llega a 4.5:1`, () => {
        const medido = contraste(modo[frente], modo[fondo]);
        expect(
          Number(medido.toFixed(2)),
          `${frente} sobre ${fondo} da ${medido.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

describe("las sombras", () => {
  it("existen en los dos modos y no se miden como color", () => {
    for (const color of NO_SON_COLORES) {
      expect(NOCHE[color]).toBeTruthy();
      expect(SOL[color]).toBeTruthy();
    }
  });
});
