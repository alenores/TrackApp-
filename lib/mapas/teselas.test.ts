import { describe, expect, it } from "vitest";
import {
  ACERCAMIENTO_DEL_RELIEVE,
  ACERCAMIENTO_MAXIMO,
  ACERCAMIENTO_MINIMO,
  type Tesela,
  claveDeTesela,
  columnaDeTesela,
  cuantasTeselas,
  cuantasTeselasDelRelieve,
  filaDeTesela,
  ladoDeLaGrilla,
  teselaDeClave,
  teselasDelRectangulo,
  teselasDeLaFoto,
  teselasDelRelieve,
} from "@/lib/mapas/teselas";
import type { Rectangulo } from "@/types/database";

/**
 * Las pruebas de la cuenta de teselas.
 *
 * **Por qué esto lleva pruebas.** De esta cuenta salen dos cosas que el usuario
 * ve: cuánto va a pesar una descarga y si el mapa que bajó tapa el lugar donde
 * está parado. Un signo cambiado acá no rompe nada a la vista: baja el mapa del
 * lugar equivocado, y eso recién se descubre en el cerro.
 */

/**
 * La esquina noroeste de una tesela, en grados.
 *
 * Es la cuenta al revés de la del archivo. Está escrita acá a propósito: si las
 * dos estuvieran en el mismo lado, un error compartido se probaría a sí mismo.
 */
function esquinaNoroeste({ z, x, y }: { z: number; x: number; y: number }) {
  const lado = ladoDeLaGrilla(z);
  const lon = (x / lado) * 360 - 180;
  const proporcion = Math.PI * (1 - (2 * y) / lado);
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(proporcion));
  return { lat, lon };
}

/** Un sector de sierra de unos 6 por 4 kilómetros, como los que usa la app. */
const SECTOR: Rectangulo = {
  latNorte: -31.9,
  latSur: -31.94,
  lonOeste: -64.9,
  lonEste: -64.836,
};

describe("la grilla", () => {
  it("el mundo entero es una sola tesela en el acercamiento más lejano", () => {
    expect(ladoDeLaGrilla(0)).toBe(1);
    expect(columnaDeTesela(-64.18, 0)).toBe(0);
    expect(filaDeTesela(-31.42, 0)).toBe(0);
  });

  it("el punto donde se cruzan el ecuador y el meridiano cae donde tiene que caer", () => {
    // En el acercamiento 1 el mundo son cuatro teselas. El cruce está justo en
    // el vértice de las cuatro, y cae en la de abajo a la derecha.
    expect(columnaDeTesela(0, 1)).toBe(1);
    expect(filaDeTesela(0, 1)).toBe(1);
  });

  it("Córdoba cae en el cuarto de abajo a la izquierda", () => {
    expect(columnaDeTesela(-64.18, 1)).toBe(0);
    expect(filaDeTesela(-31.42, 1)).toBe(1);
  });

  it("nunca se sale de la grilla, ni en los bordes del mundo", () => {
    for (const z of [0, 5, 10, 15]) {
      const ultima = ladoDeLaGrilla(z) - 1;
      expect(columnaDeTesela(-180, z)).toBe(0);
      expect(columnaDeTesela(180, z)).toBe(ultima);
      expect(filaDeTesela(90, z)).toBe(0);
      expect(filaDeTesela(-90, z)).toBe(ultima);
    }
  });
});

