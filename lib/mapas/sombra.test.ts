import { describe, expect, it } from "vitest";
import { alturaTerrarium } from "@/lib/alturas/relieve";
import {
  LADO_DE_LA_SOMBRA,
  aTerrarium,
  bordesEnMetros,
  completarConRespaldo,
  juntarDeCerca,
  leerGrillaDeIdecor,
  llevarAlPedazo,
  recortar,
  suavizar,
  type GrillaDeAlturas,
} from "@/lib/mapas/sombra";

/**
 * Las pruebas de las cuentas del sombreado (decisión 079).
 *
 * **Por qué esto lleva pruebas.** Un sombreado corrido o dado vuelta no da
 * error: dibuja laderas donde hay valles, prolijo y equivocado, encima de la
 * foto. Eso se descubre en el cerro.
 */

function grilla(ancho: number, alto: number, valor: (c: number, f: number) => number): GrillaDeAlturas {
  const alturas = new Float32Array(ancho * alto);
  for (let f = 0; f < alto; f += 1) for (let c = 0; c < ancho; c += 1) alturas[f * ancho + c] = valor(c, f);
  return { ancho, alto, alturas };
}

describe("los bordes de un pedazo", () => {
  it("el mundo entero en el acercamiento 0 va de punta a punta", () => {
    const b = bordesEnMetros(0, 0, 0);
    expect(b.oeste).toBeCloseTo(-20037508.34, 1);
    expect(b.este).toBeCloseTo(20037508.34, 1);
    expect(b.norte).toBeCloseTo(20037508.34, 1);
    expect(b.sur).toBeCloseTo(-20037508.34, 1);
    expect(b.puntos).toBe(LADO_DE_LA_SOMBRA);
  });

  it("la fila 0 es la de arriba: el norte tiene el número más grande", () => {
    const b = bordesEnMetros(14, 5242, 9699);
    expect(b.norte).toBeGreaterThan(b.sur);
    expect(b.este).toBeGreaterThan(b.oeste);
    // Los Gigantes: unos -64,8° de longitud y -31,4° de latitud.
    expect(b.oeste).toBeCloseTo(-7215655.47, 0);
    expect(b.norte).toBeCloseTo(-3686099.25, 0);
  });

  it("el margen agranda el pedazo lo mismo para cada lado", () => {
    const sin = bordesEnMetros(14, 5242, 9699);
    const con = bordesEnMetros(14, 5242, 9699, 4);
    const punto = (sin.este - sin.oeste) / LADO_DE_LA_SOMBRA;
    expect(con.puntos).toBe(LADO_DE_LA_SOMBRA + 8);
    expect(sin.oeste - con.oeste).toBeCloseTo(4 * punto, 6);
    expect(con.norte - sin.norte).toBeCloseTo(4 * punto, 6);
  });
});

describe("leer lo que manda IDECOR", () => {
  const texto = [
    "Grid bounds: GeneralBounds[(-30.0, -20.0), (30.0, 20.0)]",
    "Grid CRS: PROJCS[\"WGS 84 / Pseudo-Mercator\",",
    "  PARAMETER[\"false_easting\", 0.0],",
    "Grid range: GridEnvelope2D[0..2, 0..1]",
    "2000 2001 2002",
    "1990 32767 1992",
    "",
  ].join("\n");

  it("toma solo las filas de números, de arriba hacia abajo, y los bordes reales", () => {
    const { grilla, bordes } = leerGrillaDeIdecor(texto);
    expect(grilla.ancho).toBe(3);
    expect(grilla.alto).toBe(2);
    expect(Array.from(grilla.alturas.slice(0, 3))).toEqual([2000, 2001, 2002]);
    expect(grilla.alturas[3]).toBe(1990);
    expect(bordes).toEqual({ oeste: -30, sur: -20, este: 30, norte: 20 });
  });

  it("donde IDECOR no tiene dato queda sin altura, no a 32767 metros", () => {
    expect(Number.isNaN(leerGrillaDeIdecor(texto).grilla.alturas[4])).toBe(true);
  });

  it("una grilla torcida o sin ubicar es una falla, con el motivo", () => {
    expect(() => leerGrillaDeIdecor(texto.replace("1990 32767 1992", "1990 1991"))).toThrow(
      /fila de 2 puntos y las anteriores tenían 3/,
    );
    expect(() => leerGrillaDeIdecor(texto.replace(/Grid bounds.*\n/, ""))).toThrow(/dónde queda/);
  });
});

