import type { IconoPunto } from "@/types/database";

/**
 * Color de cada tipo de punto en el mapa y en las listas.
 *
 * No es un color que el usuario elige (eso es de los trazos): sale del ícono.
 * Agua en azul; edificio (iglesia, casa, campamento, refugio) en blanco y
 * gris; cumbre, tranquera y quebrada en marrón; estacionamiento en amarillo;
 * escalada en naranja; posible escalada y objeto en gris. El resto sigue con
 * el verde de siempre.
 */

export type FamiliaDeIcono =
  | "agua"
  | "edificio"
  | "montana"
  | "estacionamiento"
  | "escalada"
  | "natural";

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
const ESCALADA: ColorDeIcono = { familia: "escalada", fondo: "#ffedd5", trazo: "#ea580c" };
const NATURAL: ColorDeIcono = { familia: "natural", fondo: "#d6f2e3", trazo: "#4fa074" };

const POR_ICONO: Record<IconoPunto, ColorDeIcono> = {
  cascada: AGUA,
  arroyo: AGUA,
  puente: AGUA,
  fuente: AGUA,
  laguna: AGUA,
  lago: AGUA,
  juntura: AGUA,
  campamento: EDIFICIO,
  refugio: EDIFICIO,
  casa: EDIFICIO,
  iglesia: EDIFICIO,
  posible_escalada: EDIFICIO,
  objeto: EDIFICIO,
  cumbre: MONTANA,
  tranquera: MONTANA,
  quebrada: MONTANA,
  estacionamiento: ESTACIONAMIENTO,
  escalada: ESCALADA,
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
