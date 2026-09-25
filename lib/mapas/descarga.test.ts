// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  bajarElMapaDelSector,
  borrarElMapaDelSector,
  teselasDelMapa,
  borrarTodosLosMapasDelCelular,
  type FuenteDeTeselas,
  PESO_APROXIMADO_DE_UN_PEDAZO,
  PESO_APROXIMADO_DE_UN_PEDAZO_DE_RELIEVE,
  pesoAproximadoDelMapa,
} from "@/lib/mapas/descarga";
import { cualesEstanGuardadas, leerTesela } from "@/lib/mapas/deposito";
import {
  ACERCAMIENTO_MAXIMO,
  claveDeTesela,
  teselasDeLaFoto,
  teselasDelRectangulo,
  teselasDelRelieve,
  type Tesela,
} from "@/lib/mapas/teselas";
import { mapaDelSector, sectoresConMapaBajado } from "@/lib/offline/mapas";
import { losSacadosAProposito } from "@/lib/offline/sacados-a-proposito";
import { cualesFotosEstanGuardadas, guardarFotos } from "@/lib/anotaciones/deposito";
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

/** Todo lo que hace falta para un sector: el dibujo y el relieve. */
function cuantosPedazos(unSector: Sector): number {
  return (
    teselasDelRectangulo(unSector.rectangulo).length +
    teselasDelRelieve(unSector.rectangulo).length
  );
}

beforeEach(async () => {
  localStorage.clear();
  await borrarTodosLosMapasDelCelular();
});

afterEach(() => {
  vi.unstubAllGlobals();
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

    const anotado = mapaDelSector(UNO.id, "simple");
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
    expect(mapaDelSector(UNO.id, "simple")).toBeNull();
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
    // compartía con el que se borró, y su relieve también.
    const delQueQueda = [
      ...teselasDelRectangulo(OTRO.rectangulo),
      ...teselasDelRelieve(OTRO.rectangulo),
    ].map(claveDeTesela);
    const guardados = await cualesEstanGuardadas(delQueQueda);
    expect(guardados.size).toBe(delQueQueda.length);
  });

  it("borrar el único sector libera también su relieve", async () => {
    await bajarElMapaDelSector({ sector: UNO, tipo: "simple", fuente: fuente().fuente });
    const relieve = teselasDelRelieve(UNO.rectangulo).map(claveDeTesela);
    expect((await cualesEstanGuardadas(relieve)).size).toBe(relieve.length);

    await borrarElMapaDelSector(UNO.id, [UNO]);

    expect((await cualesEstanGuardadas(relieve)).size).toBe(0);
  });

  it("cerrar sesión no deja mapas de la cuenta anterior", async () => {
    await bajarElMapaDelSector({ sector: UNO, tipo: "simple", fuente: fuente().fuente });

    await borrarTodosLosMapasDelCelular();

    expect(sectoresConMapaBajado().size).toBe(0);
    expect(await leerTesela("0/0/0")).toBeNull();
  });

  it("queda anotado que lo sacó el usuario, para no ofrecerle recuperarlo", async () => {
    // Sin esta anotación, la app le diría después que «perdió» el mapa y le
    // ofrecería bajar de nuevo justo lo que él decidió tirar.
    await bajarElMapaDelSector({ sector: UNO, tipo: "simple", fuente: fuente().fuente });

    await borrarElMapaDelSector(UNO.id, [UNO]);

    expect(losSacadosAProposito()).toEqual([{ sectorId: UNO.id, tipo: null }]);
  });

  it("volver a bajarlo limpia esa anotación", async () => {
    // Si quedara puesta, el próximo aviso a la base borraría la anotación del
    // mapa que el usuario acaba de bajar.
    await bajarElMapaDelSector({ sector: UNO, tipo: "simple", fuente: fuente().fuente });
    await borrarElMapaDelSector(UNO.id, [UNO], "simple");

    await bajarElMapaDelSector({ sector: UNO, tipo: "simple", fuente: fuente().fuente });

    expect(losSacadosAProposito()).toEqual([]);
  });

  it("si sacaste los dos y volvés a bajar uno, el otro sigue pendiente", async () => {
    await bajarElMapaDelSector({ sector: UNO, tipo: "simple", fuente: fuente().fuente });
    await borrarElMapaDelSector(UNO.id, [UNO]);

    await bajarElMapaDelSector({ sector: UNO, tipo: "simple", fuente: fuente().fuente });

    expect(losSacadosAProposito()).toEqual([{ sectorId: UNO.id, tipo: "satelital" }]);
  });

  it("cerrar sesión se lleva también los pendientes de la cuenta anterior", async () => {
    await bajarElMapaDelSector({ sector: UNO, tipo: "simple", fuente: fuente().fuente });
    await borrarElMapaDelSector(UNO.id, [UNO]);

    await borrarTodosLosMapasDelCelular();

    expect(losSacadosAProposito()).toEqual([]);
  });
});

