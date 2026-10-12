import type { ReactNode } from "react";

export const TRAZOS_DE_NAVEGACION = <>
  <circle cx="12" cy="12" r="9" />
  <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
</>;

type DestinoDelMenu = {
  href: string;
  etiqueta: string;
  necesitaSenal?: boolean;
  icono: ReactNode;
};

/** El mismo orden y los mismos íconos en celular y computadora. */
export const DESTINOS_DEL_MENU: DestinoDelMenu[] = [
  { href: "/salidas", etiqueta: "Salidas", necesitaSenal: true,
    icono: <path d="M6 21V4m0 0h10l-2 3.5 2 3.5H6" /> },
  { href: "/circuitos", etiqueta: "Circuitos",
    icono: <path d="M3 18 8 8l5 5 8-9M3 18h5m5-5h4" /> },
  { href: "/mapa-libre", etiqueta: "Navegación libre", icono: TRAZOS_DE_NAVEGACION },
  { href: "/zonas", etiqueta: "Mapas",
    icono: <><path d="M9 3 2 7v14l7-4 6 4 7-4V3l-7 4-6-4Z" /><path d="M9 3v14M15 7v14" /></> },
  { href: "/perfiles", etiqueta: "Perfiles", necesitaSenal: true,
    icono: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" /></> },
];

export function destinoActivo(href: string, pathname: string): boolean {
  return href === "/salidas"
    ? pathname === "/" || pathname.startsWith("/salidas")
    : pathname === href || pathname.startsWith(`${href}/`);
}
