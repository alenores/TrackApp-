import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import type { CaminoGuardado, CaminoSinLinea } from "@/lib/caminos/datos";
import { ESTANTES, escribirEnElDeposito } from "@/lib/offline/deposito";
import {
  borrarLineasDeCaminosQueSobran,
  claveDeLineaDeCamino,
  guardarLineasDeCaminos,
  leerLineaDeCamino,
} from "@/lib/offline/lineas-de-caminos";

const ALTURAS = { cadaM: 25, valores: [800, 812], desnivelPositivoM: 12, desnivelNegativoM: 0 };

function camino(actualizadoEn: string, lat: number): CaminoGuardado {
  return {
    id: 894,
    actualizadoEn,
    coordenadas: [[-64.4, lat], [-64.41, lat]],
    alturas: ALTURAS,
  } as CaminoGuardado;
}

function pesado(datos: CaminoGuardado) {
  return { coordenadas: datos.coordenadas, alturas: datos.alturas };
}

describe("líneas de Caminos guardadas para navegar sin señal", () => {
  it("mantiene la línea anterior hasta publicar el paquete nuevo y después libera la que sobra", async () => {
    const anterior = camino("2026-10-06T10:00:00Z", -31.4);
    const nueva = camino("2026-10-06T11:00:00Z", -31.5);
    expect(await guardarLineasDeCaminos([anterior])).toBe(true);
    expect(await guardarLineasDeCaminos([nueva])).toBe(true);

    // Si la puesta al día se corta antes de guardar el paquete, el viejo sigue sirviendo.
    expect(await leerLineaDeCamino(anterior as CaminoSinLinea)).toEqual(pesado(anterior));
    expect(await leerLineaDeCamino(nueva as CaminoSinLinea)).toEqual(pesado(nueva));

    await borrarLineasDeCaminosQueSobran([nueva]);
    expect(await leerLineaDeCamino(anterior as CaminoSinLinea)).toBeNull();
    expect(await leerLineaDeCamino(nueva as CaminoSinLinea)).toEqual(pesado(nueva));
  });

  it("una línea guardada antes de las alturas se sigue leyendo, sin alturas", async () => {
    const vieja = camino("2026-10-01T09:00:00Z", -31.6);
    await escribirEnElDeposito(ESTANTES.lineasDeCaminos, [(donde) => donde.put(vieja.coordenadas, claveDeLineaDeCamino(vieja))]);
    expect(await leerLineaDeCamino(vieja as CaminoSinLinea)).toEqual({ coordenadas: vieja.coordenadas, alturas: null });
  });
});
