import type { LineString, Point } from "geojson";
import {
  ESTANTES,
  escribirEnElDeposito,
  leerDelDeposito,
} from "@/lib/offline/deposito";
import { FORMATO } from "@/lib/anotaciones/fotos";
import type { IconoPunto, TipoAnotacion } from "@/types/database";

/**
 * Lo que se marcó, cambió o borró sin señal y espera para subirse.
 *
 * **En el cerro no hay señal, y marcar una anotación no puede depender de
 * eso.** Todo lo que el usuario hace desde la navegación queda anotado acá, en
 * el celular, con sus fotos. Cuando vuelve la conexión —y la navegación está
 * cerrada, porque navegando no se sale a internet nunca— se sube solo.
 *
 * Vive en el depósito grande porque lleva fotos. Cada pendiente se guarda
 * entero, con su código: el mismo código viaja a la base y es el que evita
 * que una subida cortada y reintentada termine en dos anotaciones iguales.
 */

/** Lo que el usuario marcó: el mismo contenido que una anotación. */
export type DatosDeLaMarca = {
  tipo: TipoAnotacion;
  icono: IconoPunto | null;
  color: string | null;
  comentario: string | null;
  geometria: Point | LineString;
  /** Cuánto podía errar el GPS. `null` si se marcó a mano o es un trazo. */
  precisionGpsMetros: number | null;
};

type Comunes = {
  /** El código de este pendiente. En una creación, es el que va a la base. */
  codigo: string;
  /** Cuándo se hizo, en el cerro. Sube en ese orden. */
  hechoEn: string;
  /** Qué pasó la última vez que se intentó subir. `null` si no falló nada. */
  ultimoError: string | null;
};

export type FotosDeLaMarca = { grande: Blob; chica: Blob };

export type PendienteDeCrear = Comunes & {
  clase: "crear";
  /** Número de mentira para dibujarla y tocarla antes de que exista en la base. */
  idLocal: number;
  datos: DatosDeLaMarca;
  fotos: FotosDeLaMarca | null;
  /** El número que le dio la base, apenas se subieron los datos. */
  anotacionId: number | null;
  /** `true` cuando ya no queda nada por subir: ni datos ni foto. */
  terminada: boolean;
};

export type PendienteDeEditar = Comunes & {
  clase: "editar";
  anotacionId: number;
  datos: DatosDeLaMarca;
  /** Foto nueva, si se cambió. */
  fotos: FotosDeLaMarca | null;
  /** `true` si se sacó la foto que tenía. */
  quitarLaFoto: boolean;
  terminada: boolean;
};

export type PendienteDeBorrar = Comunes & {
  clase: "borrar";
  anotacionId: number;
  terminada: boolean;
};

export type Pendiente = PendienteDeCrear | PendienteDeEditar | PendienteDeBorrar;

/**
 * Dónde se guarda la foto chica de un pendiente para mostrarla en el cerro.
 *
 * Va en el mismo estante que las fotos bajadas, con una dirección que no puede
 * confundirse con una de internet. Así la ficha de la anotación la lee igual
 * que cualquier otra, sin saber si ya se subió o no.
 */
export function direccionDeLaFotoPendiente(codigo: string): string {
  return `pendiente:${codigo}`;
}

export function esFotoPendiente(direccion: string): boolean {
  return direccion.startsWith("pendiente:");
}

// ------------------------------------------------ lo que hay, como estado vivo

let enMemoria: Pendiente[] = [];
let leido = false;
let leyendo: Promise<void> | null = null;
const mirando = new Set<() => void>();

function avisar(): void {
  for (const cada of mirando) cada();
}

async function leerDelCelular(): Promise<Pendiente[]> {
  try {
    const todos = await leerDelDeposito<Pendiente[]>(
      ESTANTES.anotacionesPendientes,
      (donde) => donde.getAll() as IDBRequest<Pendiente[]>,
    );
    return [...todos].sort((a, b) => a.hechoEn.localeCompare(b.hechoEn));
  } catch {
    return [];
  }
}

/** Vuelve a leer del celular y avisa a las pantallas. */
export async function releerLosPendientes(): Promise<Pendiente[]> {
  enMemoria = await leerDelCelular();
  leido = true;
  avisar();
  return enMemoria;
}

export function mirarLosPendientes(cada: () => void): () => void {
  mirando.add(cada);
  if (!leido && !leyendo) {
    leyendo = releerLosPendientes()
      .then(() => undefined)
      .finally(() => {
        leyendo = null;
      });
  }
  return () => {
    mirando.delete(cada);
  };
}

/** Lo último leído. Siempre la misma lista mientras nada cambie. */
export function pendientesEnMemoria(): Pendiente[] {
  return enMemoria;
}

const NINGUNO: Pendiente[] = [];
export function pendientesDelServidor(): Pendiente[] {
  return NINGUNO;
}

// ------------------------------------------------ escribir

function nuevoCodigo(): string {
  return crypto.randomUUID();
}

async function guardar(pendiente: Pendiente): Promise<void> {
  await escribirEnElDeposito(ESTANTES.anotacionesPendientes, [
    (donde) => donde.put(pendiente, pendiente.codigo),
  ]);
}

async function guardarLaFotoChica(codigo: string, chica: Blob | null): Promise<void> {
  const direccion = direccionDeLaFotoPendiente(codigo);
  // Se guarda en bytes, igual que las fotos bajadas: una sola forma de leerlas.
  const bytes = chica ? new Uint8Array(await chica.arrayBuffer()) : null;
  await escribirEnElDeposito(ESTANTES.fotosDeAnotacion, [
    (donde) => (bytes ? donde.put(bytes, direccion) : donde.delete(direccion)),
  ]);
}