describe("dónde cae un punto", () => {
  it("la tesela que devuelve la cuenta es la que contiene al punto", () => {
    const lat = -31.9214;
    const lon = -64.8677;

    for (let z = 8; z <= ACERCAMIENTO_MAXIMO; z += 1) {
      const x = columnaDeTesela(lon, z);
      const y = filaDeTesela(lat, z);

      const noroeste = esquinaNoroeste({ z, x, y });
      const sudeste = esquinaNoroeste({ z, x: x + 1, y: y + 1 });

      expect(lon).toBeGreaterThanOrEqual(noroeste.lon);
      expect(lon).toBeLessThan(sudeste.lon);
      expect(lat).toBeLessThanOrEqual(noroeste.lat);
      expect(lat).toBeGreaterThan(sudeste.lat);
    }
  });

  it("confundir latitud con longitud da otra tesela", () => {
    // La trampa de siempre: los dos números son negativos y parecidos, y
    // pasarlos al revés no tira ningún error. Tiene que notarse.
    const bien = { x: columnaDeTesela(-64.18, 12), y: filaDeTesela(-31.42, 12) };
    const alReves = { x: columnaDeTesela(-31.42, 12), y: filaDeTesela(-64.18, 12) };

    expect(alReves).not.toEqual(bien);
  });
});

describe("las teselas de un rectángulo", () => {
  it("contar y listar dan lo mismo", () => {
    expect(teselasDelRectangulo(SECTOR).length).toBe(cuantasTeselas(SECTOR));
  });

  it("no repite ninguna", () => {
    const teselas = teselasDelRectangulo(SECTOR);
    const claves = new Set(teselas.map(claveDeTesela));
    expect(claves.size).toBe(teselas.length);
  });

  it("empieza por lo lejano y termina en lo cercano", () => {
    const teselas = teselasDelRectangulo(SECTOR);
    expect(teselas[0].z).toBe(ACERCAMIENTO_MINIMO);
    expect(teselas[teselas.length - 1].z).toBe(ACERCAMIENTO_MAXIMO);

    for (let i = 1; i < teselas.length; i += 1) {
      expect(teselas[i].z).toBeGreaterThanOrEqual(teselas[i - 1].z);
    }
  });

  it("incluye la tesela del centro del rectángulo en cada acercamiento", () => {
    const lat = (SECTOR.latNorte + SECTOR.latSur) / 2;
    const lon = (SECTOR.lonOeste + SECTOR.lonEste) / 2;
    const claves = new Set(teselasDelRectangulo(SECTOR).map(claveDeTesela));

    for (let z = ACERCAMIENTO_MINIMO; z <= ACERCAMIENTO_MAXIMO; z += 1) {
      const clave = claveDeTesela({
        z,
        x: columnaDeTesela(lon, z),
        y: filaDeTesela(lat, z),
      });
      expect(claves.has(clave)).toBe(true);
    }
  });

  it("cubre las cuatro esquinas del rectángulo", () => {
    const claves = new Set(teselasDelRectangulo(SECTOR).map(claveDeTesela));
    const esquinas = [
      { lat: SECTOR.latNorte, lon: SECTOR.lonOeste },
      { lat: SECTOR.latNorte, lon: SECTOR.lonEste },
      { lat: SECTOR.latSur, lon: SECTOR.lonOeste },
      { lat: SECTOR.latSur, lon: SECTOR.lonEste },
    ];

    for (const { lat, lon } of esquinas) {
      const clave = claveDeTesela({
        z: ACERCAMIENTO_MAXIMO,
        x: columnaDeTesela(lon, ACERCAMIENTO_MAXIMO),
        y: filaDeTesela(lat, ACERCAMIENTO_MAXIMO),
      });
      expect(claves.has(clave)).toBe(true);
    }
  });

  it("el mundo entero hasta el tercer acercamiento son veintiún pedazos", () => {
    const mundo: Rectangulo = {
      latNorte: 85,
      latSur: -85,
      lonOeste: -180,
      lonEste: 180,
    };
    expect(cuantasTeselas(mundo, 2)).toBe(1 + 4 + 16);
  });
});

describe("el tamaño de una descarga", () => {
  it("un sector de sierra se baja en menos de cien pedazos", () => {
    // La guardia de verdad: subir el acercamiento máximo multiplica por cuatro
    // el peso de cada sector. Si alguien lo sube sin querer, esto lo frena acá
    // y no en el celular del usuario con la descarga a medio hacer.
    expect(cuantasTeselas(SECTOR)).toBeLessThan(100);
  });

  it("una zona entera pesa muchísimo más que un sector, y por eso existen los sectores", () => {
    const zona: Rectangulo = {
      latNorte: -31.6,
      latSur: -32.0,
      lonOeste: -65.2,
      lonEste: -64.6,
    };
    expect(cuantasTeselas(zona)).toBeGreaterThan(cuantasTeselas(SECTOR) * 20);
  });
});

