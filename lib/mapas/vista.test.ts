import { describe, expect, it } from "vitest";
import { TOPE_DE_ACERCAMIENTO } from "@/components/mapa/capas-base";
import { ACERCAMIENTO_AL_ELEGIR_PUNTO, accionDeLaCamara, vistaSobreElPunto } from "@/lib/mapas/vista";

describe("vista sobre el punto", () => {
  it("centra en el punto y conserva el zoom si el satelital lo aguanta", () => {
    expect(vistaSobreElPunto(-64.81, -31.41, { zoom: 15.7 })).toEqual({
      lon: -64.81, lat: -31.41, zoom: 15.7,
    });
  });

  it("baja el zoom al tope del satelital propio si Google estaba más cerca", () => {
    expect(vistaSobreElPunto(-64.81, -31.41, { zoom: 19.2 })).toEqual({
      lon: -64.81, lat: -31.41, zoom: TOPE_DE_ACERCAMIENTO.satelital,
    });
  });

  it("usa un zoom cercano si todavía no había vista", () => {
    expect(vistaSobreElPunto(-64.81, -31.41, null)).toEqual({
      lon: -64.81, lat: -31.41, zoom: ACERCAMIENTO_AL_ELEGIR_PUNTO,
    });
  });

  it("no deja el mapa lejos aunque la vista anterior estuviera en el continente", () => {
    expect(vistaSobreElPunto(-64.81, -31.41, { zoom: 2 })).toEqual({
      lon: -64.81, lat: -31.41, zoom: ACERCAMIENTO_AL_ELEGIR_PUNTO,
    });
  });
});

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
