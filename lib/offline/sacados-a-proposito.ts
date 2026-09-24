import type { TipoDeMapa } from "@/lib/offline/mapas";

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
 * reintentar el aviso apenas haya señal, y mientras tanto no contar ese mapa
 * como perdido.
 *
 * Cada sacado es un sector y un tipo, porque un sector puede tener los dos
 * mapas y sacar uno no saca el otro. **Sin tipo quiere decir los dos**: así se
 * anotaban antes de que existiera el satelital, y así se siguen leyendo.
 */

export type Sacado = { sectorId: number; tipo: TipoDeMapa | null };

const CLAVE = "trackapp-sacados-a-proposito-v1";

function hayDondeGuardar(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function comoSacado(crudo: unknown): Sacado | null {
  // Los de antes: un número suelto, sin tipo.
  if (typeof crudo === "number" && Number.isFinite(crudo)) {
    return { sectorId: crudo, tipo: null };
  }
  if (typeof crudo !== "string") return null;

  const [id, tipo] = crudo.split(":");
  const sectorId = Number(id);
  if (!Number.isFinite(sectorId) || id === "") return null;
  if (tipo === "simple" || tipo === "satelital") return { sectorId, tipo };
  return null;
}

function comoTexto({ sectorId, tipo }: Sacado): string | number {
  return tipo ? `${sectorId}:${tipo}` : sectorId;
}

function mismo(a: Sacado, b: Sacado): boolean {
  return a.sectorId === b.sectorId && a.tipo === b.tipo;
}

export function losSacadosAProposito(): Sacado[] {
  if (!hayDondeGuardar()) return [];

  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return [];

    const guardados = JSON.parse(crudo) as unknown;
    if (!Array.isArray(guardados)) return [];

    return guardados.flatMap((cada) => {
      const sacado = comoSacado(cada);
      return sacado ? [sacado] : [];
    });
  } catch {
    return [];
  }
}

/** ¿Este mapa lo sacaste vos y la base todavía no lo sabe? */
export function loSacasteVos(sectorId: number, tipo: TipoDeMapa): boolean {
  return losSacadosAProposito().some(
    (cada) => cada.sectorId === sectorId && (cada.tipo === null || cada.tipo === tipo),
  );
}

function guardar(sacados: Sacado[]): boolean {
  if (!hayDondeGuardar()) return false;

  try {
    localStorage.setItem(CLAVE, JSON.stringify(sacados.map(comoTexto)));
    return true;
  } catch {
    return false;
  }
}

/** Queda pendiente de avisarle a la base que este mapa se sacó a propósito. */
export function anotarQueLoSacasteVos(sectorId: number, tipo: TipoDeMapa | null): boolean {
  const nuevo = { sectorId, tipo };
  const actuales = losSacadosAProposito();
  if (actuales.some((cada) => mismo(cada, nuevo))) return true;

  return guardar([...actuales, nuevo]);
}

/**
 * La base ya se enteró, o volviste a bajar ese mapa: el pendiente se va.
 *
 * Volver a bajar un mapa sin sacar el pendiente dejaría que el próximo aviso a
 * la base borrara la anotación del mapa que acabás de bajar. Si el pendiente
 * era de los dos tipos y bajaste uno, queda pendiente el otro.
 */
export function olvidarElSacado(sectorId: number, tipo: TipoDeMapa | null): boolean {
  const actuales = losSacadosAProposito();
  const quedan = actuales.flatMap((cada): Sacado[] => {
    if (cada.sectorId !== sectorId) return [cada];
    if (tipo === null || cada.tipo === tipo) return [];
    if (cada.tipo === null) {
      return [{ sectorId, tipo: tipo === "simple" ? "satelital" : "simple" }];
    }
    return [cada];
  });

  if (quedan.length === actuales.length && quedan.every((cada, i) => mismo(cada, actuales[i]))) {
    return true;
  }
  return guardar(quedan);
}

export function olvidarTodosLosSacados(): void {
  if (!hayDondeGuardar()) return;

  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // Si no se puede borrar, los pendientes viejos se reintentan y la base los
    // ignora: no hay filas vivas de otra cuenta que borrar.
  }
}
