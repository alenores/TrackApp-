/**
 * Los mapas que el usuario sacó a propósito y la base todavía no sabe.
 *
 * **Sin esta lista la app le mentiría.** Sacar un mapa del celular funciona sin
 * señal, porque es todo local; avisarle a la base, no. Si el aviso no llega, la
 * base sigue diciendo que ese mapa lo tenías, el celular dice que no, y la
 * próxima vez que abra con señal la app le grita que lo perdió y le ofrece bajar
 * de nuevo lo que él mismo tiró.
 *
 * Así que el sacado queda anotado acá hasta que la base lo acepte. Dos usos:
 * reintentar el aviso apenas haya señal, y mientras tanto no contar ese sector
 * como perdido.
 */

const CLAVE = "trackapp-sacados-a-proposito-v1";

function hayDondeGuardar(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function losSacadosAProposito(): number[] {
  if (!hayDondeGuardar()) return [];

  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return [];

    const guardados = JSON.parse(crudo) as unknown;
    if (!Array.isArray(guardados)) return [];

    return guardados.filter(
      (cada): cada is number => typeof cada === "number" && Number.isFinite(cada),
    );
  } catch {
    return [];
  }
}

function guardar(sectores: number[]): boolean {
  if (!hayDondeGuardar()) return false;

  try {
    localStorage.setItem(CLAVE, JSON.stringify(sectores));
    return true;
  } catch {
    return false;
  }
}

/** Queda pendiente de avisarle a la base que este mapa se sacó a propósito. */
export function anotarQueLoSacasteVos(sectorId: number): boolean {
  const actuales = losSacadosAProposito();
  if (actuales.includes(sectorId)) return true;

  return guardar([...actuales, sectorId]);
}

/** La base ya se enteró: el pendiente se va. */
export function olvidarElSacado(sectorId: number): boolean {
  const actuales = losSacadosAProposito();
  if (!actuales.includes(sectorId)) return true;

  return guardar(actuales.filter((cada) => cada !== sectorId));
}

/**
 * Volviste a bajar ese mapa, así que el pendiente ya no corresponde.
 *
 * Sin esto, bajar de nuevo un sector que habías sacado dejaría el pendiente
 * puesto, y el próximo intento de avisarle a la base borraría la anotación del
 * mapa que acabás de bajar.
 */
export const olvidarElSacadoPorqueLoBajasteDeNuevo = olvidarElSacado;

export function olvidarTodosLosSacados(): void {
  if (!hayDondeGuardar()) return;

  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // Que no se pueda limpiar no rompe nada: la lista se vuelve a intentar.
  }
}
