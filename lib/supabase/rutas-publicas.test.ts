import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  esRutaDeEntrar,
  esRutaPublica,
  esRutaQueAndaSinSenal,
} from "@/lib/supabase/rutas-publicas";

/**
 * Las pruebas de qué pasa por el control de sesión y qué no.
 *
 * **Equivocarse acá no da error, da algo peor.** Quien pedía un archivo recibe
 * la página de entrar, y ahí:
 *
 * - el motor del mapa no dibuja nada (pasó el 2026-09-19);
 * - el motor offline se cae al arrancar y la app **deja de guardar todo**:
 *   anda con señal como si nada, y sin señal no hay una sola pantalla. Eso
 *   terminó en una pantalla negra con el ícono en el medio, en el cerro, el
 *   2026-09-20.
 *
 * Ninguna de las dos se ve desde la computadora del que programa.
 */

describe("lo que no pasa por el control de sesión", () => {
  it("deja pasar los tres archivos del motor offline", () => {
    // Si uno solo se va al login, el motor se cae entero y en silencio.
    expect(esRutaPublica("/sw.js")).toBe(true);
    expect(esRutaPublica("/workbox-4bb89e07.js")).toBe(true);
    expect(esRutaPublica("/fallback-Iw2HDZLCV_ojOX7Lrx1B6.js")).toBe(true);
  });

  it("deja pasar los archivos del mapa", () => {
    expect(esRutaPublica("/motor-del-mapa/maplibre-gl-worker.mjs")).toBe(true);
    expect(esRutaPublica("/iconos-del-mapa/light@2x.json")).toBe(true);
    expect(esRutaPublica("/fuentes-del-mapa/Noto Sans Regular/0-255.pbf")).toBe(true);
  });

  it("deja pasar la pantalla de rescate y lo que arma el compilador", () => {
    expect(esRutaPublica("/offline")).toBe(true);
    expect(esRutaPublica("/_next/static/chunks/main.js")).toBe(true);
    expect(esRutaPublica("/api/mapa/12/1234/5678")).toBe(true);
    expect(esRutaPublica("/manifest.webmanifest")).toBe(true);
    expect(esRutaPublica("/icon-192x192.png")).toBe(true);
  });

  it("NO deja pasar las pantallas de verdad", () => {
    for (const pantalla of [
      "/zonas",
      "/zonas/12",
      "/zonas/12/editar",
      "/perfil",
      "/perfiles",
      "/rutas/nueva",
      "/navegacion/7",
    ]) {
      expect(esRutaPublica(pantalla)).toBe(false);
    }
  });

  it("la pantalla de entrar se reconoce sola", () => {
    expect(esRutaDeEntrar("/login")).toBe(true);
    expect(esRutaDeEntrar("/zonas")).toBe(false);
  });

  it("el inicio y una ruta se abren sin señal con datos guardados", () => {
    expect(esRutaQueAndaSinSenal("/")).toBe(true);
    expect(esRutaQueAndaSinSenal("/rutas/12")).toBe(true);
    expect(esRutaQueAndaSinSenal("/rutas/12/editar")).toBe(false);
    expect(esRutaQueAndaSinSenal("/zonas/12")).toBe(false);
  });
});

describe("los archivos que hay de verdad en la app", () => {
  it("todos los del motor offline pasan el control de sesión", () => {
    // No alcanza con acordarse de los nombres: se miran los que el compilador
    // dejó escritos y se comprueba uno por uno. El del rescate lleva un código
    // distinto en cada compilación, así que a mano se olvida.
    const publico = join(process.cwd(), "public");
    if (!existsSync(publico)) return;

    const delMotor = readdirSync(publico).filter(
      (archivo) =>
        archivo === "sw.js" ||
        archivo.startsWith("workbox-") ||
        archivo.startsWith("fallback-"),
    );

    expect(delMotor.length).toBeGreaterThan(0);

    for (const archivo of delMotor) {
      expect(esRutaPublica(`/${archivo}`)).toBe(true);
    }
  });
});
