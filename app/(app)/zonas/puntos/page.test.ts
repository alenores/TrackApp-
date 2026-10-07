import { describe, expect, it, vi } from "vitest";
import PuntosPage from "@/app/(app)/zonas/puntos/page";
vi.mock("next/navigation", () => ({ redirect: (direccion: string) => { throw new Error(`redireccion:${direccion}`); } }));
describe("acceso a las anotaciones de Mapas por su dirección vieja", () => {
  it("lleva a cualquier cuenta a la pestaña de anotaciones", async () => {
    await expect(PuntosPage()).rejects.toThrow("redireccion:/zonas?vista=anotaciones");
  });
});
