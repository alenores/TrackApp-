import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { FeatureCollection, Position } from "geojson";
import { describe, expect, it } from "vitest";
import { largoDeLinea, puntoEnDistancia } from "@/lib/caminos/geometria";
import { separarFiguras } from "@/lib/caminos/archivo";
import {
  actualizarDatosDeTramo,
  cambiarActividades,
  clasificacionDe,
  clasificarTramo,
  corregirLinea,
  crearCamino,
  dibujoDeLasPartes,
  parteEn,
  partirEntre,
  problemasDelCamino,
  ubicarEnCamino,
  type Camino,
} from "@/lib/caminos/partes";

/**
 * Las pruebas de las partes de un Camino.
 *
 * **Un hueco entre dos partes es un pedazo de camino sin condición de paso**:
 * en el cerro no se sabría si se pasa. Una clasificación que se corre de lugar
 * pinta «transitable» donde no se comprobó. Por eso cada prueba termina
 * revisando que el Camino siga sano.
 */

/** Una línea recta de este a oeste, con un punto cada ~95 m. */
function lineaRecta(puntos: number, lat = -31.4): Position[] {
  return Array.from({ length: puntos }, (_, i) => [-64.5 + i * 0.001, lat]);
}

function nuevo(actividades: string[] = ["trekking", "mountain_bike"], puntos = 11): Camino {
  const resultado = crearCamino(lineaRecta(puntos), actividades);
  if (!resultado.ok) throw new Error(resultado.error);
  return resultado.datos;
}

function sano<T extends Camino>(camino: T): T {
  expect(problemasDelCamino(camino)).toEqual([]);
  return camino;
}

function abrir<T>(resultado: { ok: true; datos: T } | { ok: false; error: string }): T {
  if (!resultado.ok) throw new Error(resultado.error);
  return resultado.datos;
}

describe("un Camino recién importado", () => {
  it("tiene una sola parte que cubre toda la línea, por explorar y sin complejidad en cada actividad", () => {
    const camino = sano(nuevo(["trekking", "kayak", "canyoning"]));

    expect(camino.partes).toHaveLength(1);
    expect(camino.partes[0].desdeM).toBe(0);
    expect(camino.partes[0].hastaM).toBe(camino.largoM);
    expect(camino.partes[0].observacion).toBeNull();
    expect(camino.partes[0].comprobadoEl).toBeNull();
    expect(camino.partes[0].porActividad).toEqual({
      trekking: { paso: "por_explorar", complejidad: null },
      kayak: { paso: "por_explorar", complejidad: null },
      canyoning: { paso: "por_explorar", complejidad: null },
    });
  });

  it("usa las actividades de siempre y exige al menos una", () => {
    expect(nuevo(["correr", "correr", "trekking"]).actividades).toEqual(["correr", "trekking"]);

    const sinActividad = crearCamino(lineaRecta(3), []);
    expect(sinActividad.ok).toBe(false);
    if (!sinActividad.ok) expect(sinActividad.error).toMatch(/al menos una actividad/);

    const inventada = crearCamino(lineaRecta(3), ["vehiculos"]);
    expect(inventada.ok).toBe(false);
    if (!inventada.ok) expect(inventada.error).toMatch(/Trekking, Correr, Mountain bike, Kayak y Canyoning/);
  });

  it("rechaza una línea que no se puede dibujar", () => {
    expect(crearCamino([[-64.5, -31.4]], ["trekking"]).ok).toBe(false);
    expect(crearCamino([[-64.5, -31.4], [-64.5, -31.4]], ["trekking"]).ok).toBe(false);
    expect(crearCamino([[-64.5, -31.4], [-300, -31.4]], ["trekking"]).ok).toBe(false);
  });
});

describe("el control de un Camino sano", () => {
  it("detecta un hueco, una superposición y una actividad sin clasificar", () => {
    const camino = abrir(partirEntre(nuevo(["trekking", "kayak"]), 300, 600));
    const conHueco = { ...camino, partes: camino.partes.map((parte, i) => (i === 1 ? { ...parte, desdeM: parte.desdeM + 5 } : parte)) };
    const superpuesto = { ...camino, partes: camino.partes.map((parte, i) => (i === 1 ? { ...parte, desdeM: parte.desdeM - 5 } : parte)) };
    const sinKayak = { ...camino, partes: camino.partes.map((parte) => ({ ...parte, porActividad: { trekking: parte.porActividad.trekking } })) };

    expect(problemasDelCamino(conHueco)).toContain("Hay un hueco antes de la parte 2.");
    expect(problemasDelCamino(superpuesto)).toContain("La parte 2 se superpone con la anterior.");
    expect(problemasDelCamino(sinKayak)).toContain("A la parte 1 le falta la clasificación de Kayak.");
  });
});

