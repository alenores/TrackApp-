import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import type { CaminoGuardado, CaminoSinLinea } from "@/lib/caminos/datos";
import {
  borrarLineasDeCaminosQueSobran,
  guardarLineasDeCaminos,
  leerLineaDeCamino,
} from "@/lib/offline/lineas-de-caminos";

function camino(actualizadoEn: string, lat: number): CaminoGuardado {
  return {
    id: 894,
    actualizadoEn,
    coordenadas: [[-64.4, lat], [-64.41, lat]],
  } as CaminoGuardado;
}

describe("líneas de Caminos guardadas para navegar sin señal", () => {
  it("mantiene la línea anterior hasta publicar el paquete nuevo y después libera la que sobra", async () => {
    const anterior = camino("2026-10-06T10:00:00Z", -31.4);
    const nueva = camino("2026-10-06T11:00:00Z", -31.5);
    expect(await guardarLineasDeCaminos([anterior])).toBe(true);
    expect(await guardarLineasDeCaminos([nueva])).toBe(true);

    // Si la puesta al día se corta antes de guardar el paquete, el viejo sigue sirviendo.
    expect(await leerLineaDeCamino(anterior as CaminoSinLinea)).toEqual(anterior.coordenadas);
    expect(await leerLineaDeCamino(nueva as CaminoSinLinea)).toEqual(nueva.coordenadas);

    await borrarLineasDeCaminosQueSobran([nueva]);
    expect(await leerLineaDeCamino(anterior as CaminoSinLinea)).toBeNull();
    expect(await leerLineaDeCamino(nueva as CaminoSinLinea)).toEqual(nueva.coordenadas);
  });
});
