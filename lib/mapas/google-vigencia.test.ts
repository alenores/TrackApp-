import { describe, expect, it } from "vitest";
import { venceSegunGoogle } from "@/lib/mapas/google-vigencia";

const ahora = Date.parse("2026-11-18T12:00:00Z");

describe("vigencia HTTP de las imágenes de Google", () => {
  it.each([
    null, "", "public", "no-store, max-age=3600", "private, no-cache, max-age=3600",
    'no-cache="set-cookie", max-age=3600', "max-age=0", "max-age=-1", "max-age=NaN",
    "max-age=1, max-age=3600", "max-age=999999999999999999",
  ])("no inventa permiso para %s", (cabecera) => {
    expect(venceSegunGoogle(cabecera, ahora)).toBeNull();
  });
  it("respeta max-age, incluido entre comillas, sin guardar más tiempo", () => {
    expect(venceSegunGoogle('private, max-age="3600"', ahora)).toBe(ahora + 3_600_000);
  });
  it("descuenta Age, fecha del servidor y tiempo de ida y vuelta", () => {
    expect(venceSegunGoogle("max-age=3600", ahora, {
      edad: "30", fecha: new Date(ahora - 20_000).toUTCString(), solicitadoEn: ahora - 2000,
    })).toBe(ahora + 3_568_000);
    expect(venceSegunGoogle("max-age=3600", ahora, {
      edad: "5", fecha: new Date(ahora - 60_000).toUTCString(),
    })).toBe(ahora + 3_540_000);
  });
  it("usa Expires cuando no hay max-age y respeta su vencimiento absoluto", () => {
    expect(venceSegunGoogle(null, ahora, {
      fecha: new Date(ahora - 60_000).toUTCString(),
      vencimiento: new Date(ahora + 600_000).toUTCString(),
    })).toBe(ahora + 600_000);
  });
  it("max-age prevalece sobre Expires y no-cache prohíbe reutilizar ambos", () => {
    const vencimiento = new Date(ahora + 99_000_000).toUTCString();
    expect(venceSegunGoogle("max-age=10", ahora, { vencimiento })).toBe(ahora + 10_000);
    expect(venceSegunGoogle("no-cache", ahora, { vencimiento })).toBeNull();
    expect(venceSegunGoogle("max-age=0", ahora, { vencimiento })).toBeNull();
  });
  it("rechaza respuestas ya envejecidas y metadatos inválidos", () => {
    expect(venceSegunGoogle("max-age=30", ahora, { edad: "30" })).toBeNull();
    expect(venceSegunGoogle("max-age=30", ahora, { edad: "-1" })).toBeNull();
    expect(venceSegunGoogle("max-age=30", ahora, { fecha: "inválida" })).toBeNull();
    expect(venceSegunGoogle(null, ahora, { vencimiento: new Date(ahora - 1).toISOString() })).toBeNull();
  });
});