describe("partir", () => {
  it("partir y volver a partir no deja huecos ni superposiciones", () => {
    let camino = nuevo();
    const largo = camino.largoM;
    const cortes: Array<[number, number]> = [
      [100, 400],
      [250, 700],
      [50, 120],
      [600, 650],
      [0, 30],
      [880, largo],
      [395, 405],
    ];
    for (const [desde, hasta] of cortes) {
      camino = sano(abrir(partirEntre(camino, desde, hasta)));
    }

    const suma = camino.partes.reduce((total, parte) => total + (parte.hastaM - parte.desdeM), 0);
    expect(suma).toBeCloseTo(largo, 9);
    expect(camino.partes.every((parte) => parte.hastaM - parte.desdeM >= 2)).toBe(true);
  });

  it("partir no cambia ninguna clasificación ni la línea", () => {
    const original = abrir(clasificarTramo(nuevo(), 0, 500, "trekking", { paso: "transitable", complejidad: "media" }));
    const partido = sano(abrir(partirEntre(original, 100, 300)));

    expect(partido.coordenadas).toEqual(original.coordenadas);
    for (const distancia of [50, 150, 250, 400, 700]) {
      const antes = original.partes[parteEn(original, distancia)!];
      const despues = partido.partes[parteEn(partido, distancia)!];
      expect(despues.porActividad).toEqual(antes.porActividad);
    }
  });

  it("un toque casi encima de un borde cae en ese borde y no deja una parte de centímetros", () => {
    const camino = sano(abrir(partirEntre(nuevo(), 200, 500)));
    const otra = sano(abrir(partirEntre(camino, 200.8, 499.3)));
    expect(otra.partes.map((parte) => [parte.desdeM, parte.hastaM])).toEqual(
      camino.partes.map((parte) => [parte.desdeM, parte.hastaM]),
    );
  });

  it("no acepta dos lugares casi iguales", () => {
    const resultado = partirEntre(nuevo(), 300, 301);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toMatch(/al menos 2 metros/);
  });
});

