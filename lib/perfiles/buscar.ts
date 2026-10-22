import { sinTildes } from "@/lib/marcas/buscar-en-consultas";
import type { PerfilBreve } from "@/types/database";

/**
 * Buscar personas por nombre, para los filtros (Participantes en Salidas,
 * Creado por en Circuitos). Busca sobre los usuarios que ya llegaron al
 * celular: escribir no le pregunta a la base.
 */

/** Cuántas se muestran de una vez. Si hay más, se pide seguir escribiendo. */
export const TOPE_DE_PERSONAS = 8;

export function buscarPersonas(
  personas: PerfilBreve[],
  texto: string,
  yaElegidas: string[],
): { lista: PerfilBreve[]; hayMas: boolean } {
  const buscado = sinTildes(texto);
  if (!buscado) return { lista: [], hayMas: false };
  const coinciden = personas
    .filter((persona) => !yaElegidas.includes(persona.id) && sinTildes(persona.nombre).includes(buscado))
    // Primero las que empiezan con lo escrito, después por nombre.
    .sort((a, b) => {
      const empiezaA = sinTildes(a.nombre).startsWith(buscado);
      const empiezaB = sinTildes(b.nombre).startsWith(buscado);
      return empiezaA === empiezaB ? a.nombre.localeCompare(b.nombre, "es") : empiezaA ? -1 : 1;
    });
  return { lista: coinciden.slice(0, TOPE_DE_PERSONAS), hayMas: coinciden.length > TOPE_DE_PERSONAS };
}
