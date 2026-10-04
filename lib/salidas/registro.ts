import { ESTANTES, escribirEnElDeposito, leerDelDeposito } from "@/lib/offline/deposito";
import type { PuntoRegistrado } from "@/lib/salidas/registro-reglas";

/**
 * Las salidas que se registran navegando, guardadas en el celular.
 *
 * **Salidas es con internet, salvo esto** (Ale, 2026-10-04): lo que se junta
 * en el cerro —por dónde fuiste— se guarda acá, sin señal, y sube solo como
 * borrador cuando hay señal y la navegación está cerrada. Es el mismo camino
 * que las anotaciones marcadas sin señal.
 *
 * **Cada punto queda grabado apenas se toma.** Si el celular se apaga o se
 * cierra la app, lo registrado no se pierde, y al volver a navegar se sigue.
 *
 * Hay a lo sumo una en curso. Las terminadas esperan acá hasta subir.
 */

export type Registro = {
  /** El código del celular. Viaja a la base y evita duplicados si una subida se corta. */
  codigo: string;
  /** La ruta que se navegaba al empezar, si había. */
  rutaId: number | null;
  nombreDeLaRuta: string | null;
  empezadoEn: number;
  /** `null` mientras está en curso. */
  terminadoEn: number | null;
  puntos: PuntoRegistrado[];
  /** El número que le dio la base, apenas se creó el borrador. */
  salidaId: number | null;
  /** Qué pasó la última vez que se intentó subir. */
  ultimoError: string | null;
};

// ------------------------------------------------ lo que hay, como estado vivo

let enMemoria: Registro[] = [];
let leido = false;
let leyendo: Promise<void> | null = null;
const mirando = new Set<() => void>();
/** Las escrituras van en fila: dos al mismo tiempo podrían pisarse un punto. */
let fila: Promise<unknown> = Promise.resolve();

function avisar(): void {
  for (const cada of mirando) cada();
}

async function leerDelCelular(): Promise<Registro[]> {
  try {
    const todos = await leerDelDeposito<Registro[]>(
      ESTANTES.registrosDeSalida,
      (donde) => donde.getAll() as IDBRequest<Registro[]>,
    );
    return [...todos].sort((a, b) => a.empezadoEn - b.empezadoEn);
  } catch {
    return [];
  }
}

export async function releerLosRegistros(): Promise<Registro[]> {
  enMemoria = await leerDelCelular();
  leido = true;
  avisar();
  return enMemoria;
}

export function mirarLosRegistros(cada: () => void): () => void {
  mirando.add(cada);
  if (!leido && !leyendo) {
    leyendo = releerLosRegistros()
      .then(() => undefined)
      .finally(() => {
        leyendo = null;
      });
  }
  return () => {
    mirando.delete(cada);
  };
}

export function registrosEnMemoria(): Registro[] {
  return enMemoria;
}

const NINGUNO: Registro[] = [];
export function registrosDelServidor(): Registro[] {
  return NINGUNO;
}

export function elEnCurso(registros: Registro[]): Registro | null {
  return registros.find((cada) => cada.terminadoEn === null) ?? null;
}

// ------------------------------------------------ escribir

/** Pone una escritura en la fila y la hace recién cuando termina la anterior. */
function enFila<T>(tarea: () => Promise<T>): Promise<T> {
  const esta = fila.then(tarea, tarea);
  fila = esta.catch(() => undefined);
  return esta;
}

/**
 * Guarda un registro entero.
 *
 * **Termina recién cuando quedó grabado.** Si el celular no deja guardar, se
 * dice: perder por dónde fuiste sin aviso es lo peor que puede pasar acá.
 */
async function grabar(registro: Registro): Promise<void> {
  await escribirEnElDeposito(ESTANTES.registrosDeSalida, [
    (donde) => donde.put(registro, registro.codigo),
  ]);
  enMemoria = [...enMemoria.filter((cada) => cada.codigo !== registro.codigo), registro].sort(
    (a, b) => a.empezadoEn - b.empezadoEn,
  );
  leido = true;
  avisar();
}

/** Empieza a registrar. Si ya había una en curso, se sigue con esa. */
export function empezarUnRegistro(rutaId: number | null, nombreDeLaRuta: string | null): Promise<Registro> {
  return enFila(async () => {
    const enCurso = elEnCurso(await releerLosRegistros());
    if (enCurso) return enCurso;
    const nuevo: Registro = {
      codigo: crypto.randomUUID(),
      rutaId,
      nombreDeLaRuta,
      empezadoEn: Date.now(),
      terminadoEn: null,
      puntos: [],
      salidaId: null,
      ultimoError: null,
    };
    await grabar(nuevo);
    return nuevo;
  });
}

/** Suma un punto a la que está en curso. Sin una en curso, no hace nada. */
export function sumarUnPunto(punto: PuntoRegistrado): Promise<void> {
  return enFila(async () => {
    const enCurso = elEnCurso(enMemoria.length ? enMemoria : await releerLosRegistros());
    if (!enCurso) return;
    await grabar({ ...enCurso, puntos: [...enCurso.puntos, punto] });
  });
}

/** Da por terminada la que está en curso: queda esperando para subirse. */
export function terminarElRegistro(): Promise<void> {
  return enFila(async () => {
    const enCurso = elEnCurso(await releerLosRegistros());
    if (!enCurso) return;
    await grabar({ ...enCurso, terminadoEn: Date.now() });
  });
}

/** Guarda lo que pasó al subir: el número de la base o el motivo de la falla. */
export function anotarComoSubio(
  codigo: string,
  cambios: Pick<Partial<Registro>, "salidaId" | "ultimoError">,
): Promise<void> {
  return enFila(async () => {
    const registro = (await releerLosRegistros()).find((cada) => cada.codigo === codigo);
    if (!registro) return;
    await grabar({ ...registro, ...cambios });
  });
}

/** Lo que ya subió entero se olvida. */
export function sacarElRegistro(codigo: string): Promise<void> {
  return enFila(async () => {
    await escribirEnElDeposito(ESTANTES.registrosDeSalida, [(donde) => donde.delete(codigo)]);
    await releerLosRegistros();
  });
}

/** Para cuando se cierra sesión: lo que no subió era de la cuenta que se va. */
export function borrarTodosLosRegistros(): Promise<void> {
  return enFila(async () => {
    await escribirEnElDeposito(ESTANTES.registrosDeSalida, [(donde) => donde.clear()]);
    await releerLosRegistros();
  });
}
