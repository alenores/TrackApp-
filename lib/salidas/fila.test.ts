import { describe, expect, it } from "vitest";
import { leerSalida, NOMBRE_SI_NO_TIENE, type FilaDeSalida } from "@/lib/salidas/fila";

const FILA: FilaDeSalida = {
  id: 7,
  titulo: "Los Gigantes",
  fecha: "2026-09-28",
  descripcion: "  ",
  actividades: ["trekking"],
  nivel_esfuerzo: "alto",
  largo_km: "14.30",
  desnivel_positivo_m: 820,
  desnivel_negativo_m: 640,
  archivo_url: null,
  creado_en: "2026-09-29T10:00:00Z",
  perfil: { id: "a", nombre: "Ale", avatar_url: null },
  fotos: [
    { orden: 2, foto_url: "tres", eliminado_en: null },
    { orden: 0, foto_url: "portada", eliminado_en: null },
    { orden: 1, foto_url: "borrada", eliminado_en: "2026-09-30T00:00:00Z" },
  ],
  companeros: [
    { eliminado_en: null, perfil: { id: "b", nombre: null, avatar_url: null } },
    { eliminado_en: "2026-09-30T00:00:00Z", perfil: { id: "c", nombre: "Ya no", avatar_url: null } },
  ],
};

describe("leerSalida", () => {
  it("ordena las fotos con la portada primero y saca las borradas", () => {
    expect(leerSalida(FILA).fotos).toEqual(["portada", "tres"]);
  });

  it("saca a los compañeros borrados y pone un nombre a quien no tiene", () => {
    expect(leerSalida(FILA).companeros).toEqual([
      { id: "b", nombre: NOMBRE_SI_NO_TIENE, avatarUrl: null },
    ]);
  });

  it("lee el largo aunque la base lo mande como texto", () => {
    expect(leerSalida(FILA).largoKm).toBe(14.3);
  });

  it("una descripción en blanco es no tener descripción", () => {
    expect(leerSalida(FILA).descripcion).toBeNull();
  });

  it("aguanta que falten las listas", () => {
    const salida = leerSalida({ ...FILA, fotos: null, companeros: null, perfil: null });
    expect(salida.fotos).toEqual([]);
    expect(salida.companeros).toEqual([]);
    expect(salida.perfil.nombre).toBe(NOMBRE_SI_NO_TIENE);
  });
});
