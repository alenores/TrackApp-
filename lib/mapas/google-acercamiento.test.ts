import { describe, expect, it, vi } from "vitest";
import type { Map as MapaLibre } from "maplibre-gl";
import { COBERTURA_DE_GOOGLE, detalleConCreditosDeGoogle, limiteDeGoogleSinRetroceso, maximoDetalleDeGoogle, nivelDeImagenDeGoogle, type AreaConDetalleDeGoogle } from "@/lib/mapas/google-acercamiento";

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
    expect(maximoDetalleDeGoogle([area], { lat: 0, lng: 0 })).toBe(18);
  });

  it("conserva el mayor nivel informado si los rectángulos no cubren exactamente el centro", () => {
    expect(maximoDetalleDeGoogle([
      { maxZoom: 19, north: -30, south: -31, east: -64, west: -65 },
      { maxZoom: 20, north: -31, south: -32, east: -65, west: -66 },
    ], { lat: -32.1, lng: -64.5 })).toBe(20);
  });

  it("ignora niveles inválidos y no inventa un límite cuando falta la información", () => {
    expect(maximoDetalleDeGoogle([{ ...mundo, maxZoom: 23 }], { lat: -31, lng: -64 })).toBeNull();
    expect(maximoDetalleDeGoogle([], { lat: -31, lng: -64 })).toBeNull();
  });

  it("convierte el máximo de imágenes a cámara sin alejar una vista abierta", () => {
    expect(limiteDeGoogleSinRetroceso(20, 18, null)).toBe(20);
    expect(limiteDeGoogleSinRetroceso(22, 19, 17)).toBe(19);
    expect(limiteDeGoogleSinRetroceso(20, 19, 21)).toBe(20);
    expect(limiteDeGoogleSinRetroceso(22, 20, 22)).toBe(21);
    expect(limiteDeGoogleSinRetroceso(22, 20.8, 20)).toBe(20.8);
  });

  it("consulta una vez el nivel real y devuelve su autoría y detalle", async () => {
    const traer = vi.fn(async (pedido: URLSearchParams) => ({ derechos: pedido.get("zoom") === "14" ? "Airbus / Maxar" : null, areasConDetalle: [{ ...mundo, maxZoom: 20 }] }));
    const resultado = await detalleConCreditosDeGoogle(
      new URLSearchParams({ zoom: "14" }), { lat: -31, lng: -64 }, traer,
    );
    expect(resultado).toEqual({ derechos: "Airbus / Maxar", maximo: 20 });
    expect(traer).toHaveBeenCalledTimes(1);
    expect(traer.mock.calls[0][0].get("zoom")).toBe("14");
  });

  it("si la autoría viene vacía no busca NASA en otro nivel", async () => {
    const traer = vi.fn(async (pedido: URLSearchParams) => ({
      derechos: pedido.get("zoom") === "14" ? null : "NASA",
      areasConDetalle: [{ ...mundo, maxZoom: 9 }],
    }));
    const informar = vi.fn();
    const resultado = await detalleConCreditosDeGoogle(
      new URLSearchParams({ zoom: "14" }), { lat: -31, lng: -64 }, traer, () => true, informar,
    );
    expect(resultado).toEqual({ derechos: null, maximo: 9 });
    expect(traer).toHaveBeenCalledTimes(1);
    expect(traer.mock.calls[0][0].get("zoom")).toBe("14");
    expect(informar).toHaveBeenCalledWith(9);
  });

  it("conserva sin datos el resultado vacío de la vista", async () => {
    const traer = vi.fn(async () => ({ derechos: null, areasConDetalle: [] }));
    await expect(detalleConCreditosDeGoogle(
      new URLSearchParams({ zoom: "14" }), { lat: -31, lng: -64 }, traer,
    )).resolves.toEqual({ derechos: null, maximo: null });
    expect(traer).toHaveBeenCalledTimes(1);
  });

  it("una vista ya obsoleta no inicia otra consulta", async () => {
    const traer = vi.fn();
    const informar = vi.fn();
    await expect(detalleConCreditosDeGoogle(
      new URLSearchParams({ zoom: "14" }), { lat: -31, lng: -64 }, traer, () => false, informar,
    )).resolves.toBeNull();
    expect(traer).not.toHaveBeenCalled();
    expect(informar).not.toHaveBeenCalled();
  });

  it("la respuesta de una vista anterior no modifica créditos ni máximo", async () => {
    let activa = true;
    let responder!: (valor: { derechos: string; areasConDetalle: AreaConDetalleDeGoogle[] }) => void;
    const traer = vi.fn(() => new Promise<{ derechos: string; areasConDetalle: AreaConDetalleDeGoogle[] }>((resolver) => { responder = resolver; }));
    const informar = vi.fn();
    const pendiente = detalleConCreditosDeGoogle(
      new URLSearchParams({ zoom: "14" }), { lat: -31, lng: -64 }, traer, () => activa, informar,
    );
    activa = false;
    responder({ derechos: "Vista vieja", areasConDetalle: [mundo] });
    await expect(pendiente).resolves.toBeNull();
    expect(informar).not.toHaveBeenCalled();
    expect(traer).toHaveBeenCalledTimes(1);
  });

  it("propaga el fallo de la única consulta para que se muestre en pantalla", async () => {
    const traer = vi.fn().mockRejectedValue(new Error("Google no respondió"));
    await expect(detalleConCreditosDeGoogle(
      new URLSearchParams({ zoom: "14" }), { lat: -31, lng: -64 }, traer,
    )).rejects.toThrow("Google no respondió");
    expect(traer).toHaveBeenCalledTimes(1);
  });
});

