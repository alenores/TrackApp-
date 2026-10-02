import type { ActividadRuta, NivelEsfuerzo } from "@/types/database";

/**
 * Las reglas de una salida, sin nada de pantalla ni de base.
 *
 * **Salidas es 100 % con internet**: se carga y se mira con señal. Nada de esto
 * se guarda en el celular ni se usa en el cerro.
 *
 * La base vuelve a exigir lo mismo por su cuenta (título, al menos una
 * actividad, números que no sean negativos). Esto existe para que el usuario
 * se entere antes de esperar la subida, con palabras que entienda.
 */

/** Hasta cuatro fotos. La primera es la portada. */
export const MAXIMO_DE_FOTOS = 4;

export const LARGO_MAXIMO_DEL_TITULO = 120;

export type DatosDeSalida = {
  titulo: string;
  /** «2026-10-02», como lo entrega el elegidor de fecha. */
  fecha: string;
  descripcion: string;
  actividades: ActividadRuta[];
  nivelEsfuerzo: NivelEsfuerzo | null;
  largoKm: number | null;
  desnivelPositivoM: number | null;
  desnivelNegativoM: number | null;
  /** Los usuarios que fueron, sin contar a quien la carga. */
  companeros: string[];
};

/** Hoy, en Córdoba, como lo escribe el elegidor de fecha: «2026-10-02». */
export function hoyEnCordoba(ahora: Date = new Date()): string {
  return ahora.toLocaleDateString("en-CA", { timeZone: "America/Argentina/Cordoba" });
}

/**
 * Revisa los datos antes de guardar.
 *
 * Devuelve `null` cuando está todo bien, o **qué pasó y qué hacer** cuando no.
 */
export function revisarLaSalida(
  datos: DatosDeSalida,
  hoy: string = hoyEnCordoba(),
): string | null {
  const titulo = datos.titulo.trim();
  if (!titulo) return "Ponele un título a la salida.";
  if (titulo.length > LARGO_MAXIMO_DEL_TITULO) {
    return `El título es muy largo: tiene ${titulo.length} letras y el máximo son ${LARGO_MAXIMO_DEL_TITULO}. Acortalo.`;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha)) {
    return "Elegí el día de la salida.";
  }
  if (datos.fecha > hoy) {
    return "La fecha de la salida es más adelante que hoy. Elegí el día en que la hiciste.";
  }

  if (datos.actividades.length === 0) {
    return "Elegí al menos un tipo de actividad.";
  }

  const numeros: [string, number | null][] = [
    ["Los kilómetros", datos.largoKm],
    ["Los metros que subiste", datos.desnivelPositivoM],
    ["Los metros que bajaste", datos.desnivelNegativoM],
  ];
  for (const [nombre, valor] of numeros) {
    if (valor !== null && (!Number.isFinite(valor) || valor < 0)) {
      return `${nombre} tienen que ser un número positivo. Corregilo o dejalo vacío.`;
    }
  }

  return null;
}

/**
 * Lee un número que el usuario escribió a mano.
 *
 * Acepta coma o punto decimal, que es como se escribe acá. Vacío es «no lo
 * sé», no cero.
 */
export function leerNumero(texto: string): number | null {
  const limpio = texto.trim().replace(",", ".");
  if (!limpio) return null;
  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : Number.NaN;
}
