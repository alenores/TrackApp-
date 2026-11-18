import { ESTANTES, escribirEnElDeposito, leerDelDeposito } from "@/lib/offline/deposito";
import {
  CABECERA_DE_GUARDADO_DE_GOOGLE, CABECERA_DE_EDAD_DE_GOOGLE,
  CABECERA_DE_FECHA_DE_GOOGLE, CABECERA_DE_VENCIMIENTO_DE_GOOGLE, venceSegunGoogle,
} from "@/lib/mapas/google-vigencia";

export {
  CABECERA_DE_GUARDADO_DE_GOOGLE, CABECERA_DE_EDAD_DE_GOOGLE,
  CABECERA_DE_FECHA_DE_GOOGLE, CABECERA_DE_VENCIMIENTO_DE_GOOGLE, venceSegunGoogle,
} from "@/lib/mapas/google-vigencia";

/** La sesión no cambia esta variante; si cambia el mapa, cambia su identidad. */
const VARIANTE = "satellite/es-AR/AR/256/v1";
export const LIMITE_DE_BYTES_EN_MEMORIA_GOOGLE = 16 * 1024 * 1024;
export const LIMITE_DE_IMAGENES_EN_MEMORIA_GOOGLE = 256;
type ImagenGuardada = { bytes: Uint8Array; venceEn: number; variante?: string; permisoHttp?: 1 };
type ImagenObtenida = { bytes: Uint8Array; venceEn?: number };
export type RecursoDeGoogle = { data: ArrayBuffer; expires?: string };
type Pendiente = {
  control: AbortController;
  generacion: number;
  consumidores: Set<() => void>;
  resultado: Promise<ImagenObtenida>;
};

const memoria = new Map<string, ImagenGuardada>();
const pendientes = new Map<string, Pendiente>();
let bytesEnMemoria = 0;
let generacion = 0;
let consultasCerradas = false;
let escrituras: Promise<void> = Promise.resolve();

function ordenarEscritura(operacion: () => Promise<void>): Promise<void> {
  const turno = escrituras.then(operacion);
  escrituras = turno.catch(() => {});
  return turno;
}
function clave(z: number, x: number, y: number): string {
  // Compatible con las imágenes que ya usa la navegación sin conexión.
  return z + "/" + x + "/" + y;
}
function errorDeCancelacion(): DOMException {
  return new DOMException("La consulta del mapa se canceló.", "AbortError");
}
function comprobarVigenciaDelPedido(epoca: number, senal: AbortSignal): void {
  if (consultasCerradas || epoca !== generacion || senal.aborted) throw errorDeCancelacion();
}
function sacarDeMemoria(donde: string): void {
  const anterior = memoria.get(donde);
  if (!anterior) return;
  bytesEnMemoria -= anterior.bytes.byteLength;
  memoria.delete(donde);
}
function recordar(donde: string, imagen: ImagenGuardada): void {
  for (const [otra, guardada] of memoria) {
    if (guardada.venceEn <= Date.now()) sacarDeMemoria(otra);
  }
  sacarDeMemoria(donde);
  if (imagen.bytes.byteLength > LIMITE_DE_BYTES_EN_MEMORIA_GOOGLE || imagen.venceEn <= Date.now()) return;
  memoria.set(donde, imagen);
  bytesEnMemoria += imagen.bytes.byteLength;
  while (memoria.size > LIMITE_DE_IMAGENES_EN_MEMORIA_GOOGLE || bytesEnMemoria > LIMITE_DE_BYTES_EN_MEMORIA_GOOGLE) {
    sacarDeMemoria(memoria.keys().next().value!);
  }
}
function deMemoria(donde: string): ImagenGuardada | null {
  const imagen = memoria.get(donde);
  if (!imagen) return null;
  if (imagen.venceEn <= Date.now()) {
    sacarDeMemoria(donde);
    return null;
  }
  memoria.delete(donde);
  memoria.set(donde, imagen);
  return imagen;
}
function recursoPropio(imagen: ImagenObtenida): RecursoDeGoogle {
  // Un consumidor puede transferir/detachar sus bytes sin vaciar al resto.
  const data = new ArrayBuffer(imagen.bytes.byteLength);
  new Uint8Array(data).set(imagen.bytes);
  if (imagen.venceEn === undefined) return { data };
  if (imagen.venceEn <= Date.now()) throw new Error("La imagen de Google venció mientras se cargaba. Mové el mapa para reintentar.");
  return { data, expires: new Date(imagen.venceEn).toISOString() };
}

