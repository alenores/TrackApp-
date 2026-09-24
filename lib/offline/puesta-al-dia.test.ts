import { beforeEach, describe, expect, it, vi } from "vitest";

const sincronizar = vi.fn();
const calentar = vi.fn(async () => ({ pedidas: 0, listas: 0 }));

vi.mock("@/lib/offline/sincronizacion", () => ({
  sincronizarPaquete: () => sincronizar(),
}));
vi.mock("@/lib/offline/calentar", () => ({
  calentarLasPantallas: () => calentar(),
}));
vi.mock("@/lib/offline/pantallas-de-otra-version", () => ({
  tirarLasPantallasDeOtraVersion: async () => undefined,
}));
vi.mock("@/lib/offline/permanente", () => ({
  pedirQueNoLoBorren: async () => undefined,
}));
vi.mock("@/lib/mapas/poner-al-dia-lo-bajado", () => ({
  ponerAlDiaLoBajado: async () => ({ anotadas: 0, avisados: 0 }),
}));

import {
  olvidarLaPuestaAlDiaParaProbar,
  ponerAlDiaDespuesDeGuardar,
  ponerAlDiaUnaVezPorApertura,
} from "@/lib/offline/puesta-al-dia";

/**
 * Cuándo sale a la base la puesta al día.
 *
 * Lo que se cuida acá son dos cosas opuestas: que pasar de pantalla en pantalla
 * **no** salga a la base cada vez —eso hacía lenta la app—, y que lo que el
 * usuario acaba de guardar **sí** aparezca enseguida.
 */

const PAQUETE = { rutas: [], zonas: [], sectores: [], anotaciones: [] };

beforeEach(() => {
  olvidarLaPuestaAlDiaParaProbar();
  sincronizar.mockReset();
  calentar.mockClear();
});

describe("pasar de una pantalla a otra", () => {
  it("con señal, sale a la base una sola vez por apertura", async () => {
    sincronizar.mockResolvedValue({ clase: "al_dia", paquete: PAQUETE });

    await ponerAlDiaUnaVezPorApertura();
    await ponerAlDiaUnaVezPorApertura();
    await ponerAlDiaUnaVezPorApertura();

    expect(sincronizar).toHaveBeenCalledTimes(1);
    expect(calentar).toHaveBeenCalledTimes(1);
  });

  it("dos pantallas que se abren a la vez comparten la misma consulta", async () => {
    sincronizar.mockResolvedValue({ clase: "al_dia", paquete: PAQUETE });

    await Promise.all([ponerAlDiaUnaVezPorApertura(), ponerAlDiaUnaVezPorApertura()]);

    expect(sincronizar).toHaveBeenCalledTimes(1);
  });

  it("si no había señal, la próxima pantalla vuelve a intentar", async () => {
    sincronizar.mockResolvedValueOnce({ clase: "sin_senal", paquete: PAQUETE });
    sincronizar.mockResolvedValueOnce({ clase: "actualizado", paquete: PAQUETE });

    expect((await ponerAlDiaUnaVezPorApertura()).clase).toBe("sin_senal");
    expect((await ponerAlDiaUnaVezPorApertura()).clase).toBe("actualizado");
    expect(sincronizar).toHaveBeenCalledTimes(2);
  });

  it("si falló, la próxima pantalla vuelve a intentar", async () => {
    sincronizar.mockResolvedValueOnce({ clase: "fallo", paquete: PAQUETE, motivo: "x" });
    sincronizar.mockResolvedValueOnce({ clase: "al_dia", paquete: PAQUETE });

    await ponerAlDiaUnaVezPorApertura();
    await ponerAlDiaUnaVezPorApertura();
    expect(sincronizar).toHaveBeenCalledTimes(2);
  });
});

describe("después de guardar algo", () => {
  it("vuelve a salir a la base aunque ya estuviera al día", async () => {
    sincronizar.mockResolvedValue({ clase: "al_dia", paquete: PAQUETE });

    await ponerAlDiaUnaVezPorApertura();
    await ponerAlDiaDespuesDeGuardar();

    expect(sincronizar).toHaveBeenCalledTimes(2);
  });

  it("si había una consulta en curso, hace otra después: la de antes no trae lo guardado", async () => {
    let terminarLaPrimera: (valor: unknown) => void = () => {};
    sincronizar.mockImplementationOnce(
      () => new Promise((listo) => (terminarLaPrimera = listo)),
    );
    sincronizar.mockResolvedValue({ clase: "actualizado", paquete: PAQUETE });

    const primera = ponerAlDiaUnaVezPorApertura();
    const despuesDeGuardar = ponerAlDiaDespuesDeGuardar();
    terminarLaPrimera({ clase: "al_dia", paquete: PAQUETE });

    await primera;
    expect((await despuesDeGuardar).clase).toBe("actualizado");
    expect(sincronizar).toHaveBeenCalledTimes(2);
  });

  it("la pantalla siguiente no vuelve a salir a la base", async () => {
    sincronizar.mockResolvedValue({ clase: "al_dia", paquete: PAQUETE });

    await ponerAlDiaDespuesDeGuardar();
    await ponerAlDiaUnaVezPorApertura();

    expect(sincronizar).toHaveBeenCalledTimes(1);
  });
});
