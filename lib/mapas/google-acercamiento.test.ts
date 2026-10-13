import { describe, expect, it, vi } from "vitest";
import { detalleConCreditosDeGoogle, maximoDetalleDeGoogle, type AreaConDetalleDeGoogle } from "@/lib/mapas/google-acercamiento";

const mundo: AreaConDetalleDeGoogle = { maxZoom: 15, north: 90, south: -90, east: 180, west: -180 };

describe("detalle disponible en Google", () => {
  it("usa el mayor detalle que cubre el centro, incluso si otro rectángulo amplio tiene menos", () => {
    expect(maximoDetalleDeGoogle([
      mundo,
      { maxZoom: 19, north: -30, south: -33, east: -63, west: -66 },
    ], { lat: -31.5, lng: -64.5 })).toBe(19);
    expect(maximoDetalleDeGoogle([
      mundo,
      { maxZoom: 19, north: -30, south: -33, east: -63, west: -66 },
    ], { lat: -36, lng: -64.5 })).toBe(15);
  });

  it("reconoce un área que cruza el meridiano 180", () => {
    const area = { maxZoom: 18, north: 10, south: -10, west: 170, east: -170 };
    expect(maximoDetalleDeGoogle([area], { lat: 0, lng: 179 })).toBe(18);
    expect(maximoDetalleDeGoogle([area], { lat: 0, lng: -179 })).toBe(18);
    expect(maximoDetalleDeGoogle([area], { lat: 0, lng: 0 })).toBeNull();
  });

  it("ignora niveles inválidos y no inventa un límite cuando falta la información", () => {
    expect(maximoDetalleDeGoogle([{ ...mundo, maxZoom: 23 }], { lat: -31, lng: -64 })).toBeNull();
    expect(maximoDetalleDeGoogle([], { lat: -31, lng: -64 })).toBeNull();
  });

  it("busca los créditos en otro nivel y conserva el límite de la vista original", async () => {
    const niveles: string[] = [];
    const traer = vi.fn(async (pedido: URLSearchParams) => {
      niveles.push(pedido.get("zoom") || "");
      return Number(pedido.get("zoom")) > 17
        ? { derechos: null, areasConDetalle: [{ ...mundo, maxZoom: 17 }] }
        : { derechos: "© Google", areasConDetalle: [{ ...mundo, maxZoom: 17 }] };
    });
    const resultado = await detalleConCreditosDeGoogle(
      new URLSearchParams({ zoom: "19" }), { lat: -31, lng: -64 }, traer,
    );
    expect(resultado).toEqual({ derechos: "© Google", maximo: 17 });
    expect(niveles).toEqual(["19", "17"]);
  });

  it("no busca otros niveles si Google ya informó los créditos", async () => {
    const resultado = await detalleConCreditosDeGoogle(
      new URLSearchParams({ zoom: "12" }), { lat: -31, lng: -64 },
      async () => ({ derechos: "© Google", areasConDetalle: [{ ...mundo, maxZoom: 21 }] }),
    );
    expect(resultado).toEqual({ derechos: "© Google", maximo: 21 });
  });

  it("busca los créditos en otro nivel sin usar ese nivel para limitar el mapa", async () => {
    const niveles: string[] = [];
    const orden: string[] = [];
    const resultado = await detalleConCreditosDeGoogle(
      new URLSearchParams({ zoom: "11" }), { lat: -31, lng: -64 },
      async (pedido) => {
        const nivel = pedido.get("zoom") || "";
        niveles.push(nivel);
        orden.push(`pedido ${nivel}`);
        return {
          derechos: Number(nivel) <= 9 ? "© Google" : null,
          areasConDetalle: [{ ...mundo, maxZoom: 20 }],
        };
      },
      () => true,
      (maximo) => orden.push(`máximo ${maximo}`),
    );
    expect(niveles).toEqual(["11", "10", "9"]);
    expect(orden).toEqual(["pedido 11", "máximo 20", "pedido 10", "pedido 9"]);
    expect(resultado).toEqual({ derechos: "© Google", maximo: 20 });
  });

  it("no convierte la ausencia de créditos en una falla del mapa", async () => {
    await expect(detalleConCreditosDeGoogle(
      new URLSearchParams({ zoom: "2" }), { lat: -31, lng: -64 },
      async () => ({ derechos: null, areasConDetalle: [] }),
    )).resolves.toEqual({ derechos: null, maximo: null });
  });
});
