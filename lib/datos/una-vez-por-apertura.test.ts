import { beforeEach, describe, expect, it, vi } from "vitest";
import { olvidarLoDeEstaApertura, unaVezPorApertura } from "@/lib/datos/una-vez-por-apertura";

describe("una vez por apertura (decisión de Ale del 2026-10-13)", () => {
  beforeEach(() => olvidarLoDeEstaApertura());

  it("la segunda vez no le pregunta a la base", async () => {
    const pedir = vi.fn(async () => ({ ok: true, datos: [1, 2] }));
    await unaVezPorApertura("circuitos", pedir);
    await unaVezPorApertura("circuitos", pedir);
    expect(pedir).toHaveBeenCalledTimes(1);
  });

  it("una falla no queda guardada: la próxima vez se vuelve a intentar", async () => {
    const pedir = vi.fn()
      .mockResolvedValueOnce({ ok: false, error: "sin señal" })
      .mockResolvedValueOnce({ ok: true, datos: [] });
    expect((await unaVezPorApertura("circuitos", pedir)).ok).toBe(false);
    expect((await unaVezPorApertura("circuitos", pedir)).ok).toBe(true);
    expect(pedir).toHaveBeenCalledTimes(2);
  });

  it("si la base no contesta, tampoco queda guardado", async () => {
    const pedir = vi.fn()
      .mockRejectedValueOnce(new Error("se cortó"))
      .mockResolvedValueOnce({ ok: true });
    await expect(unaVezPorApertura("circuitos", pedir)).rejects.toThrow("se cortó");
    await unaVezPorApertura("circuitos", pedir);
    expect(pedir).toHaveBeenCalledTimes(2);
  });

  it("después de guardar algo, llega fresco", async () => {
    const pedir = vi.fn(async () => ({ ok: true }));
    await unaVezPorApertura("circuitos", pedir);
    olvidarLoDeEstaApertura();
    await unaVezPorApertura("circuitos", pedir);
    expect(pedir).toHaveBeenCalledTimes(2);
  });
});
