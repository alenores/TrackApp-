import { describe, expect, it } from "vitest";
import { leerFilaDeAnotacion } from "@/lib/anotaciones/fila";

/** La ficha de un punto muestra quién lo marcó, con su foto y su nombre (Ale, 2026-11-01). */

const fila = {
  id: 5, sector_id: null, perfil_id: "abc", tipo: "punto", origen: "manual", icono: "fuente", color: null,
  atencion: false, titulo: "Ojo de agua", comentario: "Agua", foto_url: null, foto_chica_url: null,
  geometria: { type: "Point", coordinates: [-64.8, -31.4] }, marcada_en: "2026-10-31T12:00:00Z",
  precision_gps_metros: 3, creado_en: "2026-10-31T12:00:00Z", actualizado_en: "2026-10-31T12:00:00Z",
};

describe("quién marcó el punto", () => {
  it("trae el nombre y la foto del autor", () => {
    const anotacion = leerFilaDeAnotacion({
      ...fila,
      perfiles: { categoria: "administrador", nombre: "Alejandro", avatar_url: "https://foto/ale.webp" },
    });
    expect(anotacion.autor).toEqual({ id: "abc", nombre: "Alejandro", avatarUrl: "https://foto/ale.webp" });
    expect(anotacion.deAdministrador).toBe(true);
  });

  it("sin nombre no inventa un autor", () => {
    expect(leerFilaDeAnotacion({ ...fila, perfiles: { categoria: "normal" } }).autor).toBeNull();
  });
});