describe("llevar lo de IDECOR a la grilla exacta del pedazo", () => {
  // Un pedazo del acercamiento 14 en Los Gigantes, y una grilla de IDECOR un
  // poco más grande y corrida, como la que manda de verdad.
  const z = 14;
  const x = 5242;
  const y = 9699;
  const pedazo = bordesEnMetros(z, x, y);
  const lado = pedazo.este - pedazo.oeste;
  const bordes = {
    oeste: pedazo.oeste - 37,
    este: pedazo.este + 41,
    sur: pedazo.sur - 29,
    norte: pedazo.norte + 53,
  };
  // Un plano inclinado: la altura sube hacia el este y hacia el norte. Así se
  // puede calcular a mano qué altura corresponde a cada punto.
  const altura = (metrosX: number, metrosY: number) =>
    1000 + (metrosX - pedazo.oeste) * 0.1 + (metrosY - pedazo.sur) * 0.05;
  const columnas = 600;
  const filas = 580;
  const deIdecor = grilla(columnas, filas, (c, f) =>
    altura(
      bordes.oeste + ((c + 0.5) * (bordes.este - bordes.oeste)) / columnas,
      bordes.norte - ((f + 0.5) * (bordes.norte - bordes.sur)) / filas,
    ),
  );

  it("cada punto del pedazo recibe la altura de su lugar, no la del lugar corrido", () => {
    const resultado = llevarAlPedazo({ grilla: deIdecor, bordes }, z, x, y, 0);
    expect(resultado.ancho).toBe(LADO_DE_LA_SOMBRA);
    const paso = lado / LADO_DE_LA_SOMBRA;
    for (const [columna, fila] of [[0, 0], [511, 0], [0, 511], [255, 300], [511, 511]]) {
      const esperada = altura(pedazo.oeste + (columna + 0.5) * paso, pedazo.norte - (fila + 0.5) * paso);
      expect(resultado.alturas[fila * LADO_DE_LA_SOMBRA + columna]).toBeCloseTo(esperada, 1);
    }
  });

  it("dos pedazos vecinos coinciden en la unión: no hay escalón", () => {
    const abajo = bordesEnMetros(z, x, y + 1);
    const bordesDeAbajo = { ...bordes, norte: abajo.norte + 53, sur: abajo.sur - 29 };
    const grillaDeAbajo = grilla(columnas, filas, (c, f) =>
      altura(
        bordesDeAbajo.oeste + ((c + 0.5) * (bordesDeAbajo.este - bordesDeAbajo.oeste)) / columnas,
        bordesDeAbajo.norte - ((f + 0.5) * (bordesDeAbajo.norte - bordesDeAbajo.sur)) / filas,
      ),
    );
    const arriba = llevarAlPedazo({ grilla: deIdecor, bordes }, z, x, y, 0);
    const debajo = llevarAlPedazo({ grilla: grillaDeAbajo, bordes: bordesDeAbajo }, z, x, y + 1, 0);
    const ultimaDeArriba = arriba.alturas[511 * 512 + 200];
    const primeraDeAbajo = debajo.alturas[200];
    const anteultimaDeArriba = arriba.alturas[510 * 512 + 200];
    // Bajando un punto cambia lo mismo dentro del pedazo que al cruzar la unión.
    expect(ultimaDeArriba - primeraDeAbajo).toBeCloseTo(anteultimaDeArriba - ultimaDeArriba, 2);
  });

  it("donde IDECOR no tiene dato, el punto queda sin dato para que lo complete el respaldo", () => {
    const conHueco = { ...deIdecor, alturas: deIdecor.alturas.slice() };
    conHueco.alturas.fill(NaN, 0, columnas * 40);
    const resultado = llevarAlPedazo({ grilla: conHueco, bordes }, z, x, y, 0);
    expect(Number.isNaN(resultado.alturas[0])).toBe(true);
    expect(Number.isNaN(resultado.alturas[511 * 512])).toBe(false);
  });
});

