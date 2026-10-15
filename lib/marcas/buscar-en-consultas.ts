import type { CapaDeConsultas } from "@/lib/marcas/consultas";
import type { GrupoDeLaLista } from "@/lib/marcas/lista";

/**
 * Buscar en Consultas: zonas, Caminos y Detalles, sin mirar mayúsculas ni tildes.
 *
 * Cada carácter que coincide vale más en una zona que en un Camino, y más en
 * un Camino que en un detalle. Con el mismo texto escrito, la zona queda
 * primera, después el Camino y al final el detalle. Entre dos de la misma
 * clase, gana el nombre donde el texto aparece más cerca del principio.
 */

/** Cuánto vale cada carácter que coincide, según qué es. */
export const VALOR_DE_CADA_CARACTER: Record<CapaDeConsultas, number> = {
  zonas: 3,
  caminos: 2,
  detalles: 1,
};

/** Cuántos resultados se muestran. El resto se alcanza escribiendo más. */
const CUANTOS_SE_MUESTRAN = 30;

export type ElementoBuscable = {
  capa: CapaDeConsultas;
  id: number;
  titulo: string;
  aclaracion: string;
  /** Dónde se busca: el nombre, y en un detalle también el comentario y el ícono. */
  textos: string[];
  grupo: GrupoDeLaLista;
};

export type CoincidenciaDeConsulta = {
  capa: CapaDeConsultas;
  id: number;
  titulo: string;
  aclaracion: string;
  grupo: GrupoDeLaLista;
  /** Caracteres que coincidieron, multiplicados por lo que vale esa clase. */
  puntaje: number;
};

export type BusquedaDeConsultas = {
  lista: CoincidenciaDeConsulta[];
  /** `true` cuando hay más de las que se muestran. */
  hayMas: boolean;
};

/** Minúsculas, sin tildes y con un solo espacio. «Champaquí» y «champaqui» quedan iguales. */
export function sinTildes(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").replace(/\s+/g, " ").trim();
}

const VACIA: BusquedaDeConsultas = { lista: [], hayMas: false };

export function buscarEnConsultas(consulta: string, elementos: readonly ElementoBuscable[]): BusquedaDeConsultas {
  const buscado = sinTildes(consulta);
  if (!buscado) return VACIA;

  const hallados: (CoincidenciaDeConsulta & { desde: number })[] = [];
  for (const elemento of elementos) {
    let desde = Number.POSITIVE_INFINITY;
    for (const texto of elemento.textos) {
      const indice = sinTildes(texto).indexOf(buscado);
      if (indice >= 0 && indice < desde) desde = indice;
    }
    if (!Number.isFinite(desde)) continue;
    hallados.push({
      capa: elemento.capa,
      id: elemento.id,
      titulo: elemento.titulo,
      aclaracion: elemento.aclaracion,
      grupo: elemento.grupo,
      puntaje: buscado.length * VALOR_DE_CADA_CARACTER[elemento.capa],
      desde,
    });
  }

  hallados.sort((a, b) =>
    b.puntaje - a.puntaje || a.desde - b.desde || a.titulo.localeCompare(b.titulo, "es") || a.id - b.id);

  return {
    lista: hallados.slice(0, CUANTOS_SE_MUESTRAN).map(({ capa, id, titulo, aclaracion, grupo, puntaje }) =>
      ({ capa, id, titulo, aclaracion, grupo, puntaje })),
    hayMas: hallados.length > CUANTOS_SE_MUESTRAN,
  };
}
