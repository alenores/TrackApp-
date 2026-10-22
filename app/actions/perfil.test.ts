import { beforeEach, expect, it, vi } from "vitest";
import { editarPerfil } from "./perfil";
const base = vi.hoisted(() => ({ update: vi.fn(), usuario: { id: "yo", email: "ale@example.com" }, guardado: { data: { id: "yo" }, error: null } as { data: { id: string } | null; error: { message: string } | null } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/cuenta/sesion", () => ({ traerUsuario: async () => base.usuario }));
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteEnElServidor: async () => ({ from: () => ({ update: base.update }) }) }));
beforeEach(() => {
  base.update.mockReset();
  base.guardado = { data: { id: "yo" }, error: null };
  base.update.mockReturnValue({ eq: () => ({ is: () => ({ select: () => ({ maybeSingle: async () => base.guardado }) }) }) });
});
const datos = { nombre: "Ale", email: "ale@example.com" };
it("guarda actividades y principal juntas y solo sobre el usuario autenticado", async () => {
  expect(await editarPerfil({ ...datos, actividades: ["trekking", "kayak"], actividadPrincipal: "kayak" })).toMatchObject({ success: true });
  expect(base.update).toHaveBeenCalledWith({ nombre: "Ale", actividades: ["trekking", "kayak"], actividad_principal: "kayak" });
});
it("con una sola actividad la principal es esa misma", async () => {
  expect(await editarPerfil({ ...datos, actividades: ["trekking"] })).toMatchObject({ success: true });
  expect(base.update).toHaveBeenCalledWith({ nombre: "Ale", actividades: ["trekking"], actividad_principal: "trekking" });
});
it("rechaza varias sin principal o con una ajena antes de escribir", async () => {
  expect(await editarPerfil({ ...datos, actividades: ["trekking", "kayak"], actividadPrincipal: "correr" })).toMatchObject({ success: false });
  expect(await editarPerfil({ ...datos, actividades: [] })).toMatchObject({ success: false });
  expect(base.update).not.toHaveBeenCalled();
});
it("no anuncia éxito cuando la base no modificó el perfil o rechazó el guardado", async () => {
  base.guardado = { data: null, error: null };
  expect(await editarPerfil({ ...datos, actividades: ["trekking"] })).toMatchObject({ success: false });
  base.guardado = { data: null, error: { message: "motivo de prueba" } };
  expect(await editarPerfil({ ...datos, actividades: ["trekking"] })).toMatchObject({ success: false, error: "motivo de prueba" });
});
