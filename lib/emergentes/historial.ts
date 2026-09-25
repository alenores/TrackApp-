/**
 * El historial del navegador, visto desde una pantalla emergente.
 *
 * **Por qué esto existe aparte.** Una emergente tiene que cerrarse con el botón
 * físico de atrás; para eso la app pone una entrada en el historial al abrirla.
 * La parte delicada es la de cerrar, y es una regla de comportamiento, no de
 * dibujo: por eso vive acá y no adentro del componente.
 *
 * **Cerrar con un botón no vuelve atrás. Medido, no supuesto.**
 *
 * Antes, al cerrar con la X se le pedía al navegador volver atrás para sacar la
 * entrada. El problema es que volver atrás —aunque la dirección no cambie— hace
 * que la app rearme la pantalla entera desde cero. En la pantalla de navegación
 * eso significa que **el mapa se destruye y vuelve a nacer**: desaparece, dice
 * «Abriendo el mapa…» y el toque siguiente cae en el vacío. En el cerro eso es
 * tocar una anotación y que no pase nada.
 *
 * Ahora al cerrar solo se le saca la marca a la entrada, sin moverse. Queda una
 * entrada de sobra, y de eso se ocupan dos cosas: la próxima emergente la reusa
 * en vez de agregar otra, y si el usuario aprieta atrás estando esa entrada de
 * sobra, se sigue de largo para que no tenga que apretar dos veces.
 */

/** ¿Quedó una entrada puesta por una emergente que ya se cerró? */
let entradaDeSobra = false;

/**
 * Cuántas emergentes hay abiertas ahora.
 *
 * La navegación también escucha el atrás, para preguntar si querés salir. Con
 * una emergente abierta, ese atrás es para cerrarla y nada más: sin esta
 * cuenta, cerrar la ficha de una anotación abría además el cartel de salir.
 */
let abiertas = 0;

export function hayEmergenteAbierta(): boolean {
  return abiertas > 0;
}

/** Se llama cuando una emergente deja de estar abierta, se cierre como se cierre. */
export function soltarEmergente(): void {
  abiertas = Math.max(0, abiertas - 1);
}

/** Solo para las pruebas: vuelve a dejar todo como recién arrancado. */
export function olvidarLaEntradaDeSobra(): void {
  entradaDeSobra = false;
  abiertas = 0;
}

export function hayEntradaDeSobra(): boolean {
  return entradaDeSobra;
}

/**
 * Pone la marca que hace que el atrás cierre la emergente.
 *
 * Reusa la entrada que dejó una emergente anterior, si la hay: abrir y cerrar
 * carteles diez veces no puede dejar diez entradas muertas en el historial.
 */
export function abrirEnElHistorial(): void {
  abiertas += 1;
  const marca = { ...window.history.state, emergenteAbierta: true };

  if (entradaDeSobra) {
    entradaDeSobra = false;
    window.history.replaceState(marca, "");
    return;
  }

  window.history.pushState(marca, "");
}

/**
 * Saca la marca al cerrar con un botón, **sin moverse del lugar**.
 *
 * Si la emergente se cerró con el botón físico de atrás, la entrada ya se
 * consumió sola y acá no hay nada que hacer.
 */
export function cerrarEnElHistorial(): void {
  if (!window.history.state?.emergenteAbierta) return;

  window.history.replaceState(
    { ...window.history.state, emergenteAbierta: false },
    "",
  );
  entradaDeSobra = true;
}

/**
 * ¿Este atrás cayó sobre una entrada de sobra?
 *
 * Si cayó ahí no hay nada que cerrar: se sigue de largo, así para el usuario
 * fue un solo apretón, como corresponde.
 */
export function seguirDeLargoSiSobra(): boolean {
  if (!entradaDeSobra) return false;

  entradaDeSobra = false;
  window.history.back();
  return true;
}
