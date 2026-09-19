import {
  borrarTeselasQueSobran,
  borrarTodasLasTeselas,
  cualesEstanGuardadas,
  guardarTeselas,
} from "@/lib/mapas/deposito";
import {
  ACERCAMIENTO_MAXIMO,
  claveDeTesela,
  cuantasTeselas,
  teselasDelRectangulo,
  type Tesela,
} from "@/lib/mapas/teselas";
import {
  anotarMapaBajado,
  mapasBajados,
  olvidarMapaDeSector,
  olvidarTodosLosMapas,
  type TipoDeMapa,
} from "@/lib/offline/mapas";
import type { Sector } from "@/types/database";

/**
 * Bajar el mapa de un sector, y borrarlo.
 *
 * Es el único lugar que junta las tres piezas: la cuenta de qué pedazos hacen
 * falta, el depósito donde se guardan y la anotación liviana que leen las
 * pantallas.
 *
 * **De dónde salen los bytes no se decide acá.** Se recibe de afuera, para que
 * cambiar de proveedor de mapas no toque nada de esto.
 *
 * Dos reglas mandan sobre todo lo demás:
 *
 * 1. **Nunca se dice «listo» sobre una descarga incompleta.** Al final se
 *    vuelve a preguntarle al depósito qué quedó guardado y se compara contra lo
 *    que se pidió. Recién si coincide se anota el sector como bajado. Un sector
 *    marcado en verde es una promesa: el usuario sale al cerro por eso.
 * 2. **Si se corta a la mitad, queda lo que había.** Los pedazos que sí
 *    entraron se conservan —la próxima vez no se vuelven a bajar— pero el
 *    sector no queda anotado.
 */

export type FuenteDeTeselas = {
  /** Cómo se llama, para poder decir en pantalla qué falló. */
  nombre: string;
  /**
   * Los bytes de un pedazo.
   *
   * Devolver **nada** es una respuesta válida y normal: quiere decir que en ese
   * pedazo no hay nada que dibujar. No es una falla. Una falla se avisa
   * tirando, con el motivo real adentro.
   */
  pedirTesela(tesela: Tesela, senal: AbortSignal): Promise<Uint8Array | null>;
};

export type AvanceDeDescarga = {
  resueltos: number;
  total: number;
  bytes: number;
};

export type ResultadoDeDescarga =
  | { estado: "listo"; pedazos: number; bytes: number }
  | { estado: "cancelada" }
  | { estado: "incompleta"; motivo: string; resueltos: number; total: number };

/** Cuántos pedazos se piden a la vez. Más no acelera: satura la conexión. */
const A_LA_VEZ = 6;

/** Cada cuántos pedazos se graba. Grabar de a uno es lento; de a mil, arriesgado. */
const GRABAR_CADA = 32;

/** Cuántas veces se reintenta un pedazo antes de darlo por perdido. */
const REINTENTOS = 2;

function esperar(milisegundos: number): Promise<void> {
  return new Promise((seguir) => setTimeout(seguir, milisegundos));
}

async function pedirConReintentos(
  fuente: FuenteDeTeselas,
  tesela: Tesela,
  senal: AbortSignal,
): Promise<Uint8Array | null> {
  let ultimoError: unknown;

  for (let intento = 0; intento <= REINTENTOS; intento += 1) {
    if (senal.aborted) throw new DOMException("Cancelado", "AbortError");

    try {
      return await fuente.pedirTesela(tesela, senal);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      ultimoError = error;
      await esperar(400 * 2 ** intento);
    }
  }

  throw ultimoError;
}

function motivoDe(error: unknown, fuente: FuenteDeTeselas): string {
  if (error instanceof Error && error.message) return error.message;
  return `No se pudo traer el mapa de ${fuente.nombre}.`;
}

export type PedidoDeDescarga = {
  sector: Sector;
  tipo: TipoDeMapa;
  fuente: FuenteDeTeselas;
  acercamientoMaximo?: number;
  avisarAvance?: (avance: AvanceDeDescarga) => void;
  senal?: AbortSignal;
};

