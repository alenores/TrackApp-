// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  bajarElMapaDelSector,
  borrarElMapaDelSector,
  borrarTodosLosMapasDelCelular,
  type FuenteDeTeselas,
} from "@/lib/mapas/descarga";
import { cualesEstanGuardadas, leerTesela } from "@/lib/mapas/deposito";
import {
  ACERCAMIENTO_MAXIMO,
  claveDeTesela,
  teselasDelRectangulo,
  type Tesela,
} from "@/lib/mapas/teselas";
import { mapaDelSector, sectoresConMapaBajado } from "@/lib/offline/mapas";
import type { Sector } from "@/types/database";

/**
 * Las pruebas de la descarga de mapas.
 *
 * **Lo que se prueba acá es una promesa.** Cuando la pantalla muestra un sector
 * en verde, el usuario lee «podés salir sin señal» y sale. Si esa marca aparece
 * sobre una descarga a la que le faltan pedazos, el error no se ve en casa: se
 * ve en el cerro, con el mapa lleno de agujeros.
 *
 * Por eso las tres pruebas que mandan son: que una descarga cortada **no** deje
 * el sector marcado, que borrar un sector no se lleve puesto el mapa del sector
 * de al lado, y que lo que se borra libere el espacio de verdad.
 */

function sector(id: number, lonOeste: number): Sector {
  return {
    id,
    zonaId: 1,
    perfilId: "alguien",
    nombre: `Sector ${id}`,
    descripcion: null,
    rectangulo: {
      latNorte: -31.9,
      latSur: -31.91,
      lonOeste,
      lonEste: lonOeste + 0.01,
    },
    creadoEn: "2026-09-01T10:00:00Z",
    actualizadoEn: "2026-09-01T10:00:00Z",
  };
}

const UNO = sector(1, -64.9);
/** Pegado al anterior: comparte con él todos los acercamientos lejanos. */
const OTRO = sector(2, -64.89);

type Comportamiento = (tesela: Tesela) => Uint8Array | null | "romper";

function fuente(comportamiento: Comportamiento = () => new Uint8Array([1, 2, 3])) {
  const pedidas: string[] = [];

  const fuente: FuenteDeTeselas = {
    nombre: "la fuente de prueba",
    async pedirTesela(tesela) {
      pedidas.push(claveDeTesela(tesela));
      const respuesta = comportamiento(tesela);
      if (respuesta === "romper") {
        throw new Error("Se cortó la conexión con el servidor de mapas.");
      }
      return respuesta;
    },
  };

  return { fuente, pedidas };
}

function cuantosPedazos(unSector: Sector): number {
  return teselasDelRectangulo(unSector.rectangulo).length;
}

beforeEach(async () => {
  localStorage.clear();
  await borrarTodosLosMapasDelCelular();
});