describe("las fotos de las anotaciones ya no viajan con el mapa", () => {
  // Decisión de Ale del 2026-09-24: la foto chica baja sola con las
  // anotaciones, estén o no dentro de un sector. El mapa es solo el mapa.

  it("bajar un mapa no pide ninguna foto", async () => {
    const pedidas: string[] = [];
    vi.stubGlobal("fetch", async (direccion: string) => {
      pedidas.push(direccion);
      return { ok: false, status: 500 } as unknown as Response;
    });

    const resultado = await bajarElMapaDelSector({
      sector: UNO,
      tipo: "simple",
      fuente: fuente().fuente,
    });

    expect(resultado.estado).toBe("listo");
    expect(pedidas).toEqual([]);
  });

  it("sacar un sector NO se lleva las fotos de las anotaciones", async () => {
    await guardarFotos([{ direccion: "https://foto/a-chica.webp", bytes: new Uint8Array([1]) }]);
    await bajarElMapaDelSector({ sector: UNO, tipo: "simple", fuente: fuente().fuente });

    await borrarElMapaDelSector(UNO.id, [UNO]);

    expect((await cualesFotosEstanGuardadas(["https://foto/a-chica.webp"])).size).toBe(1);
  });

  it("cerrar sesión no deja fotos de la cuenta anterior", async () => {
    await guardarFotos([{ direccion: "https://foto/a-chica.webp", bytes: new Uint8Array([1]) }]);

    await borrarTodosLosMapasDelCelular();

    expect((await cualesFotosEstanGuardadas(["https://foto/a-chica.webp"])).size).toBe(0);
  });
});

describe("el peso que se avisa antes de bajar", () => {
  it("cuenta el relieve, que pesa mucho más por pedazo pero son pocos", () => {
    const soloDibujo = teselasDelRectangulo(UNO.rectangulo).length * PESO_APROXIMADO_DE_UN_PEDAZO;
    const relieve = teselasDelRelieve(UNO.rectangulo).length * PESO_APROXIMADO_DE_UN_PEDAZO_DE_RELIEVE;
    expect(pesoAproximadoDelMapa(UNO.rectangulo)).toBe(soloDibujo + relieve);
    expect(relieve).toBeGreaterThan(0);
  });
});