describe("el nombre de una tesela", () => {
  it("ida y vuelta dan lo mismo", () => {
    const tesela = { z: 14, x: 5281, y: 9702 };
    expect(teselaDeClave(claveDeTesela(tesela))).toEqual(tesela);
  });

  it("un nombre que no es un nombre no devuelve una tesela inventada", () => {
    expect(teselaDeClave("14/5281")).toBeNull();
    expect(teselaDeClave("14/5281/9702/3")).toBeNull();
    expect(teselaDeClave("14/hola/9702")).toBeNull();
    expect(teselaDeClave("14/-1/9702")).toBeNull();
    expect(teselaDeClave("")).toBeNull();
  });
});

describe("el relieve", () => {
  const sierra = { latNorte: -31.97, latSur: -32.01, lonOeste: -64.96, lonEste: -64.9 };

  it("sus pedazos se nombran aparte y el nombre va y vuelve", () => {
    const pedazo: Tesela = { z: 12, x: 1309, y: 2436, capa: "relieve" };
    expect(claveDeTesela(pedazo)).toBe("relieve/12/1309/2436");
    expect(teselaDeClave("relieve/12/1309/2436")).toEqual(pedazo);
    expect(teselaDeClave("12/1309/2436")).toEqual({ z: 12, x: 1309, y: 2436 });
  });

  it("un nombre inventado no se toma por relieve", () => {
    expect(teselaDeClave("sombra/12/1/2")).toBeNull();
    expect(teselaDeClave("relieve/12/1")).toBeNull();
  });

  it("un sector de sierra son un puñado de pedazos, en un solo acercamiento", () => {
    const pedazos = teselasDelRelieve(sierra);
    expect(pedazos.length).toBe(cuantasTeselasDelRelieve(sierra));
    expect(pedazos.length).toBeLessThanOrEqual(4);
    expect(pedazos.every((pedazo) => pedazo.z === ACERCAMIENTO_DEL_RELIEVE)).toBe(true);
    expect(pedazos.every((pedazo) => pedazo.capa === "relieve")).toBe(true);
  });

  it("no comparte nombre con ningún pedazo del dibujo", () => {
    const delDibujo = new Set(teselasDelRectangulo(sierra).map(claveDeTesela));
    for (const pedazo of teselasDelRelieve(sierra)) {
      expect(delDibujo.has(claveDeTesela(pedazo))).toBe(false);
    }
  });
});

describe("la foto satelital", () => {
  const sierra = { latNorte: -31.97, latSur: -32.01, lonOeste: -64.96, lonEste: -64.9 };

  it("sus pedazos se nombran aparte y el nombre va y vuelve", () => {
    const pedazo: Tesela = { z: 15, x: 10473, y: 19460, capa: "satelital" };
    expect(claveDeTesela(pedazo)).toBe("satelital/15/10473/19460");
    expect(teselaDeClave("satelital/15/10473/19460")).toEqual(pedazo);
  });

  it("cubre la misma grilla que el dibujo, pedazo por pedazo", () => {
    const delDibujo = teselasDelRectangulo(sierra).map(({ z, x, y }) => `${z}/${x}/${y}`);
    const deLaFoto = teselasDeLaFoto(sierra).map(({ z, x, y }) => `${z}/${x}/${y}`);
    expect(deLaFoto).toEqual(delDibujo);
  });

  it("no comparte nombre con ningún pedazo del dibujo ni del relieve", () => {
    const otros = new Set(
      [...teselasDelRectangulo(sierra), ...teselasDelRelieve(sierra)].map(claveDeTesela),
    );
    for (const pedazo of teselasDeLaFoto(sierra)) {
      expect(otros.has(claveDeTesela(pedazo))).toBe(false);
    }
  });
});