describe("completar con el relieve de 30 m", () => {
  it("solo toca los puntos sin dato y respeta el resto", () => {
    const g = grilla(2, 2, (c, f) => (c === 1 && f === 1 ? NaN : 100));
    const sinAltura = completarConRespaldo(g, (c, f) => 500 + c + f);
    expect(Array.from(g.alturas)).toEqual([100, 100, 100, 502]);
    expect(sinAltura).toBe(0);
  });

  it("cuenta los puntos que ni el respaldo conoce", () => {
    const g = grilla(2, 1, () => NaN);
    expect(completarConRespaldo(g, () => NaN)).toBe(2);
  });
});

describe("suavizar", () => {
  it("un terreno parejo queda igual", () => {
    const g = suavizar(grilla(9, 9, () => 1500), 1);
    for (const altura of g.alturas) expect(altura).toBeCloseTo(1500, 3);
  });

  it("una rampa pareja queda igual lejos del borde: no inventa ni borra pendiente", () => {
    const g = suavizar(grilla(15, 15, (c) => 1000 + 5 * c), 1);
    expect(g.alturas[7 * 15 + 7]).toBeCloseTo(1035, 3);
  });

  it("un pico suelto se achata: eso es lo que limpia las rayas del dato", () => {
    const g = suavizar(grilla(9, 9, (c, f) => (c === 4 && f === 4 ? 1100 : 1000)), 1);
    expect(g.alturas[4 * 9 + 4]).toBeLessThan(1050);
    expect(g.alturas[4 * 9 + 4]).toBeGreaterThan(1000);
  });
});

describe("recortar el margen", () => {
  it("saca lo mismo de cada lado y deja el centro en su lugar", () => {
    const g = recortar(grilla(6, 6, (c, f) => f * 10 + c), 2);
    expect(g.ancho).toBe(2);
    expect(g.alto).toBe(2);
    expect(Array.from(g.alturas)).toEqual([22, 23, 32, 33]);
  });
});

describe("escribir la altura como imagen", () => {
  it("se lee de vuelta igual, con la misma cuenta que usa el mapa", () => {
    const g = grilla(3, 1, (c) => [2373.5, -20, 0][c]);
    const puntos = aTerrarium(g, 0.5);
    for (let i = 0; i < 3; i += 1) {
      expect(alturaTerrarium(puntos[i * 3], puntos[i * 3 + 1], puntos[i * 3 + 2])).toBeCloseTo(g.alturas[i], 6);
    }
  });

  it("redondea de a medio metro", () => {
    const puntos = aTerrarium(grilla(1, 1, () => 1000.3), 0.5);
    expect(alturaTerrarium(puntos[0], puntos[1], puntos[2])).toBe(1000.5);
  });

  it("un punto sin altura se escribe a nivel del mar en vez de romper la imagen", () => {
    const puntos = aTerrarium(grilla(1, 1, () => NaN), 0.5);
    expect(alturaTerrarium(puntos[0], puntos[1], puntos[2])).toBe(0);
  });
});

describe("armar un pedazo de lejos con los de cerca", () => {
  it("cada punto es el promedio de los puntos de cerca que caen adentro", () => {
    // Cuatro hijos de 512, cada uno parejo a una altura distinta.
    const hijos = [1000, 1100, 1200, 1300].map((altura) => grilla(512, 512, () => altura));
    const lejos = juntarDeCerca(hijos, 2, () => NaN);
    expect(lejos.ancho).toBe(512);
    expect(lejos.alturas[0]).toBe(1000);
    expect(lejos.alturas[511]).toBe(1100);
    expect(lejos.alturas[511 * 512]).toBe(1200);
    expect(lejos.alturas[511 * 512 + 511]).toBe(1300);
  });

  it("promedia de verdad: una rampa de cerca da la rampa a la mitad de resolución", () => {
    const hijo = grilla(512, 512, (c) => c);
    const lejos = juntarDeCerca([hijo, hijo, hijo, hijo], 2, () => NaN);
    // Los puntos 0 y 1 de cerca forman el 0 de lejos: (0 + 1) / 2.
    expect(lejos.alturas[0]).toBe(0.5);
    expect(lejos.alturas[1]).toBe(2.5);
  });

  it("donde falta un hijo usa el respaldo", () => {
    const lejos = juntarDeCerca([grilla(512, 512, () => 1000), null, null, null], 2, () => 777);
    expect(lejos.alturas[0]).toBe(1000);
    expect(lejos.alturas[511]).toBe(777);
  });
});
