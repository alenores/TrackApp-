import { describe, expect, it } from "vitest";
import { buscarPersonas, TOPE_DE_PERSONAS } from "@/lib/perfiles/buscar";
import type { PerfilBreve } from "@/types/database";

function persona(id: string, nombre: string): PerfilBreve {
  return { id, nombre, avatarUrl: null };
}

const ale = persona("1", "Alejandro");
const ines = persona("2", "Inés Álvarez");
const pepa = persona("3", "Pepa");
const todas = [pepa, ines, ale];

describe("buscarPersonas", () => {
  it("sin nada escrito no muestra a nadie", () => {
    expect(buscarPersonas(todas, "  ", [])).toEqual({ lista: [], hayMas: false });
  });

  it("ignora mayúsculas y tildes, y primero las que empiezan con lo escrito", () => {
    expect(buscarPersonas(todas, "al", []).lista).toEqual([ale, ines]);
    expect(buscarPersonas(todas, "INES", []).lista).toEqual([ines]);
  });

  it("no repite a las que ya están elegidas", () => {
    expect(buscarPersonas(todas, "a", [ale.id]).lista).toEqual([ines, pepa]);
  });

  it("muestra hasta el tope y avisa que hay más", () => {
    const muchas = Array.from({ length: TOPE_DE_PERSONAS + 2 }, (_, indice) => persona(String(indice), `Ana ${indice}`));
    const resultado = buscarPersonas(muchas, "ana", []);
    expect(resultado.lista).toHaveLength(TOPE_DE_PERSONAS);
    expect(resultado.hayMas).toBe(true);
  });
});
