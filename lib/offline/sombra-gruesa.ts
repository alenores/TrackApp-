/**
 * Qué pedazos del sombreado quedaron con menos detalle (decisión 079).
 *
 * El sombreado fino sale del servicio de alturas de Córdoba (IDECOR). Si al
 * bajar un sector ese servicio no contesta, **el sector baja igual** con el
 * sombreado de 30 m —no se frena una descarga por un detalle— y acá queda
 * anotado cuáles pedazos salieron así y por qué. Con eso la app **avisa en
 * casa**, con el motivo, y ofrece reintentar solo esos pedazos. Decisión de
 * Ale, 2026-10-31.
 *
 * Vive en el guardado liviano porque las pantallas lo necesitan al instante.
 */

const CLAVE = "trackapp-sombra-gruesa-v1";

/** Por cada pedazo con menos detalle, el motivo. */
export type SombraGruesa = Readonly<Record<string, string>>;

function hayDondeGuardar(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

const VACIA: SombraGruesa = Object.freeze({});
let enMemoria: SombraGruesa | undefined;
const mirando = new Set<() => void>();

export function mirarLaSombraGruesa(avisar: () => void): () => void {
  mirando.add(avisar);
  return () => {
    mirando.delete(avisar);
  };
}

function leerDelCelular(): SombraGruesa {
  if (!hayDondeGuardar()) return VACIA;
  try {
    const crudo = localStorage.getItem(CLAVE);
    const leido: unknown = crudo ? JSON.parse(crudo) : {};
    if (!leido || typeof leido !== "object" || Array.isArray(leido)) return VACIA;
    return Object.fromEntries(
      Object.entries(leido).filter((par): par is [string, string] => typeof par[1] === "string"),
    );
  } catch {
    return VACIA;
  }
}

/** Los pedazos con menos detalle. El mismo objeto mientras no cambie. */
export function sombraGruesa(): SombraGruesa {
  if (enMemoria === undefined) enMemoria = leerDelCelular();
  return enMemoria;
}

function guardar(nueva: SombraGruesa): void {
  enMemoria = nueva;
  if (hayDondeGuardar()) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(nueva));
    } catch {
      // Sin lugar en el guardado liviano: queda en memoria hasta cerrar la app.
      // Lo peor que pasa es que el aviso de reintentar no sobreviva al cierre.
    }
  }
  for (const avisar of mirando) avisar();
}

/**
 * Anota cómo llegó un pedazo de sombreado: con el motivo si llegó con menos
 * detalle, o `null` si llegó completo.
 */
export function anotarDetalleDeLaSombra(clave: string, motivo: string | null): void {
  const actual = sombraGruesa();
  if ((actual[clave] ?? null) === motivo) return;
  const nueva = { ...actual };
  if (motivo) nueva[clave] = motivo;
  else delete nueva[clave];
  guardar(nueva);
}

/** Para cuando se borran todos los mapas: no queda nada que mejorar. */
export function olvidarTodaLaSombraGruesa(): void {
  if (Object.keys(sombraGruesa()).length === 0) return;
  guardar({});
}
