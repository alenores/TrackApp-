/**
 * ¿Hay señal **de verdad**? (2026-09-27)
 *
 * ## Por qué
 *
 * Hasta acá la app decidía con lo que dice el teléfono («¿estoy enganchado a
 * alguna red?»). En el cerro, con una rayita de cobertura, el teléfono dice que
 * sí aunque no pase nada por ahí: la app se creía con internet, mostraba los
 * botones que necesitan señal —que al tocarlos fallaban— y la puesta al día
 * quedaba esperando minutos. Con modo avión, en cambio, el teléfono dice que no
 * y el modo sin señal anda perfecto.
 *
 * Es lo mismo que se resolvió en Vías de Escalada el 2026-09-27.
 *
 * ## Qué hace
 *
 * Le pregunta a nuestro servidor si responde **a tiempo** (`/api/senal`). Si no
 * responde, la señal está **débil**, y para la app eso es exactamente lo mismo
 * que no tener señal: `hayConexion()` da `false` y se avisa con un evento.
 *
 * - **Mientras no se sabe, se responde que no hay** (AGENTS.md, «Sin señal no
 *   se muestra lo que no funciona»). Al abrir, la primera prueba contesta en
 *   décimas de segundo con señal normal.
 * - Para declarar la señal débil tiene que fallar **dos veces seguidas**; para
 *   volver alcanza con una respuesta a tiempo.
 * - Se prueba al arrancar, al volver a la app, cuando el teléfono avisa que
 *   volvió la red y cuando un pedido a la base tarda de más o falla. Con señal
 *   débil se vuelve a probar sola cada `REPRUEBA_MS`.
 *
 * ## Qué NO hace
 *
 * - No cambia el modo sin señal ni lo que se muestra en él.
 * - **No prueba nunca con la navegación abierta.** La prueba es un pedido a
 *   internet, y navegar no consulta internet por ningún motivo. Al salir de la
 *   navegación, volver a la app o recuperar la red dispara la prueba de nuevo.
 * - No frena una descarga que pidió el usuario (bajar un mapa): esos pedidos
 *   fallan solos si no hay señal.
 */

import { esLaPantallaDeNavegar } from "@/lib/actualizacion/version-nueva";

/** El nombre del aviso de cambio de señal. Lo escucha `useHaySenal`. */
export const EVENTO_CONEXION = "conexion-cambio";

/**
 * Cuánto se espera la respuesta de la prueba. Es una respuesta vacía: con señal
 * normal vuelve en décimas de segundo y con 3G flojo en uno o dos. Si pasan
 * cuatro, la señal no alcanza para nada de lo que necesita internet.
 */
const TIEMPO_PRUEBA_MS = 4000;

/** Con señal débil, cada cuánto se vuelve a probar para salir sola del modo sin señal. */
const REPRUEBA_MS = 20_000;

/**
 * Pausa mínima entre pruebas disparadas por pedidos lentos o por volver a la
 * app: muchos pedidos que fallan juntos no disparan una prueba cada uno.
 */
const PAUSA_ENTRE_PRUEBAS_MS = 10_000;

type Estado = "sin_probar" | "sirve" | "debil";

let estado: Estado = "sin_probar";
let pruebaEnCurso: Promise<boolean> | null = null;
let ultimaPrueba = 0;
let temporizadorReprueba: ReturnType<typeof setTimeout> | null = null;
let vigilando = false;

function tieneRed(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}

function navegando(): boolean {
  return typeof window !== "undefined" && esLaPantallaDeNavegar(window.location.pathname);
}

/**
 * ¿Se puede usar internet? Reemplaza a `navigator.onLine` en toda decisión de
 * «intento la red o uso lo guardado». Sin red, `false`; con red pero sin
 * respuesta a tiempo, `false`; mientras no se probó, también `false`.
 */
export function hayConexion(): boolean {
  return tieneRed() && estado === "sirve";
}

/** Hay red pero no responde: el gris del cerro. Para el cartel de la falla. */
export function haySenalDebil(): boolean {
  return tieneRed() && estado === "debil";
}

function avisarCambio(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENTO_CONEXION));
}

function cancelarReprueba(): void {
  if (temporizadorReprueba === null) return;
  clearTimeout(temporizadorReprueba);
  temporizadorReprueba = null;
}

