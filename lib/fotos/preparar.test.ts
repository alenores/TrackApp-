// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  abrirFoto,
  AJUSTES_POR_DESTINO,
  COPIA_CHICA_POR_DESTINO,
  FORMATO_DE_FOTO,
  medidasQueEntran,
  pareceHeic,
  TOPE_DEL_FORMULARIO_BYTES,
} from "@/lib/fotos/preparar";
import { MAXIMO_DE_BYTES_DE_FOTO } from "@/lib/cuenta/fotos";

/**
 * Las pruebas de la preparación de fotos.
 *
 * Lo que se prueba acá es lo que **falla callado**: un tope que no coincide con
 * el de la base, una foto que se agranda en vez de achicarse, o una foto de
 * iPhone que no se reconoce y termina en «no se pudo abrir» sin explicación.
 *
 * El dibujado sobre lienzo no se prueba acá: el lienzo de mentira del entorno
 * de pruebas no comprime de verdad, así que probarlo sería probar la mentira.
 * Lo que sí se prueba es el cálculo que decide las medidas.
 */

describe("los topes tienen que coincidir con los de la base", () => {
  it("el formulario apunta por debajo del tope de la base, con margen", () => {
    expect(TOPE_DEL_FORMULARIO_BYTES).toBeLessThan(MAXIMO_DE_BYTES_DE_FOTO);
  });

  it("ningún destino apunta por encima de lo que la base acepta", () => {
    for (const [destino, ajuste] of Object.entries(AJUSTES_POR_DESTINO)) {
      expect(ajuste.topeBytes, `el destino ${destino}`).toBeLessThanOrEqual(
        MAXIMO_DE_BYTES_DE_FOTO,
      );
    }
  });

  it("se sube el único formato que la base admite", () => {
    expect(FORMATO_DE_FOTO).toBe("image/webp");
  });

  it("todo destino tiene escalones de calidad, de mayor a menor", () => {
    for (const [destino, ajuste] of Object.entries(AJUSTES_POR_DESTINO)) {
      expect(ajuste.calidades.length, `el destino ${destino}`).toBeGreaterThan(0);

      const ordenadas = [...ajuste.calidades].sort((a, b) => b - a);
      expect(ajuste.calidades, `el destino ${destino}`).toEqual(ordenadas);

      for (const calidad of ajuste.calidades) {
        expect(calidad).toBeGreaterThan(0);
        expect(calidad).toBeLessThanOrEqual(1);
      }
    }
  });

  it("todo destino tiene un lado largo razonable", () => {
    for (const [destino, ajuste] of Object.entries(AJUSTES_POR_DESTINO)) {
      expect(ajuste.ladoLargo, `el destino ${destino}`).toBeGreaterThan(100);
      expect(ajuste.ladoLargo, `el destino ${destino}`).toBeLessThanOrEqual(4000);
    }
  });
});

describe("la copia chica de la foto de una anotación", () => {
  it("existe: es la única que se ve en el cerro", () => {
    expect(COPIA_CHICA_POR_DESTINO.anotacion).toBeDefined();
  });

  it("es bastante más chica y liviana que la grande", () => {
    const chica = COPIA_CHICA_POR_DESTINO.anotacion!;
    const grande = AJUSTES_POR_DESTINO.anotacion;
    expect(chica.ladoLargo).toBeLessThan(grande.ladoLargo);
    // Baja sola con las anotaciones de todos: tiene que pesar poco de verdad.
    expect(chica.topeBytes).toBeLessThanOrEqual(150 * 1024);
    expect(chica.topeBytes).toBeLessThan(grande.topeBytes);
  });

  it("tiene escalones de calidad de mayor a menor", () => {
    const { calidades } = COPIA_CHICA_POR_DESTINO.anotacion!;
    expect([...calidades]).toEqual([...calidades].sort((a, b) => b - a));
  });
});

describe("achicar manteniendo la proporción", () => {
  it("una foto apaisada se achica por el ancho", () => {
    expect(medidasQueEntran(4000, 3000, 500)).toEqual({ ancho: 500, alto: 375 });
  });

  it("una foto vertical se achica por el alto", () => {
    expect(medidasQueEntran(3000, 4000, 500)).toEqual({ ancho: 375, alto: 500 });
  });

  it("una foto cuadrada queda cuadrada", () => {
    expect(medidasQueEntran(2000, 2000, 500)).toEqual({ ancho: 500, alto: 500 });
  });

  it("una foto que ya entra no se agranda", () => {
    // Estirarla se vería peor y pesaría más.
    expect(medidasQueEntran(300, 200, 500)).toEqual({ ancho: 300, alto: 200 });
  });

  it("una foto muy alargada nunca queda en cero", () => {
    const medidas = medidasQueEntran(5000, 3, 500);

    expect(medidas.ancho).toBe(500);
    expect(medidas.alto).toBeGreaterThanOrEqual(1);
  });

  it("nunca devuelve medidas con decimales", () => {
    const medidas = medidasQueEntran(1333, 999, 500);

    expect(Number.isInteger(medidas.ancho)).toBe(true);
    expect(Number.isInteger(medidas.alto)).toBe(true);
  });
});

describe("reconocer una foto de iPhone", () => {
  /** Arma una cabecera de archivo con la marca que se le pida. */
  function cabecera(marca: string): Blob {
    const bytes = new Uint8Array(16);
    const escribir = (texto: string, desde: number) => {
      for (let i = 0; i < texto.length; i += 1) {
        bytes[desde + i] = texto.charCodeAt(i);
      }
    };
    escribir("ftyp", 4);
    escribir(marca, 8);
    return new Blob([bytes]);
  }

  it("reconoce las marcas del contenedor del iPhone", async () => {
    for (const marca of ["heic", "heix", "mif1", "hevc"]) {
      expect(await pareceHeic(cabecera(marca)), marca).toBe(true);
    }
  });

  it("no confunde con un formato que el navegador abre solo", async () => {
    expect(await pareceHeic(cabecera("avif"))).toBe(false);
  });

  it("mira la cabecera y no el nombre, porque el nombre miente", async () => {
    const jpegDisfrazado = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])]);

    expect(await pareceHeic(jpegDisfrazado)).toBe(false);
  });

  it("un archivo demasiado corto no rompe nada", async () => {
    expect(await pareceHeic(new Blob([new Uint8Array(4)]))).toBe(false);
    expect(await pareceHeic(new Blob([]))).toBe(false);
  });
});

describe("cuando la foto no se puede abrir, el error dice qué hacer", () => {
  it("rechaza un archivo que no es una imagen", async () => {
    const archivo = new File(["hola"], "notas.txt", { type: "text/plain" });

    await expect(abrirFoto(archivo)).rejects.toThrow(/no es una foto/i);
  });

  it("avisa cuando el celular entrega una foto vacía", async () => {
    const archivo = new File([], "foto.webp", { type: "image/webp" });

    await expect(abrirFoto(archivo)).rejects.toThrow(/vacía/i);
  });

  it("los mensajes de error dicen qué hacer, no solo qué pasó", async () => {
    const archivo = new File([], "foto.webp", { type: "image/webp" });

    await expect(abrirFoto(archivo)).rejects.toThrow(/elegila de nuevo/i);
  });
});
