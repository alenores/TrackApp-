import { describe, expect, it } from "vitest";
import { elPaqueteQuedoViejo, type Paquete } from "@/lib/offline/paquete";

/**
 * De esto depende que el celular se actualice cuando tiene que actualizarse.
 * Si se equivoca para un lado, el usuario sale al cerro con datos viejos; si se
 * equivoca para el otro, la app baja todo de nuevo cada vez que la abre.
 */

function paquete(ultimaModificacion: string | null): Paquete {
  return {
    rutas: [],
    zonas: [],
    sectores: [],
    anotaciones: [],
    ultimaModificacion,
    guardadoEn: "2026-09-01T10:00:00Z",
  };
}

describe("elPaqueteQuedoViejo", () => {
  it("si no hay paquete, hay que bajarlo", () => {
    expect(elPaqueteQuedoViejo(null, "2026-09-01T10:00:00Z")).toBe(true);
  });

  it("si la base tiene algo más nuevo, quedó viejo", () => {
    expect(
      elPaqueteQuedoViejo(
        paquete("2026-09-01T10:00:00Z"),
        "2026-09-02T10:00:00Z",
      ),
    ).toBe(true);
  });

  it("si la base está igual, no se baja nada de nuevo", () => {
    expect(
      elPaqueteQuedoViejo(
        paquete("2026-09-01T10:00:00Z"),
        "2026-09-01T10:00:00Z",
      ),
    ).toBe(false);
  });

  it("si la base quedó atrás, tampoco se baja nada", () => {
    expect(
      elPaqueteQuedoViejo(
        paquete("2026-09-02T10:00:00Z"),
        "2026-09-01T10:00:00Z",
      ),
    ).toBe(false);
  });

  it("un paquete sin fecha se considera viejo", () => {
    expect(elPaqueteQuedoViejo(paquete(null), "2026-09-01T10:00:00Z")).toBe(
      true,
    );
  });

  it("sin señal no se declara viejo nada: no se sabe y no se rompe", () => {
    expect(elPaqueteQuedoViejo(paquete("2026-09-01T10:00:00Z"), null)).toBe(
      false,
    );
  });

  it("compara momentos y no textos, aunque vengan en otro huso horario", () => {
    // Las dos fechas son el mismo instante, escritas distinto.
    expect(
      elPaqueteQuedoViejo(
        paquete("2026-09-01T12:00:00Z"),
        "2026-09-01T09:00:00-03:00",
      ),
    ).toBe(false);
  });
});
