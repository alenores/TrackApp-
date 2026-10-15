import { describe, expect, it } from "vitest";
import { accionDeLaCamara } from "@/lib/mapas/vista";

describe("acción de la cámara", () => {
  it("la vista dejada al guardar gana al encuadre de apertura", () => {
    expect(accionDeLaCamara({
      hayVistaNueva: true,
      hayEncuadre: true,
      viajar: false,
      encuadrarSoloAlAbrir: false,
      yaEncuadro: true,
    })).toBe("vista");
  });

  it("sin esa vista, el primer encuadre mueve el mapa", () => {
    expect(accionDeLaCamara({
      hayVistaNueva: false,
      hayEncuadre: true,
      viajar: false,
      encuadrarSoloAlAbrir: true,
      yaEncuadro: false,
    })).toBe("encuadre");
  });

  it("si ya se encuadró al abrir, un cambio de líneas no mueve el mapa", () => {
    expect(accionDeLaCamara({
      hayVistaNueva: false,
      hayEncuadre: true,
      viajar: false,
      encuadrarSoloAlAbrir: true,
      yaEncuadro: true,
    })).toBe("quieto");
  });

  it("pedir un viaje mueve el mapa aunque ya se hubiera encuadrado", () => {
    expect(accionDeLaCamara({
      hayVistaNueva: false,
      hayEncuadre: true,
      viajar: true,
      encuadrarSoloAlAbrir: true,
      yaEncuadro: true,
    })).toBe("encuadre");
  });

  it("sin vista nueva ni encuadre, el mapa se queda", () => {
    expect(accionDeLaCamara({
      hayVistaNueva: false,
      hayEncuadre: false,
      viajar: true,
      encuadrarSoloAlAbrir: false,
      yaEncuadro: false,
    })).toBe("quieto");
  });
});
