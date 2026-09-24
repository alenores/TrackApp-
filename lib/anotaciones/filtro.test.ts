import { describe, expect, it } from "vitest";
import {
  comoSeLlamaElFiltro,
  pasaElFiltro,
  TODAS_LAS_ANOTACIONES,
} from "@/lib/anotaciones/filtro";

/**
 * Que las casillas muestren lo que dicen. Si se equivoca, alguien apaga «de
 * otros» y deja de ver el cruce que marcó él mismo.
 */

const mia = { perfilId: "yo", deAdministrador: false };
const delAdmin = { perfilId: "ale", deAdministrador: true };
const deOtro = { perfilId: "otro", deAdministrador: false };

describe("qué anotaciones se ven", () => {
  it("con todo prendido se ven todas", () => {
    for (const cada of [mia, delAdmin, deOtro]) {
      expect(pasaElFiltro(cada, TODAS_LAS_ANOTACIONES, "yo")).toBe(true);
    }
  });

  it("solo las mías", () => {
    const filtro = { mias: true, delAdministrador: false, deOtros: false };
    expect(pasaElFiltro(mia, filtro, "yo")).toBe(true);
    expect(pasaElFiltro(delAdmin, filtro, "yo")).toBe(false);
    expect(pasaElFiltro(deOtro, filtro, "yo")).toBe(false);
  });

  it("apagar «de otros» no esconde las mías", () => {
    const filtro = { mias: true, delAdministrador: true, deOtros: false };
    expect(pasaElFiltro(mia, filtro, "yo")).toBe(true);
    expect(pasaElFiltro(deOtro, filtro, "yo")).toBe(false);
  });

  it("el administrador ve las suyas con cualquiera de sus dos casillas", () => {
    const suya = { perfilId: "ale", deAdministrador: true };
    expect(pasaElFiltro(suya, { mias: false, delAdministrador: true, deOtros: false }, "ale")).toBe(true);
    expect(pasaElFiltro(suya, { mias: true, delAdministrador: false, deOtros: false }, "ale")).toBe(true);
  });

  it("sin saber quién sos, las que no son del administrador cuentan como de otros", () => {
    const filtro = { mias: false, delAdministrador: false, deOtros: true };
    expect(pasaElFiltro(mia, filtro, null)).toBe(true);
  });
});

describe("cómo se lee en el botón", () => {
  it("todas, ninguna o cuáles", () => {
    expect(comoSeLlamaElFiltro(TODAS_LAS_ANOTACIONES)).toBe("todas");
    expect(comoSeLlamaElFiltro({ mias: false, delAdministrador: false, deOtros: false })).toBe("ninguna");
    expect(comoSeLlamaElFiltro({ mias: true, delAdministrador: true, deOtros: false })).toBe(
      "tuyas y del administrador",
    );
  });
});