describe("clasificar por actividad", () => {
  it("guarda una sola observación y fecha para la parte sin tocar sus actividades", () => {
    let camino = abrir(clasificarTramo(nuevo(), 200, 600, "mountain_bike", { paso: "a_pie", complejidad: "dificil" }));
    camino = sano(abrir(actualizarDatosDeTramo(camino, 200, 600, {
      observacion: "Sendero relevado en el monte",
      comprobadoEl: "2026-10-06",
    })));
    const parte = camino.partes[parteEn(camino, 400)!];
    expect(parte.observacion).toBe("Sendero relevado en el monte");
    expect(parte.comprobadoEl).toBe("2026-10-06");
    expect(clasificacionDe(parte, "mountain_bike")).toEqual({ paso: "a_pie", complejidad: "dificil" });
    expect(clasificacionDe(parte, "trekking")).toEqual({ paso: "por_explorar", complejidad: null });
    expect(camino.partes[parteEn(camino, 100)!].observacion).toBeNull();

    const partida = sano(abrir(partirEntre(camino, 300, 500)));
    expect(partida.partes[parteEn(partida, 350)!].observacion).toBe("Sendero relevado en el monte");
    expect(partida.partes[parteEn(partida, 550)!].comprobadoEl).toBe("2026-10-06");
  });

  it("cambiar una actividad no toca la otra ni la línea", () => {
    const camino = nuevo(["trekking", "mountain_bike"]);
    const clasificado = sano(abrir(clasificarTramo(camino, 200, 600, "mountain_bike", { paso: "a_pie", complejidad: "dificil" })));

    expect(clasificado.coordenadas).toBe(camino.coordenadas);
    expect(clasificado.largoM).toBe(camino.largoM);
    const medio = clasificado.partes[parteEn(clasificado, 400)!];
    expect(clasificacionDe(medio, "mountain_bike")).toEqual({ paso: "a_pie", complejidad: "dificil" });
    expect(clasificacionDe(medio, "trekking")).toEqual({ paso: "por_explorar", complejidad: null });
    const afuera = clasificado.partes[parteEn(clasificado, 100)!];
    expect(clasificacionDe(afuera, "mountain_bike")).toEqual({ paso: "por_explorar", complejidad: null });
  });

  it("cambiar solo la condición deja la complejidad, y al revés", () => {
    let camino = abrir(clasificarTramo(nuevo(), 0, 300, "trekking", { paso: "transitable", complejidad: "facil" }));
    camino = abrir(clasificarTramo(camino, 0, 300, "trekking", { paso: "sin_paso" }));
    expect(clasificacionDe(camino.partes[0], "trekking")).toEqual({ paso: "sin_paso", complejidad: "facil" });

    camino = sano(abrir(clasificarTramo(camino, 0, 300, "trekking", { complejidad: null })));
    expect(clasificacionDe(camino.partes[0], "trekking")).toEqual({ paso: "sin_paso", complejidad: null });
  });

  it("volver a clasificar una parte entera no la vuelve a partir", () => {
    const camino = abrir(clasificarTramo(nuevo(), 200, 600, "trekking", { paso: "transitable" }));
    const parte = camino.partes[parteEn(camino, 400)!];
    const otra = sano(abrir(clasificarTramo(camino, parte.desdeM, parte.hastaM, "trekking", { complejidad: "media" })));
    expect(otra.partes).toHaveLength(camino.partes.length);
  });

  it("una selección que cruza varias partes cambia solo esa actividad en todas", () => {
    let camino = abrir(clasificarTramo(nuevo(), 100, 300, "trekking", { paso: "transitable" }));
    camino = abrir(clasificarTramo(camino, 300, 500, "trekking", { paso: "a_pie" }));
    camino = sano(abrir(clasificarTramo(camino, 200, 400, "mountain_bike", { paso: "sin_paso" })));

    expect(clasificacionDe(camino.partes[parteEn(camino, 250)!], "trekking")?.paso).toBe("transitable");
    expect(clasificacionDe(camino.partes[parteEn(camino, 350)!], "trekking")?.paso).toBe("a_pie");
    expect(clasificacionDe(camino.partes[parteEn(camino, 250)!], "mountain_bike")?.paso).toBe("sin_paso");
    expect(clasificacionDe(camino.partes[parteEn(camino, 350)!], "mountain_bike")?.paso).toBe("sin_paso");
    expect(clasificacionDe(camino.partes[parteEn(camino, 450)!], "mountain_bike")?.paso).toBe("por_explorar");
  });

  it("no clasifica una actividad que el Camino no tiene, ni valores inventados", () => {
    const camino = nuevo(["trekking"]);
    const otraActividad = clasificarTramo(camino, 0, 100, "kayak", { paso: "transitable" });
    expect(otraActividad.ok).toBe(false);
    if (!otraActividad.ok) expect(otraActividad.error).toMatch(/Kayak/);

    const inventado = clasificarTramo(camino, 0, 100, "trekking", { paso: "volando" as never });
    expect(inventado.ok).toBe(false);
  });
});