/** Invalida lo volátil antes de cualquier espera del cierre de sesión. */
export function invalidarCacheDeGoogle(): void {
  generacion++;
  memoria.clear();
  bytesEnMemoria = 0;
  for (const pendiente of pendientes.values()) {
    pendiente.control.abort();
    for (const cancelar of [...pendiente.consumidores]) cancelar();
  }
  pendientes.clear();
}
/** El login abre un documento nuevo; ninguna limpieza reabre este. */
export function bloquearConsultasDeGoogleAlSalir(): void {
  consultasCerradas = true;
  invalidarCacheDeGoogle();
}
function escribirImagen(donde: string, imagen: ImagenGuardada, epoca: number, senal?: AbortSignal): Promise<void> {
  return ordenarEscritura(async () => {
    if (consultasCerradas || epoca !== generacion || senal?.aborted) return;
    await escribirEnElDeposito(ESTANTES.imagenesDeGoogle, [(estante) => estante.put(imagen, donde)]);
  });
}
/** Compatibilidad offline: no inventa permiso HTTP para reutilizar online. */
export async function guardarImagenDeGoogle(z: number, x: number, y: number, bytes: Uint8Array, venceEn: number): Promise<void> {
  await escribirImagen(clave(z, x, y), { bytes, venceEn }, generacion);
}
async function leerGuardada(donde: string): Promise<ImagenGuardada | undefined> {
  return leerDelDeposito<ImagenGuardada | undefined>(ESTANTES.imagenesDeGoogle, (estante) => estante.get(donde));
}
function esImagenGuardada(valor: ImagenGuardada | undefined): valor is ImagenGuardada {
  return !!valor && ArrayBuffer.isView(valor.bytes) && Object.prototype.toString.call(valor.bytes) === "[object Uint8Array]"
    && Number.isFinite(valor.venceEn)
    && valor.venceEn <= 8_640_000_000_000_000;
}
async function leerGuardadaConTope(donde: string): Promise<ImagenGuardada | undefined> {
  let corte: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      leerGuardada(donde),
      new Promise<undefined>((resolver) => { corte = setTimeout(() => resolver(undefined), 500); }),
    ]);
  } finally {
    if (corte !== undefined) clearTimeout(corte);
  }
}
function borrarSiVencida(donde: string, ahora: number): void {
  const epoca = generacion;
  void ordenarEscritura(async () => {
    if (epoca !== generacion) return;
    const actual = await leerDelDeposito<ImagenGuardada | undefined>(ESTANTES.imagenesDeGoogle, (estante) => estante.get(donde));
    if (actual && actual.venceEn <= ahora) {
      await escribirEnElDeposito(ESTANTES.imagenesDeGoogle, [(estante) => estante.delete(donde)]);
    }
  }).catch(() => {});
}
/** Solo el celular. Las copias anteriores siguen disponibles sin conexión. */
export async function leerImagenDeGoogle(z: number, x: number, y: number, ahora = Date.now()): Promise<Uint8Array | null> {
  const epoca = generacion;
  const donde = clave(z, x, y);
  try {
    const guardada = await leerGuardada(donde);
    if (epoca !== generacion || !esImagenGuardada(guardada)) return null;
    if (guardada.venceEn <= ahora) {
      borrarSiVencida(donde, ahora);
      return null;
    }
    return guardada.bytes;
  } catch {
    return null;
  }
}
/** Solo vencidas: nunca recorta cobertura offline que todavía vale. */
export async function borrarImagenesVencidasDeGoogle(ahora = Date.now()): Promise<void> {
  await ordenarEscritura(async () => {
    const claves = await leerDelDeposito<IDBValidKey[]>(ESTANTES.imagenesDeGoogle, (estante) => estante.getAllKeys());
    const valores = await leerDelDeposito<ImagenGuardada[]>(ESTANTES.imagenesDeGoogle, (estante) => estante.getAll());
    const vencidas = claves.filter((_, i) => !valores[i] || valores[i].venceEn <= ahora);
    await escribirEnElDeposito(ESTANTES.imagenesDeGoogle, vencidas.map((cual) => (estante) => estante.delete(cual)));
  });
}
/** Clear ordenado después de las escrituras que ya habían empezado. */
export async function borrarTodasLasImagenesDeGoogle(): Promise<void> {
  invalidarCacheDeGoogle();
  await ordenarEscritura(() => escribirEnElDeposito(ESTANTES.imagenesDeGoogle, [(estante) => estante.clear()]));
}
export function grillaDeGoogle(direccion: string): { z: number; x: number; y: number } | null {
  const separador = direccion.indexOf("://");
  if (separador === -1) return null;
  const partes = direccion.slice(separador + 3).split("?")[0].split("/");
  if (partes.length !== 3 || !partes.every((parte) => /^\d+$/.test(parte))) return null;
  const [z, x, y] = partes.map(Number);
  return { z, x, y };
}
async function obtenerImagen(
  donde: string, z: number, x: number, y: number, sesion: string, epoca: number, senal: AbortSignal,
): Promise<ImagenObtenida> {
  comprobarVigenciaDelPedido(epoca, senal);
  const recordada = deMemoria(donde);
  if (recordada) return recordada;
  try {
    const guardada = await leerGuardadaConTope(donde);
    comprobarVigenciaDelPedido(epoca, senal);
    if (esImagenGuardada(guardada) && guardada.variante === VARIANTE && guardada.permisoHttp === 1 && guardada.venceEn > Date.now()) {
      recordar(donde, guardada);
      return guardada;
    }
  } catch {
    comprobarVigenciaDelPedido(epoca, senal);
    // Un depósito averiado no impide consultar con señal.
  }
  comprobarVigenciaDelPedido(epoca, senal);
  const solicitadoEn = Date.now();
  const respuesta = await fetch("/api/mapa-google/tesela/" + z + "/" + x + "/" + y + "?sesion=" + encodeURIComponent(sesion), {
    cache: "no-store", signal: senal,
  });
  if (!respuesta.ok) {
    let motivo = "Google respondió " + respuesta.status;
    try {
      const cuerpo = await respuesta.json() as { error?: string };
      if (cuerpo?.error) motivo = cuerpo.error;
    } catch { /* Sin cuerpo legible: queda el estado HTTP. */ }
    throw new Error(motivo);
  }
  const datos = await respuesta.arrayBuffer();
  comprobarVigenciaDelPedido(epoca, senal);
  const venceEn = venceSegunGoogle(respuesta.headers.get(CABECERA_DE_GUARDADO_DE_GOOGLE), Date.now(), {
    edad: respuesta.headers.get(CABECERA_DE_EDAD_DE_GOOGLE),
    fecha: respuesta.headers.get(CABECERA_DE_FECHA_DE_GOOGLE),
    vencimiento: respuesta.headers.get(CABECERA_DE_VENCIMIENTO_DE_GOOGLE),
    solicitadoEn,
  });
  const bytes = new Uint8Array(datos);
  if (venceEn !== null) {
    const imagen: ImagenGuardada = { bytes, venceEn, variante: VARIANTE, permisoHttp: 1 };
    recordar(donde, imagen);
    void escribirImagen(donde, imagen, epoca, senal).catch(() => {});
    comprobarVigenciaDelPedido(epoca, senal);
    return imagen;
  }
  return { bytes };
}
function compartir(pendiente: Pendiente, donde: string, senal?: AbortSignal): Promise<RecursoDeGoogle> {
  return new Promise((resolver, rechazar) => {
    let terminado = false;
    const terminar = () => {
      terminado = true;
      pendiente.consumidores.delete(cancelar);
      senal?.removeEventListener("abort", cancelar);
    };
    const cancelar = () => {
      if (terminado) return;
      terminar();
      rechazar(errorDeCancelacion());
      if (pendiente.consumidores.size === 0) {
        pendiente.control.abort();
        if (pendientes.get(donde) === pendiente) pendientes.delete(donde);
      }
    };
    pendiente.consumidores.add(cancelar);
    senal?.addEventListener("abort", cancelar, { once: true });
    if (senal?.aborted) cancelar();
    pendiente.resultado.then((imagen) => {
      if (terminado) return;
      if (pendiente.generacion !== generacion || pendiente.control.signal.aborted) { cancelar(); return; }
      try {
        const recurso = recursoPropio(imagen);
        terminar();
        resolver(recurso);
      } catch (error) {
        terminar();
        rechazar(error);
      }
    }, (error) => {
      if (terminado) return;
      terminar();
      rechazar(error);
    });
  });
}
/** Servicio común de todas las pantallas, independiente del lienzo. */
export function traerRecursoDeGoogle(direccion: string, senal?: AbortSignal): Promise<RecursoDeGoogle> {
  if (consultasCerradas || senal?.aborted) return Promise.reject(errorDeCancelacion());
  const grilla = grillaDeGoogle(direccion);
  const sesion = new URLSearchParams(direccion.split("?")[1] ?? "").get("sesion");
  if (!grilla || !sesion) return Promise.reject(new Error("la dirección de la imagen de Google no es válida"));
  const { z, x, y } = grilla;
  const donde = clave(z, x, y);
  let pendiente = pendientes.get(donde);
  if (!pendiente) {
    const control = new AbortController();
    const epoca = generacion;
    pendiente = {
      control, generacion: epoca, consumidores: new Set(),
      resultado: Promise.resolve().then(() => obtenerImagen(donde, z, x, y, sesion, epoca, control.signal)),
    };
    pendientes.set(donde, pendiente);
    const actual = pendiente;
    const retirar = () => { if (pendientes.get(donde) === actual) pendientes.delete(donde); };
    pendiente.resultado.then(retirar, retirar);
  }
  return compartir(pendiente, donde, senal);
}
/** Compatibilidad con consumidores que solo necesitan los bytes. */
export async function traerImagenDeGoogle(direccion: string, senal?: AbortSignal): Promise<ArrayBuffer> {
  return (await traerRecursoDeGoogle(direccion, senal)).data;
}
