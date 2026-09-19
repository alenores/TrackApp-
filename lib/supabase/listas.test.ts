import { describe, expect, it } from "vitest";
import {
  mapearResultado,
  traerTodasLasFilas,
  type ConsultaDeLista,
} from "@/lib/supabase/listas";

/**
 * Las pruebas del traer por tandas.
 *
 * **Esta es la regla que existe por los 202 tramos que quedaron invisibles
 * durante meses en Vías de Escalada.** La base devuelve como máximo 1000 filas
 * y no avisa: responde bien, con la lista cortada.
 *
 * Lo que tiene que quedar garantizado es que nunca más una lista se muestre
 * cortada en silencio: o llega completa, o la app dice que quedó incompleta.
 */

const TANDA = 1000;

/** Una base de mentira con `total` filas, que responde de a 1000 como la real. */
function baseCon(total: number) {
  const pedidos: Array<[number, number]> = [];

  const consulta = (desde: number, hasta: number): ConsultaDeLista<number> => {
    pedidos.push([desde, hasta]);
    const filas: number[] = [];
    for (let i = desde; i <= Math.min(hasta, total - 1); i += 1) filas.push(i);
    return Promise.resolve({ data: filas, error: null });
  };

  return { consulta, pedidos };
}

describe("traer todas las filas por tandas", () => {
  it("trae una lista corta de una sola vez", async () => {
    const { consulta, pedidos } = baseCon(37);

    const resultado = await traerTodasLasFilas(consulta);

    expect(resultado.completa).toBe(true);
    expect(resultado.filas).toHaveLength(37);
    expect(pedidos).toHaveLength(1);
  });

  it("trae una lista de más de mil filas completa, sin perder ninguna", async () => {
    const { consulta, pedidos } = baseCon(2350);

    const resultado = await traerTodasLasFilas(consulta);

    expect(resultado.completa).toBe(true);
    expect(resultado.filas).toHaveLength(2350);
    expect(pedidos).toHaveLength(3);
  });

  it("no repite ni saltea filas entre una tanda y la siguiente", async () => {
    const { consulta } = baseCon(2350);

    const resultado = await traerTodasLasFilas(consulta);

    expect(new Set(resultado.filas).size).toBe(2350);
    expect(resultado.filas[0]).toBe(0);
    expect(resultado.filas[2349]).toBe(2349);
  });

  it("pide las tandas pegadas, sin huecos", async () => {
    const { consulta, pedidos } = baseCon(2350);

    await traerTodasLasFilas(consulta);

    expect(pedidos).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ]);
  });

  it("con exactamente mil filas pregunta una vez más, para estar seguro", async () => {
    const { consulta, pedidos } = baseCon(TANDA);

    const resultado = await traerTodasLasFilas(consulta);

    expect(resultado.completa).toBe(true);
    expect(resultado.filas).toHaveLength(TANDA);
    // Si cortara acá sin preguntar, una lista de 1001 se mostraría con 1000.
    expect(pedidos).toHaveLength(2);
  });

  it("con la lista vacía dice que está completa, no que falló", async () => {
    const { consulta } = baseCon(0);

    const resultado = await traerTodasLasFilas(consulta);

    expect(resultado.completa).toBe(true);
    expect(resultado.filas).toHaveLength(0);
  });

  it("cuando la base falla devuelve lo que llegó Y el motivo, nunca calla", async () => {
    let vuelta = 0;
    const consulta = (desde: number, hasta: number): ConsultaDeLista<number> => {
      vuelta += 1;
      if (vuelta === 2) {
        return Promise.resolve({
          data: null,
          error: { message: "se cortó la conexión" },
        });
      }
      const filas: number[] = [];
      for (let i = desde; i <= hasta; i += 1) filas.push(i);
      return Promise.resolve({ data: filas, error: null });
    };

    const resultado = await traerTodasLasFilas(consulta);

    expect(resultado.completa).toBe(false);
    expect(resultado.filas).toHaveLength(TANDA);
    if (resultado.completa) return;
    expect(resultado.motivo).toContain("se cortó la conexión");
  });

  it("no se queda pidiendo para siempre, y avisa si tuvo que cortar", async () => {
    // Una base que siempre devuelve tanda llena: nunca termina sola.
    const consulta = (desde: number, hasta: number): ConsultaDeLista<number> => {
      const filas: number[] = [];
      for (let i = desde; i <= hasta; i += 1) filas.push(i);
      return Promise.resolve({ data: filas, error: null });
    };

    const resultado = await traerTodasLasFilas(consulta, 3);

    expect(resultado.completa).toBe(false);
    expect(resultado.filas).toHaveLength(3 * TANDA);
    if (resultado.completa) return;
    expect(resultado.motivo).toContain("3 tandas");
  });

  it("una respuesta sin datos ni error se toma como lista terminada", async () => {
    const consulta = (): ConsultaDeLista<number> =>
      Promise.resolve({ data: null, error: null });

    const resultado = await traerTodasLasFilas(consulta);

    expect(resultado.completa).toBe(true);
    expect(resultado.filas).toHaveLength(0);
  });
});

describe("traducir una lista sin perder el aviso de incompleta", () => {
  it("mantiene el motivo cuando la lista había quedado cortada", async () => {
    const consulta = (): ConsultaDeLista<number> =>
      Promise.resolve({ data: null, error: { message: "sin permiso" } });

    const resultado = await traerTodasLasFilas(consulta);
    const traducido = mapearResultado(resultado, (n) => `fila ${n}`);

    expect(traducido.completa).toBe(false);
    if (traducido.completa) return;
    expect(traducido.motivo).toContain("sin permiso");
  });

  it("traduce cada fila cuando la lista llegó completa", async () => {
    const { consulta } = baseCon(3);

    const traducido = mapearResultado(
      await traerTodasLasFilas(consulta),
      (n) => `fila ${n}`,
    );

    expect(traducido.filas).toEqual(["fila 0", "fila 1", "fila 2"]);
  });
});
