import { describe, expect, it } from "vitest";
import type { Position } from "geojson";
import {
  achicarLinea,
  cartelAlSalir,
  cortarLinea,
  hayQueConfirmarSalida,
  largoDeParte,
  pegarPunta,
  porDondeVa,
  proponerPartes,
  puntaCercana,
  type CaminoParaComparar,
} from "@/lib/caminos/desde-salida";

// Cerca del Challenger: metros al este y al norte de un origen.
const ORIGEN = [-64.32, -31.28];
const POR_METRO_LON = 1 / (111_320 * Math.cos((ORIGEN[1] * Math.PI) / 180));
const POR_METRO_LAT = 1 / 110_540;
function en(esteM: number, norteM: number): Position {
  return [ORIGEN[0] + esteM * POR_METRO_LON, ORIGEN[1] + norteM * POR_METRO_LAT];
}
/** Un punto por metro, como un GPS: de `desde` a `hasta`, con un corrimiento al norte. */
function gps(desdeEste: number, hastaEste: number, norte: (este: number) => number): Position[] {
  const puntos: Position[] = [];
  const paso = desdeEste <= hastaEste ? 1 : -1;
  for (let este = desdeEste; paso > 0 ? este <= hastaEste : este >= hastaEste; este += paso) puntos.push(en(este, norte(este)));
  return puntos;
}

// Un Camino recto de 1 km hacia el este, del metro 300 al 1300.
const CHALLENGER: CaminoParaComparar = { id: 39, nombre: "Tramo Challenger", coordenadas: [en(300, 0), en(1300, 0)] };

describe("achicarLinea", () => {
  it("una recta de mil puntos queda en sus dos puntas", () => {
    expect(achicarLinea(gps(0, 1000, () => 0))).toHaveLength(2);
  });

  it("una curva conserva su forma", () => {
    const codo = [...gps(0, 500, () => 0), ...gps(500, 500, () => 0).slice(1), ...Array.from({ length: 500 }, (_, i) => en(500, i + 1))];
    const achicada = achicarLinea(codo);
    expect(achicada.length).toBeGreaterThanOrEqual(3);
    expect(achicada.length).toBeLessThan(10);
  });
});

describe("proponerPartes", () => {
  it("separa lo nuevo de lo que va sobre el Camino, aunque el GPS vaya corrido unos metros", () => {
    // 300 m nuevos, el Camino entero con el GPS 8 m al norte, y 300 m nuevos al norte.
    const linea = [...gps(0, 300, () => 60 - 0.2 * 300 + 0), ...gps(301, 1300, () => 8), ...gps(1300, 1300, () => 8).slice(1),
      ...Array.from({ length: 300 }, (_, i) => en(1300, 9 + i))];
    const partes = proponerPartes(achicarLinea(linea), [CHALLENGER]);
    expect(partes.map((parte) => parte.sobre?.nombre ?? "nueva")).toEqual(["nueva", "Tramo Challenger", "nueva"]);
    expect(largoDeParte(partes[1].coordenadas)).toBeGreaterThan(950);
  });

  it("una escapada corta del pasillo no parte el pedazo", () => {
    // A mitad del Camino el GPS se va a 25 m durante 20 m y vuelve.
    const linea = gps(300, 1300, (este) => (este > 790 && este < 810 ? 25 : 5));
    const partes = proponerPartes(linea, [CHALLENGER]);
    expect(partes).toHaveLength(1);
    expect(partes[0].sobre?.id).toBe(39);
  });

  it("un desvío largo sí queda aparte, para que el usuario decida", () => {
    // Se fue 200 m al norte y volvió por el mismo lugar.
    const ida = gps(300, 800, () => 5);
    const desvio = [...Array.from({ length: 200 }, (_, i) => en(800, 6 + i)), ...Array.from({ length: 200 }, (_, i) => en(801, 205 - i))];
    const vuelta = gps(801, 1300, () => 5);
    const partes = proponerPartes([...ida, ...desvio, ...vuelta], [CHALLENGER]);
    expect(partes.map((parte) => parte.sobre ? "sobre" : "nueva")).toEqual(["sobre", "nueva", "sobre"]);
  });

  it("cruzar un Camino no es ir por él", () => {
    const cruce = Array.from({ length: 600 }, (_, i) => en(800, -300 + i));
    const partes = proponerPartes(cruce, [CHALLENGER]);
    expect(partes).toHaveLength(1);
    expect(partes[0].sobre).toBeNull();
  });

  it("sin Caminos cerca, todo es nuevo", () => {
    expect(proponerPartes(gps(0, 500, () => 900), [CHALLENGER]).map((parte) => parte.sobre)).toEqual([null]);
  });
});

