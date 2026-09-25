import { describe, expect, it } from "vitest";
import { aplicarPendientes, cuantosPendientesQuedan } from "@/lib/anotaciones/en-pantalla";
import type { PendienteDeCrear } from "@/lib/anotaciones/pendientes";
import type { Anotacion } from "@/types/database";

/**
 * Lo que se ve en el celular: lo bajado más lo marcado sin señal.
 *
 * Lo que manda: lo marcado se ve al instante, y **se ve cómo está**. Nunca se
 * muestra como subido algo que no lo está.
 */

function bajada(id: number): Anotacion {
  return {
    id,
    sectorId: 1,
    perfilId: "otro",
    deAdministrador: true,
    tipo: "punto",
    origen: "manual",
    icono: "refugio",
    color: null,
    comentario: "de la base",
    fotoUrl: null,
    fotoChicaUrl: null,
    geometria: { type: "Point", coordinates: [-64.9, -31.9] },
    marcadaEn: "",
    precisionGpsMetros: null,
    creadoEn: "",
    actualizadoEn: "",
  };
}

function marca(codigo: string, cambios: Partial<PendienteDeCrear> = {}): PendienteDeCrear {
  return {
    clase: "crear",
    codigo,
    hechoEn: "2026-09-24T12:00:00Z",
    ultimoError: null,
    idLocal: -5,
    datos: {
      tipo: "punto",
      icono: "cruce",
      color: null,
      comentario: "mía",
      geometria: { type: "Point", coordinates: [-64.8, -31.8] },
      precisionGpsMetros: 5,
    },
    fotos: null,
    anotacionId: null,
    terminada: false,
    ...cambios,
  };
}

const foto = { grande: new Blob(), chica: new Blob() };

describe("lo marcado sin señal se ve al instante", () => {
  it("una marca nueva aparece, es mía y dice que no subió", () => {
    const [bajadaUna, mia] = aplicarPendientes([bajada(1)], [marca("a")], "yo");

    expect(bajadaUna.subida).toBeNull();
    expect(mia).toMatchObject({
      id: -5,
      perfilId: "yo",
      sectorId: null,
      comentario: "mía",
      subida: { clase: "sin_subir" },
      codigoDeLaMarca: "a",
    });
  });

  it("su foto se lee del celular con la dirección de la marca", () => {
    const [mia] = aplicarPendientes([], [marca("a", { fotos: foto })], "yo");
    expect(mia.fotoChicaUrl).toBe("pendiente:a");
  });

  it("si los datos subieron y la foto no, lo dice", () => {
    const [mia] = aplicarPendientes([], [marca("a", { anotacionId: 9, fotos: foto })], "yo");
    expect(mia.id).toBe(9);
    expect(mia.subida).toMatchObject({ clase: "foto_sin_subir" });
  });

  it("el motivo del último intento viaja a la pantalla", () => {
    const [mia] = aplicarPendientes(
      [],
      [marca("a", { anotacionId: 9, fotos: foto, ultimoError: "La foto no se subió: sin espacio" })],
      "yo",
    );
    expect(mia.subida?.motivo).toContain("sin espacio");
  });

  it("cuando ya está en el paquete no aparece dos veces", () => {
    const enLaBase = { ...bajada(9), perfilId: "yo" };
    const lista = aplicarPendientes([enLaBase], [marca("a", { anotacionId: 9, terminada: true })], "yo");
    expect(lista).toHaveLength(1);
    expect(lista[0].subida).toBeNull();
  });
});

describe("cambios y borrados sin señal", () => {
  it("un borrado esconde la anotación ya", () => {
    const lista = aplicarPendientes(
      [bajada(1)],
      [{ clase: "borrar", codigo: "b", hechoEn: "", ultimoError: null, anotacionId: 1, terminada: false }],
      "yo",
    );
    expect(lista).toEqual([]);
  });

  it("un cambio se ve ya, marcado como sin subir", () => {
    const [cambiada] = aplicarPendientes(
      [bajada(1)],
      [
        {
          clase: "editar",
          codigo: "e",
          hechoEn: "",
          ultimoError: null,
          anotacionId: 1,
          datos: marca("x").datos,
          fotos: null,
          quitarLaFoto: false,
          terminada: false,
        },
      ],
      "yo",
    );
    expect(cambiada.comentario).toBe("mía");
    expect(cambiada.subida).toMatchObject({ clase: "cambio_sin_subir" });
  });
});

describe("cuántos quedan", () => {
  it("no cuenta lo terminado", () => {
    expect(cuantosPendientesQuedan([marca("a"), marca("b", { terminada: true })])).toBe(1);
  });
});