describe("bajar el mapa de un sector", () => {
  it("cuando entra todo, queda listo y anotado", async () => {
    const { fuente: origen } = fuente();

    const resultado = await bajarElMapaDelSector({
      sector: UNO,
      tipo: "simple",
      fuente: origen,
    });

    expect(resultado.estado).toBe("listo");
    expect(sectoresConMapaBajado().has(UNO.id)).toBe(true);

    const anotado = mapaDelSector(UNO.id);
    expect(anotado?.tipo).toBe("simple");
    expect(anotado?.acercamientoMaximo).toBe(ACERCAMIENTO_MAXIMO);
    expect(anotado?.bytes).toBeGreaterThan(0);
  });

  it("va contando el avance mientras baja", async () => {
    const { fuente: origen } = fuente();
    const avances: number[] = [];

    await bajarElMapaDelSector({
      sector: UNO,
      tipo: "simple",
      fuente: origen,
      avisarAvance: ({ resueltos, total }) => {
        avances.push(resueltos);
        expect(total).toBe(cuantosPedazos(UNO));
      },
    });

    expect(avances[0]).toBe(0);
    expect(avances[avances.length - 1]).toBe(cuantosPedazos(UNO));
  });

  it("un pedazo donde no hay nada que dibujar no es una falla", async () => {
    // El campo abierto y el mar existen: el mapa no tiene nada que poner ahí.
    // Si eso contara como error, no se podría bajar ningún sector de sierra.
    const { fuente: origen } = fuente((tesela) =>
      tesela.z % 2 === 0 ? null : new Uint8Array([9]),
    );

    const resultado = await bajarElMapaDelSector({
      sector: UNO,
      tipo: "simple",
      fuente: origen,
    });

    expect(resultado.estado).toBe("listo");
    expect(sectoresConMapaBajado().has(UNO.id)).toBe(true);
  });

  it("si se corta a la mitad, el sector NO queda marcado como bajado", async () => {
    const { fuente: origen } = fuente((tesela) =>
      tesela.z === ACERCAMIENTO_MAXIMO ? "romper" : new Uint8Array([1]),
    );

    const resultado = await bajarElMapaDelSector({
      sector: UNO,
      tipo: "simple",
      fuente: origen,
    });

    expect(resultado.estado).toBe("incompleta");
    expect(sectoresConMapaBajado().has(UNO.id)).toBe(false);
    expect(mapaDelSector(UNO.id)).toBeNull();
  });

  it("cuando se corta, dice el motivo de verdad y no «no se pudo»", async () => {
    const { fuente: origen } = fuente(() => "romper");

    const resultado = await bajarElMapaDelSector({
      sector: UNO,
      tipo: "simple",
      fuente: origen,
    });

    expect(resultado).toMatchObject({ estado: "incompleta" });
    if (resultado.estado !== "incompleta") throw new Error("tenía que ser incompleta");
    expect(resultado.motivo).toContain("Se cortó la conexión");
    expect(resultado.total).toBe(cuantosPedazos(UNO));
  });

  it("lo que alcanzó a entrar se conserva y no se vuelve a bajar", async () => {
    const primera = fuente((tesela) =>
      tesela.z === ACERCAMIENTO_MAXIMO ? "romper" : new Uint8Array([1]),
    );
    await bajarElMapaDelSector({ sector: UNO, tipo: "simple", fuente: primera.fuente });

    const segunda = fuente();
    const resultado = await bajarElMapaDelSector({
      sector: UNO,
      tipo: "simple",
      fuente: segunda.fuente,
    });

    expect(resultado.estado).toBe("listo");
    // La segunda vez pide bastante menos: lo de los acercamientos lejanos ya
    // estaba guardado de la primera.
    expect(segunda.pedidas.length).toBeLessThan(cuantosPedazos(UNO));
  });

  it("reintenta antes de darse por vencida", async () => {
    let fallas = 1;
    const { fuente: origen } = fuente(() => {
      if (fallas > 0) {
        fallas -= 1;
        return "romper";
      }
      return new Uint8Array([1]);
    });

    const resultado = await bajarElMapaDelSector({
      sector: UNO,
      tipo: "simple",
      fuente: origen,
    });

    expect(resultado.estado).toBe("listo");
  });

  it("si el usuario cancela, no queda anotado", async () => {
    const cancelador = new AbortController();
    const { fuente: origen } = fuente((tesela) => {
      if (tesela.z === 5) cancelador.abort();
      return new Uint8Array([1]);
    });

    const resultado = await bajarElMapaDelSector({
      sector: UNO,
      tipo: "simple",
      fuente: origen,
      senal: cancelador.signal,
    });

    expect(resultado.estado).toBe("cancelada");
    expect(sectoresConMapaBajado().has(UNO.id)).toBe(false);
  });

  it("el segundo sector pegado al primero aprovecha lo ya bajado", async () => {
    await bajarElMapaDelSector({ sector: UNO, tipo: "simple", fuente: fuente().fuente });

    const segundo = fuente();
    await bajarElMapaDelSector({ sector: OTRO, tipo: "simple", fuente: segundo.fuente });

    expect(segundo.pedidas.length).toBeLessThan(cuantosPedazos(OTRO));
  });
});

describe("borrar el mapa de un sector", () => {
  it("libera el espacio de verdad cuando no queda nadie usándolo", async () => {
    await bajarElMapaDelSector({ sector: UNO, tipo: "simple", fuente: fuente().fuente });

    const resultado = await borrarElMapaDelSector(UNO.id, [UNO]);

    expect(resultado.ok).toBe(true);
    expect(sectoresConMapaBajado().size).toBe(0);

    const claves = teselasDelRectangulo(UNO.rectangulo).map(claveDeTesela);
    expect((await cualesEstanGuardadas(claves)).size).toBe(0);
  });

  it("NO se lleva puesto el mapa del sector de al lado", async () => {
    await bajarElMapaDelSector({ sector: UNO, tipo: "simple", fuente: fuente().fuente });
    await bajarElMapaDelSector({ sector: OTRO, tipo: "simple", fuente: fuente().fuente });

    await borrarElMapaDelSector(UNO.id, [UNO, OTRO]);

    expect(sectoresConMapaBajado().has(OTRO.id)).toBe(true);

    // Todos los pedazos del que queda siguen estando, incluidos los que
    // compartía con el que se borró.
    const delQueQueda = teselasDelRectangulo(OTRO.rectangulo).map(claveDeTesela);
    const guardados = await cualesEstanGuardadas(delQueQueda);
    expect(guardados.size).toBe(delQueQueda.length);
  });

  it("cerrar sesión no deja mapas de la cuenta anterior", async () => {
    await bajarElMapaDelSector({ sector: UNO, tipo: "simple", fuente: fuente().fuente });

    await borrarTodosLosMapasDelCelular();

    expect(sectoresConMapaBajado().size).toBe(0);
    expect(await leerTesela("0/0/0")).toBeNull();
  });
});
