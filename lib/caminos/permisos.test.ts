import { describe, expect, it } from "vitest";
import { puedeCrearCaminos, puedeEditarCamino, type QuienUsa } from "@/lib/caminos/permisos";

/**
 * Quién puede tocar un Camino. Si esto se equivoca para el lado de dejar, un
 * usuario Normal suma al mapa lo que Ale no curó; si se equivoca para el otro,
 * un Premium no puede corregir el camino que acaba de explorar.
 */

const ADMINISTRADOR: QuienUsa = { perfilId: "ale", categoria: "administrador" };
const PREMIUM: QuienUsa = { perfilId: "amigo", categoria: "premium" };
const NORMAL: QuienUsa = { perfilId: "visita", categoria: "normal" };

const DEL_AMIGO = { perfilId: "amigo", eliminadoEn: null };
const DE_OTRO = { perfilId: "otro", eliminadoEn: null };
const RETIRADO = { perfilId: "amigo", eliminadoEn: "2026-10-06T12:00:00+00:00" };

describe("crear Caminos", () => {
  it("pueden el administrador y Premium; Normal no", () => {
    expect(puedeCrearCaminos(ADMINISTRADOR).ok).toBe(true);
    expect(puedeCrearCaminos(PREMIUM).ok).toBe(true);

    const normal = puedeCrearCaminos(NORMAL);
    expect(normal.ok).toBe(false);
    if (!normal.ok) expect(normal.error).toMatch(/puede ver los Caminos, pero no sumarlos/);
  });
});

describe("editar o retirar un Camino", () => {
  it("Premium cambia los suyos y no los de otros", () => {
    expect(puedeEditarCamino(PREMIUM, DEL_AMIGO).ok).toBe(true);

    const ajeno = puedeEditarCamino(PREMIUM, DE_OTRO);
    expect(ajeno.ok).toBe(false);
    if (!ajeno.ok) expect(ajeno.error).toMatch(/lo subió otra persona/);
  });

  it("el administrador cambia cualquiera", () => {
    expect(puedeEditarCamino(ADMINISTRADOR, DEL_AMIGO).ok).toBe(true);
    expect(puedeEditarCamino(ADMINISTRADOR, DE_OTRO).ok).toBe(true);
  });

  it("Normal no cambia ninguno, ni siquiera uno que figure a su nombre", () => {
    expect(puedeEditarCamino(NORMAL, DE_OTRO).ok).toBe(false);
    expect(puedeEditarCamino(NORMAL, { perfilId: "visita", eliminadoEn: null }).ok).toBe(false);
  });

  it("un Camino retirado no se cambia desde la app", () => {
    const retirado = puedeEditarCamino(PREMIUM, RETIRADO);
    expect(retirado.ok).toBe(false);
    if (!retirado.ok) expect(retirado.error).toMatch(/retirado/);
    expect(puedeEditarCamino(ADMINISTRADOR, RETIRADO).ok).toBe(false);
  });
});
