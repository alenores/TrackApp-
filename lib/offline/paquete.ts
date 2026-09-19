import type { Anotacion, RutaSinRecorrido, Sector, Zona } from "@/types/database";

/**
 * El paquete offline: lo que la app guarda en el celular para funcionar sin
 * señal.
 *
 * Todas las rutas con sus datos, todas las zonas, todos los sectores y todas
 * las anotaciones viajan siempre y completos. El usuario no elige eso: son
 * coordenadas y texto, pesan nada al lado de un mapa. **Lo único que el usuario
 * elige descargar es el mapa de un sector.**
 *
 * Ver docs/decisiones/012-modelo-de-descarga.md
 *
 * **Las líneas de los recorridos no van acá**, sino en el depósito grande del
 * navegador (`recorridos.ts`): pesan demasiado para el guardado simple y
 * llenarlo dejaría a la app sin poder guardar nada. Acá va solo lo liviano, que
 * es lo que dibuja las pantallas al instante.
 */

const CLAVE_PAQUETE = "trackapp-paquete-v1";
const CLAVE_GALLETITA = "trackapp-tiene-paquete";

export type Paquete = {
  rutas: RutaSinRecorrido[];
  zonas: Zona[];
  sectores: Sector[];
  anotaciones: Anotacion[];
  /**
   * La fecha de modificación más nueva que se vio al guardar este paquete.
   * Comparándola contra la de la base se sabe si hay novedades sin traer nada.
   */
  ultimaModificacion: string | null;
  guardadoEn: string;
};

const PAQUETE_VACIO: Paquete = {
  rutas: [],
  zonas: [],
  sectores: [],
  anotaciones: [],
  ultimaModificacion: null,
  guardadoEn: "",
};

/**
 * El navegador puede negar el almacenamiento —modo privado, espacio lleno,
 * permisos— y ahí cualquier lectura o escritura tira. Nada de esto puede
 * romper una pantalla, así que todo va envuelto.
 */
function hayDondeGuardar(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

// ------------------------------------------------ el paquete, como estado vivo

/**
 * Lo último leído del celular.
 *
 * Existe para que la pantalla pueda pedir el paquete en cada dibujado sin
 * volver a leer y desarmar todo el texto guardado. Mientras nadie lo cambie,
 * siempre se devuelve exactamente lo mismo.
 */
let enMemoria: Paquete | null | undefined;

const mirando = new Set<() => void>();

export function mirarElPaquete(avisar: () => void): () => void {
  mirando.add(avisar);
  return () => {
    mirando.delete(avisar);
  };
}

export function paqueteEnMemoria(): Paquete | null {
  if (enMemoria === undefined) enMemoria = leerPaquete();
  return enMemoria;
}

function avisarQueCambio(nuevo: Paquete | null): void {
  enMemoria = nuevo;
  for (const avisar of mirando) avisar();
}

export function leerPaquete(): Paquete | null {
  if (!hayDondeGuardar()) return null;

  try {
    const crudo = localStorage.getItem(CLAVE_PAQUETE);
    if (!crudo) return null;

    const paquete = JSON.parse(crudo) as Partial<Paquete>;

    return {
      ...PAQUETE_VACIO,
      ...paquete,
      rutas: paquete.rutas ?? [],
      zonas: paquete.zonas ?? [],
      sectores: paquete.sectores ?? [],
      anotaciones: paquete.anotaciones ?? [],
    };
  } catch {
    return null;
  }
}

export type GuardadoDePaquete =
  | { ok: true }
  | { ok: false; sinEspacio: boolean };

export function guardarPaquete(
  paquete: Omit<Paquete, "guardadoEn">,
): GuardadoDePaquete {
  if (!hayDondeGuardar()) return { ok: false, sinEspacio: false };

  try {
    const guardado: Paquete = {
      ...paquete,
      guardadoEn: new Date().toISOString(),
    };

    localStorage.setItem(CLAVE_PAQUETE, JSON.stringify(guardado));
    marcarQueHayPaquete();
    avisarQueCambio(guardado);
    return { ok: true };
  } catch (error) {
    const sinEspacio =
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED");

    return { ok: false, sinEspacio };
  }
}

export function borrarPaquete(): void {
  if (!hayDondeGuardar()) return;

  try {
    localStorage.removeItem(CLAVE_PAQUETE);
    desmarcarQueHayPaquete();
    avisarQueCambio(null);
  } catch {
    // Si no se puede borrar, el paquete viejo queda. No rompe nada.
  }
}

/**
 * Una galletita que le avisa al servidor que este celular ya tiene paquete.
 * Sirve para no mandarlo a una pantalla vacía cuando abre sin señal.
 */
function marcarQueHayPaquete(): void {
  if (typeof document === "undefined") return;
  const vence = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${CLAVE_GALLETITA}=1; path=/; expires=${vence}; SameSite=Lax`;
}

function desmarcarQueHayPaquete(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${CLAVE_GALLETITA}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

/**
 * ¿Lo que hay guardado quedó viejo?
 *
 * Se compara contra la fecha de modificación más nueva de la base. Si es más
 * nueva que la del paquete, hay novedades. **La actualización es automática y
 * muda**: no se le pregunta nada al usuario.
 */
export function elPaqueteQuedoViejo(
  paquete: Paquete | null,
  ultimaModificacionEnLaBase: string | null,
): boolean {
  if (!paquete) return true;
  if (!ultimaModificacionEnLaBase) return false;
  if (!paquete.ultimaModificacion) return true;

  return (
    new Date(ultimaModificacionEnLaBase).getTime() >
    new Date(paquete.ultimaModificacion).getTime()
  );
}