export async function bajarElMapaDelSector({
  sector,
  tipo,
  fuente,
  acercamientoMaximo = ACERCAMIENTO_MAXIMO,
  avisarAvance,
  senal = new AbortController().signal,
}: PedidoDeDescarga): Promise<ResultadoDeDescarga> {
  const teselas = teselasDelRectangulo(sector.rectangulo, acercamientoMaximo);
  const claves = teselas.map(claveDeTesela);
  const total = teselas.length;

  let yaEstaban: Set<string>;
  try {
    yaEstaban = await cualesEstanGuardadas(claves);
  } catch (error) {
    return {
      estado: "incompleta",
      motivo: motivoDe(error, fuente),
      resueltos: 0,
      total,
    };
  }

  const faltan = teselas.filter((tesela) => !yaEstaban.has(claveDeTesela(tesela)));

  let resueltos = yaEstaban.size;
  let bytes = 0;
  const avisar = () => avisarAvance?.({ resueltos, total, bytes });
  avisar();

  let siguiente = 0;
  let porGrabar: Array<{ clave: string; bytes: Uint8Array }> = [];
  let fallo: unknown = null;

  async function grabarLoPendiente(): Promise<void> {
    if (porGrabar.length === 0) return;
    const tanda = porGrabar;
    porGrabar = [];
    await guardarTeselas(tanda);
  }

  async function trabajar(): Promise<void> {
    for (;;) {
      if (fallo || senal.aborted) return;

      const indice = siguiente;
      siguiente += 1;
      if (indice >= faltan.length) return;

      const tesela = faltan[indice];

      try {
        const traida = await pedirConReintentos(fuente, tesela, senal);
        // Un pedazo sin nada que dibujar se guarda vacío a propósito: así queda
        // resuelto y no se vuelve a pedir nunca más.
        const contenido = traida ?? new Uint8Array(0);

        porGrabar.push({ clave: claveDeTesela(tesela), bytes: contenido });
        bytes += contenido.byteLength;
        resueltos += 1;
        avisar();

        if (porGrabar.length >= GRABAR_CADA) await grabarLoPendiente();
      } catch (error) {
        fallo ??= error;
        return;
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(A_LA_VEZ, Math.max(faltan.length, 1)) }, trabajar),
  );

  try {
    await grabarLoPendiente();
  } catch (error) {
    fallo ??= error;
  }

  if (senal.aborted) return { estado: "cancelada" };

  if (fallo) {
    const esCancelacion =
      fallo instanceof DOMException && fallo.name === "AbortError";
    if (esCancelacion) return { estado: "cancelada" };

    return {
      estado: "incompleta",
      motivo: motivoDe(fallo, fuente),
      resueltos,
      total,
    };
  }

  // La comprobación. No se cree en la cuenta propia: se le pregunta al depósito
  // qué quedó guardado de verdad.
  let quedaron: Set<string>;
  try {
    quedaron = await cualesEstanGuardadas(claves);
  } catch (error) {
    return {
      estado: "incompleta",
      motivo: motivoDe(error, fuente),
      resueltos,
      total,
    };
  }

  if (quedaron.size !== total) {
    return {
      estado: "incompleta",
      motivo: `Entraron ${quedaron.size} de ${total} pedazos del mapa. Puede que no haya más espacio en el celular.`,
      resueltos: quedaron.size,
      total,
    };
  }

  const anotado = anotarMapaBajado({
    sectorId: sector.id,
    tipo,
    bytes,
    bajadoEn: new Date().toISOString(),
    acercamientoMaximo,
  });

  if (!anotado) {
    return {
      estado: "incompleta",
      motivo:
        "El mapa entró pero no se pudo anotar en este celular. Fijate que el navegador tenga permitido guardar datos de sitios.",
      resueltos: total,
      total,
    };
  }

  return { estado: "listo", pedazos: total, bytes };
}

/**
 * Los pedazos que siguen haciendo falta después de sacar un sector.
 *
 * Se rehace desde los rectángulos, no desde una lista guardada: la cuenta es la
 * misma de siempre y así no hay dos verdades sobre qué pedazos son de quién.
 */
function clavesQueSiguenHaciendoFalta(sectores: Sector[]): Set<string> {
  const porSector = new Map(sectores.map((sector) => [sector.id, sector]));
  const claves = new Set<string>();

  for (const mapa of mapasBajados()) {
    const sector = porSector.get(mapa.sectorId);
    if (!sector) continue;

    for (const tesela of teselasDelRectangulo(
      sector.rectangulo,
      mapa.acercamientoMaximo || ACERCAMIENTO_MAXIMO,
    )) {
      claves.add(claveDeTesela(tesela));
    }
  }

  return claves;
}

export type ResultadoDeBorrado = { ok: true } | { ok: false; motivo: string };

/**
 * Sacar del celular el mapa de un sector.
 *
 * **Primero se deja de prometer, después se borra.** Si el borrado de los
 * pedazos falla a mitad de camino, lo peor que queda es espacio ocupado de
 * gusto; al revés quedaría un sector anotado como bajado al que le faltan
 * pedazos, y eso se descubre en el cerro.
 */
export async function borrarElMapaDelSector(
  sectorId: number,
  todosLosSectores: Sector[],
): Promise<ResultadoDeBorrado> {
  olvidarMapaDeSector(sectorId);

  try {
    await borrarTeselasQueSobran(clavesQueSiguenHaciendoFalta(todosLosSectores));
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      motivo:
        error instanceof Error && error.message
          ? `El mapa ya no se usa, pero el espacio no se liberó: ${error.message}`
          : "El mapa ya no se usa, pero el espacio no se liberó.",
    };
  }
}

/** Para cuando se cierra sesión: no queda mapa de la cuenta anterior. */
export async function borrarTodosLosMapasDelCelular(): Promise<void> {
  olvidarTodosLosMapas();
  await borrarTodasLasTeselas();
}

/**
 * Cuánto pesa, más o menos, el mapa de un rectángulo.
 *
 * **Es una estimación, no una promesa**, y se dice así en pantalla. Sale de
 * medir un sector de sierra de verdad contra el archivo del mundo: 84 pedazos
 * pesaron 1027 KB, unos 12 KB cada uno. Una zona con ciudad adentro pesa más,
 * porque hay más dibujado.
 */
export const PESO_APROXIMADO_DE_UN_PEDAZO = 12 * 1024;

export function pesoAproximadoDelMapa(
  rectangulo: Sector["rectangulo"],
  acercamientoMaximo: number = ACERCAMIENTO_MAXIMO,
): number {
  return cuantasTeselas(rectangulo, acercamientoMaximo) * PESO_APROXIMADO_DE_UN_PEDAZO;
}

/**
 * El peso escrito como lo lee una persona.
 *
 * Nunca en bytes sueltos: «1.048.576» no le dice nada a nadie.
 */
export function mostrarPeso(bytes: number): string {
  if (bytes < 1024) return `${Math.max(bytes, 0)} B`;

  const enKb = bytes / 1024;
  if (enKb < 1000) return `${Math.round(enKb)} KB`;

  const enMb = enKb / 1024;
  return `${enMb.toFixed(1).replace(".", ",")} MB`;
}
