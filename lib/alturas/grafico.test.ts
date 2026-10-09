import { describe, expect, it } from "vitest";
import { ejesDelGrafico, puntoMasCercano, textoDeAltura, textoDeDistancia } from "@/lib/alturas/grafico";

const perfil = [
  { distanciaM: 0, alturaM: 742 },
  { distanciaM: 4000, alturaM: 1180 },
  { distanciaM: 9000, alturaM: 980 },
  { distanciaM: 16_100, alturaM: 651 },
];

describe("ejes del gráfico", () => {
  it("el rango arranca y termina en marcas redondas que contienen todo el perfil", () => {
    const ejes = ejesDelGrafico(perfil);
    expect(ejes.alturaMinimaM).toBeLessThanOrEqual(651);
    expect(ejes.alturaMaximaM).toBeGreaterThanOrEqual(1180);
    expect(ejes.marcasDeAltura.length).toBeLessThanOrEqual(5);
    expect(ejes.marcasDeAltura[0]).toBe(ejes.alturaMinimaM);
  });

  it("las marcas de distancia no se amontonan y arrancan en cero", () => {
    const ejes = ejesDelGrafico(perfil, 4, 5);
    expect(ejes.marcasDeDistancia[0]).toBe(0);
    expect(ejes.marcasDeDistancia.length).toBeLessThanOrEqual(6);
    expect(ejes.marcasDeDistancia.every((marca) => marca <= 16_100)).toBe(true);
  });

  it("un perfil llano no se dibuja como una montaña", () => {
    const llano = [{ distanciaM: 0, alturaM: 500 }, { distanciaM: 1000, alturaM: 503 }];
    const ejes = ejesDelGrafico(llano);
    expect(ejes.alturaMaximaM - ejes.alturaMinimaM).toBeGreaterThanOrEqual(50);
  });
});

describe("pocas marcas de altura", () => {
  it("con el redondeo de las puntas no pasan de cinco líneas", () => {
    const ejes = ejesDelGrafico([{ distanciaM: 0, alturaM: 1760.8 }, { distanciaM: 3431, alturaM: 1856.4 }], 4);
    expect(ejes.marcasDeAltura.length).toBeLessThanOrEqual(5);
  });
});

describe("bajo el dedo", () => {
  it("elige el punto más cercano", () => {
    expect(puntoMasCercano(perfil, 3900)).toEqual(perfil[1]);
    expect(puntoMasCercano(perfil, 7000)).toEqual(perfil[2]);
    expect(puntoMasCercano(perfil, -50)).toEqual(perfil[0]);
    expect(puntoMasCercano(perfil, 99_999)).toEqual(perfil[3]);
    expect(puntoMasCercano([], 10)).toBeNull();
  });
});

describe("textos", () => {
  it("distancias y alturas como en el resto de la app", () => {
    expect(textoDeDistancia(850)).toBe("850 m");
    expect(textoDeDistancia(12_430)).toBe("12,4 km");
    expect(textoDeDistancia(3000)).toBe("3 km");
    expect(textoDeDistancia(3431)).toBe("3,4 km");
    expect(textoDeAltura(1034.4)).toMatch(/^1\.?034 m$/);
  });
});
