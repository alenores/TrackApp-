import { describe, expect, it, vi } from "vitest";
import PuntosPage from "@/app/(app)/zonas/puntos/page";
vi.mock("next/navigation", () => ({ redirect: (direccion: string) => { throw new Error(`redireccion:${direccion}`); } }));
describe("la dirección vieja de los puntos de Mapas", () => {
  it("lleva a Marcas, donde ahora están los puntos (decisión 052)", async () => {
    await expect(PuntosPage()).rejects.toThrow("redireccion:/mapas/marcas");
  });
});