describe("el mapa satelital", () => {
  it("baja el dibujo, el relieve y además la foto, y queda anotado como satelital", async () => {
    const { fuente: origen, pedidas } = fuente();

    const resultado = await bajarElMapaDelSector({
      sector: UNO,
      tipo: "satelital",
      fuente: origen,
    });

    expect(resultado.estado).toBe("listo");
    expect(mapaDelSector(UNO.id, "satelital")?.tipo).toBe("satelital");

    // Sin el dibujo no hay nombres sobre la foto, y sin relieve no hay curvas.
    const fotos = teselasDeLaFoto(UNO.rectangulo).map(claveDeTesela);
    expect(pedidas.length).toBe(cuantosPedazos(UNO) + fotos.length);
    expect((await cualesEstanGuardadas(fotos)).size).toBe(fotos.length);
  });

  it("si la foto se corta a la mitad, el sector NO queda marcado", async () => {
    const { fuente: origen } = fuente((tesela) =>
      tesela.capa === "satelital" && tesela.z === ACERCAMIENTO_MAXIMO
        ? "romper"
        : new Uint8Array([1]),
    );

    const resultado = await bajarElMapaDelSector({
      sector: UNO,
      tipo: "satelital",
      fuente: origen,
    });

    expect(resultado.estado).toBe("incompleta");
    expect(mapaDelSector(UNO.id, "satelital")).toBeNull();
  });

  it("un sector puede tener los dos, y bajar el satelital sobre el simple solo trae la foto", async () => {
    const { fuente: origen, pedidas } = fuente();

    await bajarElMapaDelSector({ sector: UNO, tipo: "simple", fuente: origen });
    pedidas.length = 0;
    await bajarElMapaDelSector({ sector: UNO, tipo: "satelital", fuente: origen });

    expect(mapaDelSector(UNO.id, "simple")).not.toBeNull();
    expect(mapaDelSector(UNO.id, "satelital")).not.toBeNull();
    expect(pedidas.every((clave) => clave.startsWith("satelital/"))).toBe(true);
    expect(pedidas.length).toBe(teselasDeLaFoto(UNO.rectangulo).length);
  });

  it("sacar el satelital deja el simple entero y libera solo la foto", async () => {
    const { fuente: origen } = fuente();
    const fotos = teselasDeLaFoto(UNO.rectangulo).map(claveDeTesela);

    await bajarElMapaDelSector({ sector: UNO, tipo: "simple", fuente: origen });
    await bajarElMapaDelSector({ sector: UNO, tipo: "satelital", fuente: origen });
    await borrarElMapaDelSector(UNO.id, [UNO, OTRO], "satelital");

    expect(mapaDelSector(UNO.id, "satelital")).toBeNull();
    expect(mapaDelSector(UNO.id, "simple")).not.toBeNull();
    expect((await cualesEstanGuardadas(fotos)).size).toBe(0);
    const delSimple = [
      ...teselasDelRectangulo(UNO.rectangulo),
      ...teselasDelRelieve(UNO.rectangulo),
    ].map(claveDeTesela);
    expect((await cualesEstanGuardadas(delSimple)).size).toBe(delSimple.length);
  });

  it("sacar el simple de un sector que tiene los dos no se lleva lo que usa el satelital", async () => {
    const { fuente: origen } = fuente();

    await bajarElMapaDelSector({ sector: UNO, tipo: "simple", fuente: origen });
    await bajarElMapaDelSector({ sector: UNO, tipo: "satelital", fuente: origen });
    await borrarElMapaDelSector(UNO.id, [UNO, OTRO], "simple");

    const delSatelital = teselasDelMapa(UNO.rectangulo, "satelital").map(claveDeTesela);
    expect((await cualesEstanGuardadas(delSatelital)).size).toBe(delSatelital.length);
  });

  it("sacar un satelital no se lleva la foto que usa el sector de al lado", async () => {
    const { fuente: origen } = fuente();

    await bajarElMapaDelSector({ sector: UNO, tipo: "satelital", fuente: origen });
    await bajarElMapaDelSector({ sector: OTRO, tipo: "satelital", fuente: origen });
    await borrarElMapaDelSector(UNO.id, [UNO, OTRO], "satelital");

    const fotosDelOtro = teselasDeLaFoto(OTRO.rectangulo).map(claveDeTesela);
    expect((await cualesEstanGuardadas(fotosDelOtro)).size).toBe(fotosDelOtro.length);
  });

  it("borrar un sector satelital libera también la foto", async () => {
    const { fuente: origen } = fuente();
    await bajarElMapaDelSector({ sector: UNO, tipo: "satelital", fuente: origen });

    await borrarElMapaDelSector(UNO.id, [UNO, OTRO]);

    const fotos = teselasDeLaFoto(UNO.rectangulo).map(claveDeTesela);
    expect((await cualesEstanGuardadas(fotos)).size).toBe(0);
  });

  it("pesa más que el simple, y la estimación lo dice antes de bajar", () => {
    expect(
      pesoAproximadoDelMapa(UNO.rectangulo, ACERCAMIENTO_MAXIMO, "satelital"),
    ).toBeGreaterThan(pesoAproximadoDelMapa(UNO.rectangulo));
  });
});
