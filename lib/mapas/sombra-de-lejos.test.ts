// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { alturaTerrarium } from "@/lib/alturas/relieve";
import { borrarTodasLasTeselas, guardarTeselas } from "@/lib/mapas/deposito";
import { aTerrarium, type GrillaDeAlturas } from "@/lib/mapas/sombra";
import { armarSombraDeLejos, hijosDeCerca, type HerramientasDeImagen } from "@/lib/mapas/sombra-de-lejos";
import { claveDeTesela } from "@/lib/mapas/teselas";
import { anotarDetalleDeLaSombra, olvidarTodaLaSombraGruesa, sombraGruesa } from "@/lib/offline/sombra-gruesa";

/**
 * Los pedazos de sombreado de lejos se arman en el celular con los de cerca
 * (decisión 079). Sin navegador: «abrir» y «escribir» guardan los puntos tal
 * cual, que es lo que tiene que hacer el navegador de verdad.
 */

const herramientas: HerramientasDeImagen = {
  async abrir(bytes) {
    const lado = Math.round(Math.sqrt(bytes.byteLength / 3));
    return { ancho: lado, alto: lado, canales: 3, datos: bytes };
  },
  async escribir(puntos) {
    return puntos.slice();
  },
};

function pareja(altura: number): Uint8Array {
  const g: GrillaDeAlturas = { ancho: 512, alto: 512, alturas: new Float32Array(512 * 512).fill(altura) };
  return aTerrarium(g, 0.5);
}

const LEJOS = { z: 13, x: 2621, y: 4849, capa: "sombra" as const };

beforeEach(async () => {
  await borrarTodasLasTeselas();
  olvidarTodaLaSombraGruesa();
});

describe("armar un pedazo de lejos", () => {
  it("sus cuatro de cerca son los que caen adentro, por filas", () => {
    expect(hijosDeCerca(LEJOS).map(claveDeTesela)).toEqual([
      "sombra/14/5242/9698",
      "sombra/14/5243/9698",
      "sombra/14/5242/9699",
      "sombra/14/5243/9699",
    ]);
  });

  it("junta los de cerca guardados, sin salir a internet", async () => {
    const hijos = hijosDeCerca(LEJOS);
    await guardarTeselas(hijos.map((hijo, i) => ({ clave: claveDeTesela(hijo), bytes: pareja(1000 + 100 * i) })));

    const bytes = await armarSombraDeLejos(LEJOS, herramientas);

    const altura = (i: number) => alturaTerrarium(bytes![i * 3], bytes![i * 3 + 1], bytes![i * 3 + 2]);
    expect(altura(0)).toBe(1000);
    expect(altura(511)).toBe(1100);
    expect(altura(511 * 512 + 511)).toBe(1300);
    expect(sombraGruesa()[claveDeTesela(LEJOS)]).toBeUndefined();
  });

  it("si uno de cerca quedó con menos detalle, el de lejos también, con el mismo motivo", async () => {
    const hijos = hijosDeCerca(LEJOS);
    await guardarTeselas(hijos.map((hijo) => ({ clave: claveDeTesela(hijo), bytes: pareja(1000) })));
    anotarDetalleDeLaSombra(claveDeTesela(hijos[2]), "IDECOR tardó demasiado en contestar");

    await armarSombraDeLejos(LEJOS, herramientas);

    expect(sombraGruesa()[claveDeTesela(LEJOS)]).toBe("IDECOR tardó demasiado en contestar");
  });

  it("sin de cerca ni relieve no inventa nada", async () => {
    expect(await armarSombraDeLejos(LEJOS, herramientas)).toBeNull();
  });
});