function programarReprueba(): void {
  if (temporizadorReprueba !== null) return;
  temporizadorReprueba = setTimeout(() => {
    temporizadorReprueba = null;
    if (estado !== "debil" || !tieneRed()) return;
    void probarConexion(true).then(() => {
      if (estado === "debil") programarReprueba();
    });
  }, REPRUEBA_MS);
}

function fijarEstado(nuevo: Estado): void {
  if (nuevo === estado) return;
  estado = nuevo;
  if (nuevo === "debil") programarReprueba();
  else cancelarReprueba();
  avisarCambio();
}

async function preguntarAlServidor(): Promise<boolean> {
  const control = new AbortController();
  const corte = setTimeout(() => control.abort(), TIEMPO_PRUEBA_MS);
  try {
    const respuesta = await fetch(`/api/senal?t=${Date.now()}`, {
      cache: "no-store",
      signal: control.signal,
    });
    return respuesta.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(corte);
  }
}

/**
 * Prueba si el servidor responde a tiempo. Devuelve `true` si hay señal que
 * sirve.
 *
 * Sin red no prueba nada: eso ya lo sabe el teléfono. Con la navegación
 * abierta tampoco: devuelve lo último que se sabía.
 */
export function probarConexion(forzar = false): Promise<boolean> {
  if (!tieneRed()) {
    // Sin red la señal débil no significa nada: al volver la red se prueba de cero.
    if (estado !== "sin_probar") {
      estado = "sin_probar";
      cancelarReprueba();
    }
    return Promise.resolve(false);
  }
  if (navegando()) return Promise.resolve(hayConexion());
  if (pruebaEnCurso) return pruebaEnCurso;
  if (!forzar && estado !== "sin_probar" && Date.now() - ultimaPrueba < PAUSA_ENTRE_PRUEBAS_MS) {
    return Promise.resolve(hayConexion());
  }

  ultimaPrueba = Date.now();
  pruebaEnCurso = (async () => {
    /**
     * Dos fallas seguidas para declararla débil: con 3G flojo y una descarga
     * ocupando la línea, una sola respuesta lenta no alcanza para decidir.
     */
    let respondio = await preguntarAlServidor();
    if (!respondio && estado !== "debil" && tieneRed()) respondio = await preguntarAlServidor();
    // Si en el medio se fue la red del todo, manda el teléfono: no es «señal débil».
    if (!tieneRed()) {
      if (estado !== "sin_probar") {
        estado = "sin_probar";
        cancelarReprueba();
      }
      return false;
    }
    fijarEstado(respondio ? "sirve" : "debil");
    return respondio;
  })().finally(() => {
    pruebaEnCurso = null;
  });
  return pruebaEnCurso;
}

/**
 * Como `hayConexion()`, pero si todavía no se probó, espera la primera prueba
 * en vez de contestar «no hay». Para la puesta al día al abrir la app: sin
 * esto, con señal perfecta, siempre arrancaría como «sin señal».
 */
export function esperarConexion(): Promise<boolean> {
  if (!tieneRed()) return Promise.resolve(false);
  if (estado === "sin_probar" || pruebaEnCurso) return probarConexion(true);
  return Promise.resolve(hayConexion());
}

/**
 * Un pedido a la base tardó de más o falló por la red. Si la app se cree con
 * señal, vale la pena confirmarlo: puede ser el gris del cerro.
 */
export function avisarFallaDeRed(): void {
  if (!tieneRed() || estado === "debil") return;
  void probarConexion();
}

/**
 * Arranca la vigilancia. Una sola vez por página; llamarla de nuevo no hace
 * nada.
 */
export function iniciarVigilanciaDeConexion(): void {
  if (vigilando || typeof window === "undefined") return;
  vigilando = true;

  window.addEventListener("online", () => {
    void probarConexion(true);
  });
  window.addEventListener("offline", () => {
    if (estado !== "sin_probar") {
      estado = "sin_probar";
      cancelarReprueba();
    }
    avisarCambio();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void probarConexion();
  });

  void probarConexion(true);
}

/** Solo para las pruebas: vuelve a como si la app recién se abriera. */
export function olvidarLaConexionParaProbar(): void {
  estado = "sin_probar";
  pruebaEnCurso = null;
  ultimaPrueba = 0;
  cancelarReprueba();
}
