// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  DEPOSITO_DE_FOTOS,
  FORMATO_DE_FOTO,
  MAXIMO_DE_BYTES_DE_FOTO,
  revisarLaFoto,
  rutaDeLaFoto,
} from "@/lib/cuenta/fotos";

/**
 * Las pruebas de la foto de perfil.
 *
 * Existen porque acá ya hubo dos errores del mismo tipo: **el código decía una
 * cosa y la base otra**, y la diferencia no fallaba al escribir código ni al
 * abrir la app. Fallaba recién al subir una foto, con un error que el usuario
 * no entiende.
 *
 * Estos números están verificados contra la base el 2026-09-19. Si alguien los
 * cambia sin cambiar la base, o al revés, esto lo frena.
 */

function foto(tipo: string, megas: number): File {
  const bytes = new Uint8Array(Math.round(megas * 1024 * 1024));
  return new File([bytes], "foto", { type: tipo });
}

describe("lo que la app acepta tiene que ser lo que la base acepta", () => {
  it("manda las fotos al depósito que existe, no al de la app vieja", () => {
    expect(DEPOSITO_DE_FOTOS).toBe("avatares");
    expect(DEPOSITO_DE_FOTOS).not.toBe("avatars");
  });

  it("corta en los mismos 2 MB que la base", () => {
    expect(MAXIMO_DE_BYTES_DE_FOTO).toBe(2 * 1024 * 1024);
  });

  it("admite el mismo único formato que la base", () => {
    expect(FORMATO_DE_FOTO).toBe("image/webp");
  });
});

describe("revisar una foto antes de subirla", () => {
  it("deja pasar una WebP liviana", () => {
    expect(revisarLaFoto(foto("image/webp", 0.5))).toBeNull();
  });

  it("rechaza una JPG y dice qué hacer", () => {
    const error = revisarLaFoto(foto("image/jpeg", 0.5));

    expect(error).not.toBeNull();
    expect(error).toContain("WebP");
    expect(error).toContain("convertila");
  });

  it("rechaza una foto pesada y dice cuánto pesa y cuál es el máximo", () => {
    const error = revisarLaFoto(foto("image/webp", 2.5));

    expect(error).not.toBeNull();
    expect(error).toContain("2,5 MB");
    expect(error).toContain("2 MB");
  });

  it("deja pasar una foto justo en el límite", () => {
    expect(revisarLaFoto(foto("image/webp", 2))).toBeNull();
  });
});

describe("dónde se guarda la foto de cada uno", () => {
  it("cada perfil tiene su propia carpeta", () => {
    expect(rutaDeLaFoto("abc-123")).toBe("abc-123/avatar");
  });
});