function mapaConCobertura(niveles: number[], ampliado = niveles[0]) {
  const consultar = vi.fn(() => niveles.map((z) => ({ canonical: { z }, overscaledZ: ampliado })));
  return { consultar, mapa: { coveringTiles: consultar } as unknown as Pick<MapaLibre, "coveringTiles"> };
}

describe("nivel real de imágenes de Google", () => {
  it("usa la cobertura raster de 256 y su nivel canónico, no el de cámara", () => {
    const { mapa, consultar } = mapaConCobertura([14, 14, 14]);
    expect(nivelDeImagenDeGoogle(mapa)).toBe(14);
    expect(consultar).toHaveBeenCalledTimes(1);
    expect(consultar).toHaveBeenCalledWith({ tileSize: 256, minzoom: 0, maxzoom: 22, roundZoom: true });
    expect(COBERTURA_DE_GOOGLE.tileSize).toBe(256);
  });

  it("usa la imagen 22 aunque el motor la amplíe a un nivel superior", () => {
    const { mapa } = mapaConCobertura([22], 24);
    expect(nivelDeImagenDeGoogle(mapa)).toBe(22);
  });

  it("no inventa un nivel si la cobertura está vacía", () => {
    expect(nivelDeImagenDeGoogle(mapaConCobertura([]).mapa)).toBeNull();
  });

  it("no atribuye niveles mezclados como si fueran uno solo", () => {
    expect(nivelDeImagenDeGoogle(mapaConCobertura([13, 14]).mapa)).toBeNull();
  });

  it.each([-1, 23, 14.5, Number.NaN])("rechaza un nivel canónico inválido: %s", (nivel) => {
    expect(nivelDeImagenDeGoogle(mapaConCobertura([nivel]).mapa)).toBeNull();
  });

  it("permite que el componente avise cuando el motor no obtiene cobertura", () => {
    const mapa = { coveringTiles: vi.fn(() => { throw new Error("Todavía no hay tamaño"); }) } as unknown as Pick<MapaLibre, "coveringTiles">;
    expect(nivelDeImagenDeGoogle(mapa)).toBeNull();
  });
});
