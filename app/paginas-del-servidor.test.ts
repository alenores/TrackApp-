import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Una página del servidor no puede pasarle funciones a una pieza del celular:
 * la pantalla revienta al abrirse, solo en producción y solo al entrar. Pasó el
 * 2026-10-13 con Descargas. Esta prueba busca funciones escritas adentro de lo
 * que dibuja una página o un marco que no sea del celular.
 */

const CARPETA = join(process.cwd(), "app");

function archivos(carpeta: string): string[] {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) return archivos(ruta);
    return /^(page|layout|template|loading|not-found)\.tsx$/.test(nombre) ? [ruta] : [];
  });
}

describe("páginas del servidor", () => {
  it("no le pasan funciones a las piezas del celular", () => {
    const conFunciones = archivos(CARPETA)
      .filter((ruta) => {
        const texto = readFileSync(ruta, "utf8");
        if (/^\s*["']use client["']/.test(texto)) return false;
        return /\{\s*(\([^)]*\)|\w+)\s*=>/.test(texto);
      })
      .map((ruta) => relative(process.cwd(), ruta));
    expect(conFunciones).toEqual([]);
  });
});