describe("porDondeVa", () => {
  it("va sobre el Camino si más de la mitad está en el pasillo", () => {
    expect(porDondeVa(gps(300, 1300, () => 10), [CHALLENGER])?.sobre.id).toBe(39);
    expect(porDondeVa(gps(0, 500, () => 10), [CHALLENGER])).toBeNull();
  });
});

describe("cortarLinea", () => {
  it("corta donde se toca y no deja pedazos sin largo", () => {
    const linea = [en(0, 0), en(1000, 0)];
    const corte = cortarLinea(linea, ...(en(400, 3) as [number, number]));
    expect(corte.ok).toBe(true);
    if (corte.ok) {
      expect(Math.abs(largoDeParte(corte.datos[0]) - 400)).toBeLessThan(2);
      expect(Math.abs(largoDeParte(corte.datos[1]) - 600)).toBeLessThan(2);
    }
    expect(cortarLinea(linea, ...(en(3, 0) as [number, number])).ok).toBe(false);
  });
});

describe("salir del borrador de una salida", () => {
  it("no pregunta si ya está todo guardado o descartado", () => {
    expect(hayQueConfirmarSalida({
      creandoCamino: false, tocado: true, hayPartesPendientes: false,
    })).toBe(false);
  });

  it("pregunta si hay un Camino a medio crear o partes todavía pendientes", () => {
    expect(hayQueConfirmarSalida({
      creandoCamino: true, tocado: false, hayPartesPendientes: false,
    })).toBe(true);
    expect(hayQueConfirmarSalida({
      creandoCamino: false, tocado: true, hayPartesPendientes: true,
    })).toBe(true);
  });

  it("el cartel no dice «sin guardar» cuando ya hay Caminos guardados", () => {
    const conGuardados = cartelAlSalir({ creandoCamino: false, hayGuardados: true });
    expect(conGuardados.titulo).toBe("¿Salir de esta salida?");
    expect(conGuardados.mensaje).toContain("ya guardaste quedan");
    expect(conGuardados.mensaje).not.toMatch(/^Los cortes/);
    const creando = cartelAlSalir({ creandoCamino: true, hayGuardados: true });
    expect(creando.titulo).toBe("¿Salir sin terminar el Camino?");
    expect(creando.mensaje).toContain("sí quedan");
  });
});

describe("pegar la punta a un Camino vecino", () => {
  it("propone el Camino cercano a una punta y la lleva justo encima", () => {
    const nueva = [en(800, 12), en(800, 400)];
    const cercana = puntaCercana(nueva, "inicio", [CHALLENGER]);
    expect(cercana?.camino.nombre).toBe("Tramo Challenger");
    expect(cercana?.distanciaM).toBeCloseTo(12, 0);
    expect(puntaCercana(nueva, "final", [CHALLENGER])).toBeNull();
    // Una punta cortada justo en el borde del pasillo también se ofrece.
    expect(puntaCercana([en(800, 22), en(800, 400)], "inicio", [CHALLENGER])?.distanciaM).toBeCloseTo(22, 0);
    const pegada = pegarPunta(nueva, "inicio", cercana!.coordenada);
    expect(porDondeVa([pegada[0], en(800, 1)], [CHALLENGER])).not.toBeNull();
    expect(pegada[1]).toEqual(nueva[1]);
  });
});
