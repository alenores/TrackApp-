import type { ReactNode } from "react";
import { ICONO_DE_CIRCUITOS, ICONO_DE_MARCAS } from "@/components/ui/iconos";

export const TRAZOS_DE_NAVEGACION = <>
  <circle cx="12" cy="12" r="9" />
  <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
</>;

export type SubdestinoDelMenu = {
  href: string;
  etiqueta: string;
  /** Una línea que dice qué hay adentro, para las tarjetas del celular. */
  queHay: string;
  icono: ReactNode;
};

type DestinoDelMenu = {
  href: string;
  etiqueta: string;
  necesitaSenal?: boolean;
  icono: ReactNode;
  /**
   * Las entradas de adentro, cuando el destino tiene varias pantallas. En la
   * computadora se despliegan en la barra lateral; en el celular, tocarlo lleva
   * a una pantalla con una tarjeta por entrada. Adentro de cada una no quedan
   * botones de pestañas: la elección ya quedó atrás.
   */
  subdestinos?: SubdestinoDelMenu[];
  /** Otras direcciones que también cuentan como estar en este destino. */
  tambienEn?: string[];
};

/** Las cuatro entradas de Mapas, en el orden que decidió Ale el 2026-10-13. */
export const SUBDESTINOS_DE_MAPAS: SubdestinoDelMenu[] = [
  { href: "/mapas/consultas", etiqueta: "Consultas", queHay: "El mapa con todo lo marcado y las zonas.",
    icono: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></> },
  { href: "/mapas/marcas", etiqueta: "Marcas", queHay: "Caminos, puntos y trazos.",
    icono: ICONO_DE_MARCAS },
  { href: "/zonas", etiqueta: "Zonas", queHay: "Las zonas y sus sectores.",
    icono: <><rect x="4" y="4" width="16" height="16" rx="1" strokeDasharray="3 2" /><path d="M4 12h16M12 4v16" /></> },
  { href: "/mapas/descargas", etiqueta: "Descargas", queHay: "Los mapas que bajaste a este celular.",
    icono: <><path d="M12 4v11m0 0-4-4m4 4 4-4" /><path d="M5 19h14" /></> },
];

/** El mismo orden y los mismos íconos en celular y computadora. */
export const DESTINOS_DEL_MENU: DestinoDelMenu[] = [
  { href: "/salidas", etiqueta: "Salidas", necesitaSenal: true,
    icono: <path d="M6 21V4m0 0h10l-2 3.5 2 3.5H6" /> },
  { href: "/circuitos", etiqueta: "Circuitos",
    icono: ICONO_DE_CIRCUITOS },
  { href: "/mapa-libre", etiqueta: "Navegación libre", icono: TRAZOS_DE_NAVEGACION },
  { href: "/mapas", etiqueta: "Mapas", necesitaSenal: true,
    subdestinos: SUBDESTINOS_DE_MAPAS, tambienEn: ["/zonas"],
    icono: <><path d="M9 3 2 7v14l7-4 6 4 7-4V3l-7 4-6-4Z" /><path d="M9 3v14M15 7v14" /></> },
  { href: "/perfiles", etiqueta: "Perfiles", necesitaSenal: true,
    icono: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" /></> },
];

function estaEn(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function destinoActivo(href: string, pathname: string): boolean {
  if (href === "/salidas") return pathname === "/" || pathname.startsWith("/salidas");
  const destino = DESTINOS_DEL_MENU.find((cada) => cada.href === href);
  return estaEn(href, pathname) || (destino?.tambienEn ?? []).some((otra) => estaEn(otra, pathname));
}

/** La subentrada donde está el usuario, o `null`. */
export function subdestinoActivo(subdestinos: SubdestinoDelMenu[], pathname: string): SubdestinoDelMenu | null {
  return subdestinos.find((cada) => estaEn(cada.href, pathname)) ?? null;
}
