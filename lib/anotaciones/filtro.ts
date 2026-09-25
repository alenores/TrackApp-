import type { Anotacion } from "@/types/database";

/**
 * Qué anotaciones se ven al navegar: las tuyas, las del administrador y las
 * de los demás usuarios.
 *
 * **Ninguna anotación es privada**: lo que marca cualquiera lo pueden ver
 * todos. Lo que decide cada uno es cuáles quiere en su mapa. Se recuerda en el
 * celular, para no elegirlo de nuevo cada vez.
 */

export type FiltroDeAnotaciones = {
  mias: boolean;
  delAdministrador: boolean;
  deOtros: boolean;
};

export const TODAS_LAS_ANOTACIONES: FiltroDeAnotaciones = {
  mias: true,
  delAdministrador: true,
  deOtros: true,
};

export function pasaElFiltro(
  anotacion: Pick<Anotacion, "perfilId" | "deAdministrador">,
  filtro: FiltroDeAnotaciones,
  miPerfilId: string | null,
): boolean {
  const esMia = miPerfilId !== null && anotacion.perfilId === miPerfilId;
  // Las del administrador que sos vos cuentan como tuyas y como del
  // administrador: alcanza con que una de las dos casillas esté prendida.
  if (esMia) return filtro.mias || (anotacion.deAdministrador && filtro.delAdministrador);
  if (anotacion.deAdministrador) return filtro.delAdministrador;
  return filtro.deOtros;
}

/** Cómo se lee el filtro en el botón del mapa. */
export function comoSeLlamaElFiltro(filtro: FiltroDeAnotaciones): string {
  const prendidas = [
    filtro.mias ? "tuyas" : null,
    filtro.delAdministrador ? "del administrador" : null,
    filtro.deOtros ? "de otros" : null,
  ].filter(Boolean);

  if (prendidas.length === 3) return "todas";
  if (prendidas.length === 0) return "ninguna";
  return prendidas.join(" y ");
}

const CLAVE = "trackapp-filtro-de-anotaciones-v1";

function leerDelCelular(): FiltroDeAnotaciones {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return TODAS_LAS_ANOTACIONES;
    const guardado = JSON.parse(crudo) as Partial<FiltroDeAnotaciones>;
    return {
      mias: guardado.mias !== false,
      delAdministrador: guardado.delAdministrador !== false,
      deOtros: guardado.deOtros !== false,
    };
  } catch {
    return TODAS_LAS_ANOTACIONES;
  }
}

/** Lo último leído: siempre el mismo objeto mientras no cambie. */
let enMemoria: FiltroDeAnotaciones | undefined;
const mirando = new Set<() => void>();

export function filtroGuardado(): FiltroDeAnotaciones {
  if (enMemoria === undefined) enMemoria = leerDelCelular();
  return enMemoria;
}

export function alCambiarElFiltro(escuchar: () => void): () => void {
  mirando.add(escuchar);
  return () => {
    mirando.delete(escuchar);
  };
}

export function guardarElFiltro(filtro: FiltroDeAnotaciones): void {
  enMemoria = filtro;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(filtro));
  } catch {
    // Sin guardado se elige de nuevo la próxima vez. No rompe nada.
  }
  for (const escuchar of mirando) escuchar();
}