/**
 * Guarda los cambios de un pendiente, y su foto chica para verla en el cerro.
 *
 * **Termina recién cuando quedó grabado.** Si el celular no deja guardar, se
 * dice: marcar algo en el cerro y que se pierda sin aviso es lo peor que
 * puede pasar acá.
 */
export async function guardarPendiente(pendiente: Pendiente): Promise<void> {
  await guardar(pendiente);
  if (pendiente.clase !== "borrar" && pendiente.fotos) {
    await guardarLaFotoChica(pendiente.codigo, pendiente.fotos.chica);
  }
  await releerLosPendientes();
}

export async function sacarPendiente(codigo: string): Promise<void> {
  await escribirEnElDeposito(ESTANTES.anotacionesPendientes, [
    (donde) => donde.delete(codigo),
  ]);
  await guardarLaFotoChica(codigo, null);
  await releerLosPendientes();
}

/** Anota una marca nueva hecha en el cerro. */
export async function anotarUnaMarcaNueva(
  datos: DatosDeLaMarca,
  fotos: FotosDeLaMarca | null,
): Promise<PendienteDeCrear> {
  const pendiente: PendienteDeCrear = {
    clase: "crear",
    codigo: nuevoCodigo(),
    hechoEn: new Date().toISOString(),
    ultimoError: null,
    idLocal: -Date.now(),
    datos,
    fotos,
    anotacionId: null,
    terminada: false,
  };
  await guardarPendiente(pendiente);
  return pendiente;
}

/**
 * Cambiar una anotación desde el cerro.
 *
 * Si es una marca que todavía no subió, se cambia ahí mismo. Si ya existe en
 * la base, queda anotado el cambio; si ya había un cambio esperando, se pisa.
 */
export async function anotarUnCambio(
  cual: { anotacionId: number | null; codigoDeLaMarca: string | null },
  datos: DatosDeLaMarca,
  fotos: FotosDeLaMarca | null,
  quitarLaFoto: boolean,
): Promise<void> {
  const todos = await releerLosPendientes();

  const marca = cual.codigoDeLaMarca
    ? todos.find((cada): cada is PendienteDeCrear =>
        cada.clase === "crear" && cada.codigo === cual.codigoDeLaMarca,
      )
    : undefined;

  // Una marca que todavía no subió sus datos: se cambia ahí mismo.
  if (marca && marca.anotacionId === null) {
    await guardarPendiente({
      ...marca,
      datos,
      fotos: quitarLaFoto ? null : fotos ?? marca.fotos,
      ultimoError: null,
    });
    if (quitarLaFoto) await guardarLaFotoChica(marca.codigo, null);
    return;
  }

  const anotacionId = cual.anotacionId ?? marca?.anotacionId ?? null;
  if (anotacionId === null) return;

  const anterior = todos.find(
    (cada): cada is PendienteDeEditar =>
      cada.clase === "editar" && cada.anotacionId === anotacionId && !cada.terminada,
  );

  await guardarPendiente({
    clase: "editar",
    codigo: anterior?.codigo ?? nuevoCodigo(),
    hechoEn: anterior?.hechoEn ?? new Date().toISOString(),
    ultimoError: null,
    anotacionId,
    datos,
    fotos: quitarLaFoto ? null : fotos ?? anterior?.fotos ?? null,
    quitarLaFoto: quitarLaFoto || ((anterior?.quitarLaFoto ?? false) && !fotos),
    terminada: false,
  });
}

/**
 * Borrar una anotación desde el cerro.
 *
 * Una marca que nunca llegó a la base se tira y listo. Una que ya existe queda
 * anotada para borrarse al volver la señal, y deja de verse ya.
 */
export async function anotarUnBorrado(cual: {
  anotacionId: number | null;
  codigoDeLaMarca: string | null;
}): Promise<void> {
  const todos = await releerLosPendientes();

  const marca = cual.codigoDeLaMarca
    ? todos.find((cada) => cada.clase === "crear" && cada.codigo === cual.codigoDeLaMarca)
    : undefined;

  if (marca && marca.clase === "crear" && marca.anotacionId === null) {
    await sacarPendiente(marca.codigo);
    return;
  }

  const anotacionId =
    cual.anotacionId ?? (marca?.clase === "crear" ? marca.anotacionId : null);
  if (anotacionId === null) return;

  // Lo que estaba esperando para esa anotación ya no tiene sentido.
  for (const cada of todos) {
    if (cada.clase !== "borrar" && cada.anotacionId === anotacionId) {
      await escribirEnElDeposito(ESTANTES.anotacionesPendientes, [
        (donde) => donde.delete(cada.codigo),
      ]);
      await guardarLaFotoChica(cada.codigo, null);
    }
  }

  await guardarPendiente({
    clase: "borrar",
    codigo: nuevoCodigo(),
    hechoEn: new Date().toISOString(),
    ultimoError: null,
    anotacionId,
    terminada: false,
  });
}

/** Para cuando se cierra sesión: lo que no subió era de la cuenta que se va. */
export async function borrarTodosLosPendientes(): Promise<void> {
  const todos = await leerDelCelular();
  await escribirEnElDeposito(ESTANTES.anotacionesPendientes, [(donde) => donde.clear()]);
  await escribirEnElDeposito(
    ESTANTES.fotosDeAnotacion,
    todos.map((cada) => (donde: IDBObjectStore) =>
      donde.delete(direccionDeLaFotoPendiente(cada.codigo)),
    ),
  );
  await releerLosPendientes();
}

/** La foto chica de un pendiente, como archivo, para subirla. */
export function comoArchivo(blob: Blob, nombre: string): File {
  return new File([blob], nombre, { type: FORMATO });
}
