import { ESTANTES, escribirEnElDeposito, leerDelDeposito } from "@/lib/offline/deposito";

/**
 * Las imágenes de Google que quedaron en el celular de mirar Consultas con
 * señal (decisión 080; Ale, 2026-10-31).
 *
 * **Se guardan solo el tiempo que Google indica en cada imagen**, ni un
 * segundo más. Mientras valen, la navegación las dibuja **encima del mapa
 * bajado**, como una mejora: donde no hay, o ya vencieron, se ve el mapa de
 * siempre. Nunca reemplazan al mapa bajado ni se avisa nada: se goza de más o
 * menos detalle según lo que haya.
 *
 * Es un riesgo asumido por Ale frente a las reglas de Google (decisión 080).
 * Si Google lo objeta, se apaga sacando esto.
 */

/** La cabecera con la que el servidor de la app pasa lo que Google dijo. */
export const CABECERA_DE_GUARDADO_DE_GOOGLE = "x-guardado-de-google";

type ImagenGuardada = { bytes: Uint8Array; venceEn: number };

/**
 * Hasta cuándo deja Google guardar una imagen, según su respuesta.
 *
 * Sin permiso explícito no se guarda: si dice que no se guarde, o no dice por
 * cuánto, la respuesta es nada.
 */
export function venceSegunGoogle(cabecera: string | null, ahora: number): number | null {
  if (!cabecera) return null;
  const partes = cabecera.toLowerCase().split(",").map((parte) => parte.trim());
  if (partes.includes("no-store")) return null;
  const maxAge = partes.find((parte) => parte.startsWith("max-age="));
  const segundos = maxAge ? Number(maxAge.slice("max-age=".length)) : NaN;
  if (!Number.isFinite(segundos) || segundos <= 0) return null;
  return ahora + segundos * 1000;
}

function clave(z: number, x: number, y: number): string {
  return `${z}/${x}/${y}`;
}

export async function guardarImagenDeGoogle(
  z: number,
  x: number,
  y: number,
  bytes: Uint8Array,
  venceEn: number,
): Promise<void> {
  const guardada: ImagenGuardada = { bytes, venceEn };
  await escribirEnElDeposito(ESTANTES.imagenesDeGoogle, [(donde) => donde.put(guardada, clave(z, x, y))]);
}

/**
 * La imagen guardada, si todavía vale. **Nunca sale a internet.** Una vencida
 * se borra al encontrarla.
 */
export async function leerImagenDeGoogle(z: number, x: number, y: number, ahora = Date.now()): Promise<Uint8Array | null> {
  try {
    const guardada = await leerDelDeposito<ImagenGuardada | undefined>(
      ESTANTES.imagenesDeGoogle,
      (donde) => donde.get(clave(z, x, y)),
    );
    if (!guardada) return null;
    if (guardada.venceEn <= ahora) {
      void escribirEnElDeposito(ESTANTES.imagenesDeGoogle, [(donde) => donde.delete(clave(z, x, y))]).catch(() => {});
      return null;
    }
    return guardada.bytes;
  } catch {
    return null;
  }
}

/** Borra las vencidas. Se llama al abrir el mapa: lo vencido no ocupa lugar. */
export async function borrarImagenesVencidasDeGoogle(ahora = Date.now()): Promise<void> {
  const claves = await leerDelDeposito<IDBValidKey[]>(ESTANTES.imagenesDeGoogle, (donde) => donde.getAllKeys());
  const valores = await leerDelDeposito<ImagenGuardada[]>(ESTANTES.imagenesDeGoogle, (donde) => donde.getAll());
  const vencidas = claves.filter((_, i) => !valores[i] || valores[i].venceEn <= ahora);
  if (vencidas.length === 0) return;
  await escribirEnElDeposito(
    ESTANTES.imagenesDeGoogle,
    vencidas.map((cual) => (donde: IDBObjectStore) => donde.delete(cual)),
  );
}

/** Para cuando se cierra sesión o se borran los mapas. */
export async function borrarTodasLasImagenesDeGoogle(): Promise<void> {
  await escribirEnElDeposito(ESTANTES.imagenesDeGoogle, [(donde) => donde.clear()]);
}

/** Los tres números de grilla de una dirección `algo://z/x/y`, con o sin cola. */
export function grillaDeGoogle(direccion: string): { z: number; x: number; y: number } | null {
  const separador = direccion.indexOf("://");
  if (separador === -1) return null;
  const partes = direccion.slice(separador + 3).split("?")[0].split("/");
  if (partes.length !== 3 || !partes.every((parte) => /^\d+$/.test(parte))) return null;
  const [z, x, y] = partes.map(Number);
  return { z, x, y };
}

/**
 * Trae una imagen de Google con señal, para Consultas, y la deja guardada el
 * tiempo que Google permite. Si guardarla falla, la imagen se muestra igual:
 * guardar es un extra.
 */
export async function traerImagenDeGoogle(direccion: string, senal?: AbortSignal): Promise<ArrayBuffer> {
  const grilla = grillaDeGoogle(direccion);
  const sesion = new URLSearchParams(direccion.split("?")[1] ?? "").get("sesion");
  if (!grilla || !sesion) throw new Error("la dirección de la imagen de Google no es válida");

  const { z, x, y } = grilla;
  const respuesta = await fetch(`/api/mapa-google/tesela/${z}/${x}/${y}?sesion=${encodeURIComponent(sesion)}`, {
    cache: "no-store",
    signal: senal,
  });
  if (!respuesta.ok) {
    let motivo = `Google respondió ${respuesta.status}`;
    try {
      const cuerpo = (await respuesta.json()) as { error?: string };
      if (cuerpo?.error) motivo = cuerpo.error;
    } catch {
      // Sin mensaje: queda el número.
    }
    throw new Error(motivo);
  }

  const datos = await respuesta.arrayBuffer();
  const venceEn = venceSegunGoogle(respuesta.headers.get(CABECERA_DE_GUARDADO_DE_GOOGLE), Date.now());
  if (venceEn) void guardarImagenDeGoogle(z, x, y, new Uint8Array(datos.slice(0)), venceEn).catch(() => {});
  return datos;
}
