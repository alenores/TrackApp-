import { describe, expect, it, vi } from "vitest";
import PuntosPage from "@/app/(app)/zonas/puntos/page";
const permiso = vi.hoisted(() => ({ administrador: false }));
vi.mock("@/lib/perfiles/datos", () => ({ soyAdministrador: async () => permiso.administrador }));
vi.mock("next/navigation", () => ({ redirect: (direccion: string) => { throw new Error(`redireccion:${direccion}`); } }));
describe("acceso a las anotaciones de Mapas por su dirección vieja", () => {
  it("rechaza entrar sin ser administrador aunque se conozca la dirección", async () => {
    permiso.administrador = false;
    await expect(PuntosPage()).rejects.toThrow("redireccion:/zonas");
  });
  it("lleva al administrador a la pestaña de anotaciones", async () => {
    permiso.administrador = true;
    await expect(PuntosPage()).rejects.toThrow("redireccion:/zonas?vista=anotaciones");
  });
});
