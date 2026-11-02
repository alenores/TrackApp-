import type { IconoPunto } from "@/types/database";

/**
 * Color de cada tipo de punto en el mapa y en las listas.
 *
 * No es un color que el usuario elige (eso es de los trazos): sale del ícono.
 * Agua en azul; edificio (iglesia, casa, campamento, refugio) en blanco y
 * gris; cumbre y tranquera en marrón; estacionamiento en amarillo. El resto
 * sigue con el verde de siempre.
 */

export type FamiliaDeIcono = "agua" | "edificio" | "montana" | "estacionamiento" | "natural";

/** El color con el que se pinta el circulito del punto en el mapa. */
export type ColorDeIcono = {
  familia: FamiliaDeIcono;
  /** Relleno del círculo / fondo del ícono en listas. */
  fondo: string;
  /** Trazo del dibujo / texto en listas. */
  trazo: string;
};

const AGUA: ColorDeIcono = { familia: "agua", fondo: "#dbeafe", trazo: "#0284c7" };
const EDIFICIO: ColorDeIcono = { familia: "edificio", fondo: "#f3f4f6", trazo: "#4b5563" };
const MONTANA: ColorDeIcono = { familia: "montana", fondo: "#f5e6d3", trazo: "#92400e" };
const ESTACIONAMIENTO: ColorDeIcono = { familia: "estacionamiento", fondo: "#fef08a", trazo: "#ca8a04" };
const NATURAL: ColorDeIcono = { familia: "natural", fondo: "#d6f2e3", trazo: "#4fa074" };

const POR_ICONO: Record<IconoPunto, ColorDeIcono> = {
  arroyo: AGUA,
  fuente: AGUA,
  cascada: AGUA,
  puente: AGUA,
  iglesia: EDIFICIO,
  casa: EDIFICIO,
  campamento: EDIFICIO,
  refugio: EDIFICIO,
  cumbre: MONTANA,
  tranquera: MONTANA,
  estacionamiento: ESTACIONAMIENTO,
  pueblo: NATURAL,
  cartel: NATURAL,
  cruce: NATURAL,
  mirador: NATURAL,
  sitio: NATURAL,
};

export function colorDelIcono(icono: IconoPunto | null | undefined): ColorDeIcono {
  if (!icono) return NATURAL;
  return POR_ICONO[icono] ?? NATURAL;
}

/** Color del círculo en el mapa: el trazo, que se ve de lejos. */
export function colorDelCirculoDelPunto(icono: IconoPunto | null | undefined): string {
  return colorDelIcono(icono).trazo;
}