describe("corregir la línea", () => {
  /** Tres tramos clasificados distinto: 0-300, 300-600 y 600-final. */
  function clasificado(): Camino & { id: number; nombre: string } {
    let camino: Camino = nuevo(["trekking", "mountain_bike"]);
    camino = abrir(clasificarTramo(camino, 0, 300, "trekking", { paso: "transitable", complejidad: "facil" }));
    camino = abrir(clasificarTramo(camino, 300, 600, "trekking", { paso: "a_pie", complejidad: "media" }));
    camino = abrir(clasificarTramo(camino, 600, camino.largoM, "mountain_bike", { paso: "sin_paso", complejidad: "dificil" }));
    camino = abrir(actualizarDatosDeTramo(camino, 300, 600, {
      observacion: "Paso visto en el terreno",
      comprobadoEl: "2026-10-06",
    }));
    return { ...camino, id: 7, nombre: "Bajada al río" };
  }

  it("mover un punto del medio conserva todas las clasificaciones", () => {
    const antes = clasificado();
    const nuevas = antes.coordenadas.map((punto, i) => (i === 5 ? [punto[0], punto[1] + 0.002] : punto));
    const camino = sano(abrir(corregirLinea(antes, nuevas)));

    // Sigue siendo el mismo Camino.
    expect(camino.id).toBe(7);
    expect(camino.nombre).toBe("Bajada al río");
    expect(camino.actividades).toEqual(antes.actividades);
    expect(camino.partes).toHaveLength(antes.partes.length);
    expect(camino.partes.map((parte) => parte.porActividad)).toEqual(antes.partes.map((parte) => parte.porActividad));
    expect(camino.partes.map(({ observacion, comprobadoEl }) => ({ observacion, comprobadoEl }))).toEqual(
      antes.partes.map(({ observacion, comprobadoEl }) => ({ observacion, comprobadoEl })),
    );

    // Lo de antes del cambio, igual y en el mismo lugar.
    expect(camino.partes[0]).toEqual(antes.partes[0]);
    expect(clasificacionDe(camino.partes[parteEn(camino, 350)!], "trekking")).toEqual({ paso: "a_pie", complejidad: "media" });

    // Lo de después queda corrido lo que creció la línea, sin perder sus datos.
    const crecio = camino.largoM - antes.largoM;
    expect(crecio).toBeGreaterThan(0);
    const ultimaDespues = camino.partes[camino.partes.length - 1];
    expect(ultimaDespues.hastaM).toBe(camino.largoM);
  });

  it("alargar el final extiende la última parte sin cambiar sus datos", () => {
    const antes = clasificado();
    const ultimo = antes.coordenadas[antes.coordenadas.length - 1];
    const nuevas = [...antes.coordenadas, [ultimo[0] + 0.001, ultimo[1]], [ultimo[0] + 0.002, ultimo[1]]];
    const camino = sano(abrir(corregirLinea(antes, nuevas)));

    expect(camino.partes).toHaveLength(antes.partes.length);
    expect(camino.partes.map((parte) => parte.porActividad)).toEqual(antes.partes.map((parte) => parte.porActividad));
    expect(camino.partes.at(-1)?.hastaM).toBe(camino.largoM);
    expect(camino.partes.at(-1)?.hastaM).toBeGreaterThan(antes.largoM);
  });

  it("acortar desde el comienzo conserva los datos de la línea que queda", () => {
    const antes = clasificado();
    const camino = sano(abrir(corregirLinea(antes, antes.coordenadas.slice(2))));

    // Lo que estaba a 400 m ahora está a 400 m menos lo recortado.
    const recortado = antes.largoM - camino.largoM;
    expect(clasificacionDe(camino.partes[parteEn(camino, 400 - recortado)!], "trekking")).toEqual({ paso: "a_pie", complejidad: "media" });
  });

  it("redibujar toda la línea conserva las partes y su clasificación", () => {
    const antes = clasificado();
    const camino = sano(abrir(corregirLinea(antes, lineaRecta(6, -31.45))));

    expect(camino.id).toBe(7);
    expect(camino.partes).toHaveLength(antes.partes.length);
    expect(camino.partes.map((parte) => parte.porActividad)).toEqual(antes.partes.map((parte) => parte.porActividad));
  });

  it("si la línea no cambió, mantiene exactamente las partes", () => {
    const antes = clasificado();
    const camino = sano(abrir(corregirLinea(antes, antes.coordenadas.map((punto) => [...punto]))));
    expect(camino.partes).toEqual(antes.partes);
  });

  it("clasificar después de corregir sigue siendo una acción separada", () => {
    const antes = clasificado();
    const nuevas = antes.coordenadas.map((punto, i) => (i === 8 ? [punto[0], punto[1] - 0.001] : punto));
    const camino = sano(abrir(corregirLinea(antes, nuevas)));
    const geometriaCorregida = camino.coordenadas;
    const cambiado = sano(abrir(clasificarTramo(camino, camino.partes[0].desdeM, camino.partes[0].hastaM, "mountain_bike", { paso: "transitable" })));
    expect(cambiado.coordenadas).toBe(geometriaCorregida);
    expect(clasificacionDe(cambiado.partes[0], "mountain_bike")?.paso).toBe("transitable");
    expect(clasificacionDe(cambiado.partes.at(-1)!, "mountain_bike")?.paso).toBe("sin_paso");
  });

  it("invertir el sentido de la línea conserva la clasificación en cada lugar", () => {
    const antes = clasificado();
    const camino = sano(abrir(corregirLinea(antes, [...antes.coordenadas].reverse())));
    expect(camino.partes).toHaveLength(antes.partes.length);
    expect(camino.partes[0].porActividad).toEqual(antes.partes.at(-1)?.porActividad);
    expect(camino.partes.at(-1)?.porActividad).toEqual(antes.partes[0].porActividad);
  });
});

