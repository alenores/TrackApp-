import { describe, expect, it } from "vitest";
import {
  comoGpx,
  diaDelMomento,
  hayQueAnotar,
  kilometrosRegistrados,
  tituloDelBorrador,
  type PuntoRegistrado,
} from "@/lib/salidas/registro-reglas";

/** 0,0001 grados de latitud son unos 11 metros. */
function punto(lat: number, momento: number, cambios: Partial<PuntoRegistrado> = {}): PuntoRegistrado {
  return { lon: -64.5, lat, altura: null, momento, precision: 8, aMano: false, ...cambios };
}

describe("hayQueAnotar", () => {
  const inicio = punto(-31.5, 0);

  it("el primer punto confiable se anota", () => {
    expect(hayQueAnotar(null, inicio)).toBe(true);
  });

  it("con poco movimiento no se anota: sería ruido", () => {
    expect(hayQueAnotar(inicio, punto(-31.5001, 10_000))).toBe(false);
  });

  it("después de unos 20 metros se anota", () => {
    expect(hayQueAnotar(inicio, punto(-31.5002, 20_000))).toBe(true);
  });

  it("un GPS que puede errar mucho no se anota, ni siquiera el primero", () => {
    expect(hayQueAnotar(null, punto(-31.5, 0, { precision: 120 }))).toBe(false);
  });

  it("parado mucho tiempo, con algo de movimiento, se anota para no perder el rastro", () => {
    expect(hayQueAnotar(inicio, punto(-31.50006, 6 * 60 * 1000))).toBe(true);
  });

  it("lo marcado a mano se anota siempre", () => {
    expect(hayQueAnotar(inicio, punto(-31.5, 1000, { aMano: true, precision: 300 }))).toBe(true);
  });
});

describe("kilometrosRegistrados", () => {
  it("suma punto a punto", () => {
    // 0,01 grados de latitud son 1,11 km.
    expect(kilometrosRegistrados([punto(-31.5, 0), punto(-31.51, 1), punto(-31.52, 2)])).toBeCloseTo(2.22, 1);
  });

  it("sin puntos o con uno solo, cero", () => {
    expect(kilometrosRegistrados([])).toBe(0);
    expect(kilometrosRegistrados([punto(-31.5, 0)])).toBe(0);
  });
});

describe("el borrador", () => {
  it("se titula con la ruta y el día, o solo con el día", () => {
    expect(tituloDelBorrador("2026-10-04", "Champaquí")).toBe("Champaquí · 4 de octubre de 2026");
    expect(tituloDelBorrador("2026-10-04", null)).toBe("Salida del 4 de octubre de 2026");
  });

  it("el día sale de la hora de Córdoba", () => {
    // 01:00 del 5 en Greenwich son las 22:00 del 4 en Córdoba.
    expect(diaDelMomento(Date.UTC(2026, 9, 5, 1, 0))).toBe("2026-10-04");
  });
});

describe("comoGpx", () => {
  it("arma un GPX con los puntos, la altura cuando la hay y la hora", () => {
    const gpx = comoGpx("Ida & vuelta", [
      punto(-31.5, Date.UTC(2026, 9, 4, 12), { altura: 1820.44 }),
      punto(-31.51, Date.UTC(2026, 9, 4, 13)),
    ]);
    expect(gpx).toContain("<name>Ida &amp; vuelta</name>");
    expect(gpx).toContain('<trkpt lat="-31.500000" lon="-64.500000"><ele>1820.4</ele><time>2026-10-04T12:00:00.000Z</time></trkpt>');
    expect(gpx).toContain('<trkpt lat="-31.510000" lon="-64.500000"><time>2026-10-04T13:00:00.000Z</time></trkpt>');
  });
});
