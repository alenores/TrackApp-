/**
 * Qué mapas de sector están bajados en este celular.
 *
 * **Es una anotación liviana, no el mapa.** Los pedazos de mapa pesan megas y
 * viven en el depósito grande (`lib/mapas/deposito.ts`); acá va solo la lista
 * de qué sector tiene mapa, de qué tipo y cuánto ocupa. Está separado porque
 * las pantallas necesitan saberlo **en el momento en que se dibujan**: si
 * tuvieran que esperar al depósito grande, por un instante dirían «falta bajar
 * el mapa» sobre un sector que sí está bajado, que es exactamente la clase de
 * dato equivocado que esta app no puede mostrar.
 *
 * Ver docs/decisiones/012-modelo-de-descarga.md
 */

const CLAVE = "trackapp-mapas-v1";

/**
 * Los dos mapas que puede tener un sector. **Puede tener uno, el otro o los
 * dos** (decidió Ale el 2026-09-24): cada uno se baja y se saca por separado.
 */
export type TipoDeMapa = "simple" | "satelital";

export const TIPOS_DE_MAPA: readonly TipoDeMapa[] = ["simple", "satelital"];

/** Cómo se nombra cada uno en pantalla. Una sola palabra por concepto. */
export const NOMBRE_DEL_TIPO: Record<TipoDeMapa, string> = {
  simple: "Simple",
  satelital: "Satelital",
};

/** El nombre de un mapa bajado: un sector y un tipo. */
export function claveDeMapa(sectorId: number, tipo: TipoDeMapa): string {
  return `${sectorId}:${tipo}`;
}

export type MapaDeSector = {
  sectorId: number;
  tipo: TipoDeMapa;
  /**
   * Lo que esta descarga le sumó al celular, en bytes.
   *
   * Un sector pegado a otro que ya estaba bajado suma menos, porque comparten
   * pedazos y los compartidos ya estaban. Es el número honesto de lo que costó
   * bajarlo, y alcanza: es un dato de consulta, no el centro de ninguna
   * pantalla.
   */
  bytes: number;
  bajadoEn: string;
  /** Hasta qué acercamiento se bajó, para poder rehacer la lista de pedazos. */
  acercamientoMaximo: number;
  /**
   * Las fotos de anotación que entraron con este mapa, por su dirección.
   *
   * Está acá y no en el depósito grande para poder responder **al instante**,
   * con señal y en casa, la única pregunta que importa: ¿le falta bajar alguna
   * foto a este sector? Si hubiera que ir a preguntarle al depósito, la
   * pantalla diría «está todo» por un momento y esa es justo la mentira que
   * después se descubre en el cerro.
   */
  fotos: string[];
};

function hayDondeGuardar(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

let enMemoria: MapaDeSector[] | undefined;
const mirando = new Set<() => void>();

export function mirarLosMapas(avisar: () => void): () => void {
  mirando.add(avisar);
  return () => {
    mirando.delete(avisar);
  };
}

function avisarQueCambio(nuevos: MapaDeSector[]): void {
  enMemoria = nuevos;
  for (const avisar of mirando) avisar();
}

function leerDelCelular(): MapaDeSector[] {
  if (!hayDondeGuardar()) return [];

  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return [];

    const guardados = JSON.parse(crudo) as Partial<MapaDeSector>[];
    if (!Array.isArray(guardados)) return [];

    return guardados.flatMap((cada) =>
      typeof cada?.sectorId === "number" &&
      (cada.tipo === "simple" || cada.tipo === "satelital")
        ? [
            {
              sectorId: cada.sectorId,
              tipo: cada.tipo,
              bytes: typeof cada.bytes === "number" ? cada.bytes : 0,
              bajadoEn: typeof cada.bajadoEn === "string" ? cada.bajadoEn : "",
              acercamientoMaximo:
                typeof cada.acercamientoMaximo === "number" ? cada.acercamientoMaximo : 0,
              // Los mapas bajados antes de que existieran las fotos no tienen
              // la lista. Quedan como «sin ninguna foto», que es la verdad.
              fotos: Array.isArray(cada.fotos)
                ? cada.fotos.filter((cual): cual is string => typeof cual === "string")
                : [],
            },
          ]
        : [],
    );
  } catch {
    return [];
  }
}

function guardarEnElCelular(mapas: MapaDeSector[]): boolean {
  if (!hayDondeGuardar()) return false;

  try {
    localStorage.setItem(CLAVE, JSON.stringify(mapas));
    avisarQueCambio(mapas);
    return true;
  } catch {
    return false;
  }
}

/** Todos los mapas bajados. Se lee del celular una vez y después de memoria. */
export function mapasBajados(): MapaDeSector[] {
  if (enMemoria === undefined) enMemoria = leerDelCelular();
  return enMemoria;
}

/** El mapa de un tipo de un sector, o nada si ese no está bajado. */
export function mapaDelSector(sectorId: number, tipo: TipoDeMapa): MapaDeSector | null {
  return (
    mapasBajados().find((cada) => cada.sectorId === sectorId && cada.tipo === tipo) ?? null
  );
}

/** Todos los mapas bajados de un sector: ninguno, uno o los dos. */
export function mapasDelSector(sectorId: number): MapaDeSector[] {
  return mapasBajados().filter((cada) => cada.sectorId === sectorId);
}

export function sectoresConMapaBajado(): Set<number> {
  return new Set(mapasBajados().map((cada) => cada.sectorId));
}

/**
 * Anota que un sector quedó bajado.
 *
 * **Se llama recién cuando la descarga terminó y se comprobó.** Anotar antes
 * sería decir «listo» sobre algo incompleto: la pantalla mostraría el sector en
 * verde y el usuario saldría al cerro con medio mapa.
 */
export function anotarMapaBajado(mapa: MapaDeSector): boolean {
  const otros = mapasBajados().filter(
    (cada) => !(cada.sectorId === mapa.sectorId && cada.tipo === mapa.tipo),
  );
  return guardarEnElCelular([...otros, mapa]);
}

/** Olvida un tipo de mapa de un sector, o los dos si no se dice cuál. */
export function olvidarMapaDeSector(sectorId: number, tipo?: TipoDeMapa): boolean {
  return guardarEnElCelular(
    mapasBajados().filter(
      (cada) => !(cada.sectorId === sectorId && (tipo === undefined || cada.tipo === tipo)),
    ),
  );
}

export function olvidarTodosLosMapas(): void {
  if (!hayDondeGuardar()) {
    avisarQueCambio([]);
    return;
  }

  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // Si no se puede borrar, queda la anotación vieja. El borrado de los
    // pedazos va por otro lado y no depende de esto.
  }
  avisarQueCambio([]);
}