describe("las actividades del Camino", () => {
  it("sumar una actividad la agrega por explorar en todas las partes y no toca las otras", () => {
    const camino = abrir(clasificarTramo(nuevo(["trekking"]), 0, 300, "trekking", { paso: "transitable" }));
    const conKayak = sano(abrir(cambiarActividades(camino, ["trekking", "kayak"])));

    expect(conKayak.partes.every((parte) => clasificacionDe(parte, "kayak")?.paso === "por_explorar")).toBe(true);
    expect(clasificacionDe(conKayak.partes[0], "trekking")?.paso).toBe("transitable");
  });

  it("sacar una actividad la borra de todas las partes, pero nunca la última", () => {
    const camino = nuevo(["trekking", "kayak"]);
    const sinKayak = sano(abrir(cambiarActividades(camino, ["trekking"])));
    expect(sinKayak.partes.every((parte) => clasificacionDe(parte, "kayak") === null)).toBe(true);

    expect(cambiarActividades(camino, []).ok).toBe(false);
  });
});

describe("dibujar y tocar", () => {
  it("las partes juntas reproducen la línea, sin huecos entre una y otra", () => {
    let camino = nuevo();
    camino = abrir(partirEntre(camino, 123.4, 456.7));
    camino = abrir(partirEntre(camino, 700, 800));
    const dibujo = dibujoDeLasPartes(camino);

    expect(dibujo[0].coordenadas[0]).toEqual(camino.coordenadas[0]);
    expect(dibujo[dibujo.length - 1].coordenadas.at(-1)).toEqual(camino.coordenadas.at(-1));
    for (let i = 1; i < dibujo.length; i += 1) {
      expect(dibujo[i].coordenadas[0]).toEqual(dibujo[i - 1].coordenadas.at(-1));
    }
    const sumaDeLargos = dibujo.reduce((total, cada) => total + largoDeLinea(cada.coordenadas), 0);
    expect(sumaDeLargos).toBeCloseTo(camino.largoM, 3);
  });

  it("un toque cerca de la línea cae en el lugar correcto", () => {
    const camino = nuevo();
    const punto = puntoEnDistancia(camino.coordenadas, 333);
    const lugar = ubicarEnCamino(camino, punto[0], punto[1] + 0.0001)!;
    expect(lugar.distanciaM).toBeCloseTo(333, 0);
    expect(lugar.alejamientoM).toBeGreaterThan(10);
    expect(lugar.alejamientoM).toBeLessThan(12);
  });
});

describe("las siete alternativas de un proyecto", () => {
  it("dan siete Caminos, cada uno con su largo, y ninguno es la suma", () => {
    const figuras: FeatureCollection = {
      type: "FeatureCollection",
      features: Array.from({ length: 7 }, (_, i) => ({
        type: "Feature",
        properties: { name: `Alternativa ${i + 1}` },
        geometry: { type: "LineString", coordinates: lineaRecta(5 + i * 3, -31 - i * 0.01) },
      })),
    };
    const { lineas, puntos } = separarFiguras(figuras);
    expect(puntos).toHaveLength(0);

    const caminos = lineas.map((linea) => abrir(crearCamino(linea.coordenadas, ["mountain_bike"])));
    expect(caminos).toHaveLength(7);
    const total = caminos.reduce((suma, camino) => suma + camino.largoM, 0);
    caminos.forEach((camino, i) => {
      sano(camino);
      expect(camino.largoM).toBeCloseTo(lineas[i].largoM, 9);
      expect(camino.largoM).toBeLessThan(total);
    });
  });
});

describe("un Camino no pertenece a una zona ni a un sector", () => {
  it("su forma no tiene zona ni sector", () => {
    expect(Object.keys(nuevo()).sort()).toEqual(["actividades", "coordenadas", "largoM", "partes"]);
  });

  it("ningún archivo del módulo habla de zonas ni sectores", () => {
    const carpeta = join(process.cwd(), "lib", "caminos");
    const fuentes = readdirSync(carpeta).filter((nombre) => nombre.endsWith(".ts") && !nombre.endsWith(".test.ts"));
    expect(fuentes.length).toBeGreaterThan(0);
    for (const nombre of fuentes) {
      const contenido = readFileSync(join(carpeta, nombre), "utf8");
      expect(contenido, nombre).not.toMatch(/zona_?id|sector_?id|zonaId|sectorId/i);
    }
  });
});
