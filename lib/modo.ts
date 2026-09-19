/**
 * El modo de color: sol o noche.
 *
 * **Se cambia a mano, con un botón.** El automático del sistema va por horario,
 * no por si está pegando el sol, así que no se usa: a las cinco de la tarde en
 * el cerro puede estar reventando el sol y el sistema ya se puso en oscuro.
 *
 * Ver docs/DISENO_EXTERIOR.md y la regla «Sol y oscuridad» de AGENTS.md.
 */

export type Modo = "sol" | "noche";

export const MODOS: Modo[] = ["sol", "noche"];

/** Arranca en noche, que es como se ve la app desde siempre. */
export const MODO_POR_DEFECTO: Modo = "noche";

const LLAVE = "trackapp-modo-v1";

/** El color de la barra del sistema, para que no quede un borde de otro color. */
const COLOR_DE_BARRA: Record<Modo, string> = {
  sol: "#f8fafc",
  noche: "#0f172a",
};

export function esModo(valor: unknown): valor is Modo {
  return valor === "sol" || valor === "noche";
}

export function leerModoGuardado(): Modo {
  if (typeof window === "undefined") return MODO_POR_DEFECTO;

  try {
    const guardado = window.localStorage.getItem(LLAVE);
    return esModo(guardado) ? guardado : MODO_POR_DEFECTO;
  } catch {
    // Navegador con el almacenamiento bloqueado: se usa el de siempre.
    return MODO_POR_DEFECTO;
  }
}

export function guardarModo(modo: Modo): void {
  try {
    window.localStorage.setItem(LLAVE, modo);
  } catch {
    // Si no se puede guardar, el modo igual vale para esta sesión.
  }
}

export function aplicarModo(modo: Modo): void {
  if (typeof document === "undefined") return;

  document.documentElement.setAttribute("data-modo", modo);

  const barra = document.querySelector('meta[name="theme-color"]');
  if (barra) barra.setAttribute("content", COLOR_DE_BARRA[modo]);
}

export function elOtroModo(modo: Modo): Modo {
  return modo === "sol" ? "noche" : "sol";
}

/**
 * El mismo cálculo, escrito para correr en el `<head>` antes de que se dibuje
 * nada. Sin esto la app aparece en un modo y salta al otro, que con sol de
 * frente es un parpadeo blanco en la cara.
 */
export const GUION_DE_ARRANQUE = `(function(){try{var m=localStorage.getItem(${JSON.stringify(
  LLAVE,
)});if(m!=="sol"&&m!=="noche"){m=${JSON.stringify(
  MODO_POR_DEFECTO,
)};}document.documentElement.setAttribute("data-modo",m);var b=document.querySelector('meta[name="theme-color"]');if(b){b.setAttribute("content",m==="sol"?${JSON.stringify(
  COLOR_DE_BARRA.sol,
)}:${JSON.stringify(COLOR_DE_BARRA.noche)});}}catch(e){}})();`;
