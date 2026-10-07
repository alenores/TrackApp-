import { describe, expect, it } from "vitest";
import { puedeCambiarDelMapa, puedeSumarAlMapa } from "@/lib/mapas/permisos";

describe("permisos del contenido marcado en Mapas", () => {
  it("Normal solo consulta, incluso si una marca anterior era suya", () => {
    expect(puedeSumarAlMapa("normal")).toBe(false);
    expect(puedeCambiarDelMapa("normal", "normal-id", "normal-id")).toBe(false);
  });

  it("Premium suma y cambia solo lo propio", () => {
    expect(puedeSumarAlMapa("premium")).toBe(true);
    expect(puedeCambiarDelMapa("premium", "premium-id", "premium-id")).toBe(true);
    expect(puedeCambiarDelMapa("premium", "premium-id", "otro-id")).toBe(false);
  });

  it("Administrador cambia también lo ajeno y una cuenta sin perfil no escribe", () => {
    expect(puedeCambiarDelMapa("administrador", "admin-id", "otro-id")).toBe(true);
    expect(puedeSumarAlMapa(null)).toBe(false);
    expect(puedeCambiarDelMapa(null, "sin-perfil", "sin-perfil")).toBe(false);
  });
});
