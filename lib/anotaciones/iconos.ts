import type { IconoPunto } from "@/types/database";

/**
 * Cómo se llama cada ícono de anotación, en palabras.
 *
 * Vive acá y no adentro de una pantalla porque lo usan dos: la de armar las
 * anotaciones y la de mirarlas en el cerro. **Un concepto, una palabra**: si
 * cada pantalla escribiera la suya, el mismo punto se llamaría distinto en la
 * computadora y en el celular.
 */
export const COMO_SE_LLAMA: Record<IconoPunto, string> = {
  cascada: "Cascada",
  arroyo: "Arroyo",
  puente: "Puente",
  fuente: "Fuente",
  laguna: "Laguna",
  lago: "Lago",
  juntura: "Juntura",
  campamento: "Campamento",
  refugio: "Refugio",
  casa: "Casa",
  estacionamiento: "Estacionamiento",
  pueblo: "Pueblo",
  iglesia: "Iglesia",
  escalada: "Escalada",
  posible_escalada: "Posible escalada",
  cruce: "Cruce",
  mirador: "Mirador",
  tranquera: "Tranquera",
  cumbre: "Cumbre",
  cartel: "Cartel",
  sitio: "Sitio",
  quebrada: "Quebrada",
  objeto: "Objeto",
};

/**
 * Secciones del selector «Qué es», en el orden de uso en el cerro.
 * Entre una y otra va una línea sutil.
 */
export const SECCIONES_DE_ICONO: IconoPunto[][] = [
  ["cascada", "arroyo", "puente", "fuente", "laguna", "lago", "juntura"],
  ["campamento", "refugio", "casa", "estacionamiento", "pueblo", "iglesia"],
  ["escalada", "posible_escalada"],
  ["cruce", "mirador", "tranquera", "cumbre", "cartel", "sitio", "quebrada", "objeto"],
];
