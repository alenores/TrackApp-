import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  borrarTodosLosRegistros,
  elEnCurso,
  empezarUnRegistro,
  releerLosRegistros,
  sumarUnPunto,
  terminarElRegistro,
} from "@/lib/salidas/registro";
import type { PuntoRegistrado } from "@/lib/salidas/registro-reglas";

/**
 * Lo crítico del registro en el cerro: que ningún punto se pierda, aunque
 * lleguen muchos juntos, y que quede grabado en el celular.
 */

function punto(indice: number): PuntoRegistrado {
  return {
    lon: -64.5,
    lat: -31.5 - indice * 0.001,
    altura: null,
    momento: 1_000 * indice,
    precision: 8,
    aMano: false,
  };
}

beforeEach(async () => {
  await borrarTodosLosRegistros();
});

describe("el registro de una salida en el celular", () => {
  it("guarda todos los puntos, aunque lleguen muchos juntos", async () => {
    await empezarUnRegistro(7, "Champaquí");
    await Promise.all(Array.from({ length: 20 }, (_, indice) => sumarUnPunto(punto(indice))));

    const enCurso = elEnCurso(await releerLosRegistros());
    expect(enCurso?.puntos).toHaveLength(20);
    expect(enCurso?.rutaId).toBe(7);
  });

  it("no empieza una segunda encima de la que está en curso: sigue con esa", async () => {
    const primera = await empezarUnRegistro(7, "Champaquí");
    await sumarUnPunto(punto(1));
    const segunda = await empezarUnRegistro(null, null);

    expect(segunda.codigo).toBe(primera.codigo);
    expect(await releerLosRegistros()).toHaveLength(1);
  });

  it("al terminar queda esperando para subirse, y ya no está en curso", async () => {
    await empezarUnRegistro(null, null);
    await sumarUnPunto(punto(1));
    await terminarElRegistro();

    const todos = await releerLosRegistros();
    expect(elEnCurso(todos)).toBeNull();
    expect(todos[0].terminadoEn).not.toBeNull();
    expect(todos[0].puntos).toHaveLength(1);
  });

  it("sin una salida en curso, un punto no se guarda en ningún lado", async () => {
    await sumarUnPunto(punto(1));
    expect(await releerLosRegistros()).toHaveLength(0);
  });
});
