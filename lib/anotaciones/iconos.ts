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
  refugio: "Refugio",
  arroyo: "Arroyo",
  cumbre: "Cumbre",
  puente: "Puente",
  pueblo: "Pueblo",
  cartel: "Cartel",
  fuente: "Fuente",
  iglesia: "Iglesia",
  cruce: "Cruce",
  mirador: "Mirador",
  cascada: "Cascada",
  tranquera: "Tranquera",
};
