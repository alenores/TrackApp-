import { describe, expect, it, vi } from "vitest";
import PuntosPage from "@/app/(app)/zonas/puntos/page";
const permiso = vi.hoisted(() => ({ administrador: false }));
vi.mock("@/lib/perfiles/datos", () => ({ soyAdministrador: async () => permiso.administrador }));
vi.mock("next/navigation", () => ({ redirect: (direccion: string) => { throw new Error(`redireccion:${direccion}`); } }));
vi.mock("@/components/anotaciones/pantalla-de-puntos", () => ({ PantallaDePuntos: () => null }));
vi.mock("@/components/armazon/marca-de-app-lista", () => ({ MarcaDeAppLista: () => null }));
describe("acceso a puntos por su dirección", () => {
  it("rechaza entrar sin ser administrador aunque se conozca la dirección", async () => {
    permiso.administrador = false;
    await expect(PuntosPage()).rejects.toThrow("redireccion:/zonas");
  });
  it("deja entrar al administrador", async () => {
    permiso.administrador = true;
    await expect(PuntosPage()).resolves.toBeTruthy();
  });
});
