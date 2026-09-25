import { calentarLasPantallas } from "@/lib/offline/calentar";
import { paqueteEnMemoria } from "@/lib/offline/paquete";
import { esLaPantallaDeNavegar } from "@/lib/actualizacion/version-nueva";
import { tirarLasPantallasDeOtraVersion } from "@/lib/offline/pantallas-de-otra-version";
import { pedirQueNoLoBorren } from "@/lib/offline/permanente";
import {
  sincronizarPaquete,
  type ResultadoDeSincronizacion,
} from "@/lib/offline/sincronizacion";
import { ponerAlDiaLoBajado } from "@/lib/mapas/poner-al-dia-lo-bajado";
import { ponerAlDiaLasFotosChicas } from "@/lib/anotaciones/descarga";

/**
 * Cuándo se pone al día el paquete: **una vez por apertura, y después de
 * guardar algo.** Nunca al pasar de una pantalla a otra.
 *
 * Antes cada pantalla, al abrirse, le preguntaba a la base si había novedades,
 * volvía a dejar listas todas las pantallas para el cerro y repasaba los mapas
 * bajados. Con veinte rutas eso eran decenas de pedidos por cada toque, peleando
 * con el pedido de la pantalla que el usuario quería ver. Los datos ya estaban
 * en el celular: todo ese trabajo no traía nada nuevo.
 *
 * - **Al abrir la app, con señal:** se pregunta una vez. Si salió bien, no se
 *   vuelve a preguntar hasta la próxima apertura.
 * - **Si no hubo señal o falló:** la próxima pantalla vuelve a intentar. Así,
 *   el que abrió la app en el pueblo sin señal y después la agarra, se pone al
 *   día solo.
 * - **Después de guardar algo** —una ruta, una zona, un sector, una
 *   anotación— se vuelve a preguntar enseguida, así lo que acabás de crear
 *   aparece sin cerrar la app.
 *
 * Sigue siendo automática y muda (decisión 012). Y nunca corre durante una
 * navegación: la pantalla de navegar no la llama.
 */

type Resultado = ResultadoDeSincronizacion;

/** El último resultado bueno de esta apertura. Mientras exista, no se pregunta. */
let hecha: Resultado | null = null;
/** La puesta al día que está corriendo, para que dos pantallas no pidan dos. */
let enCurso: Promise<Resultado> | null = null;

/**
 * Cuántas veces se guardó algo. Una puesta al día que arrancó antes del último
 * guardado no trae lo guardado: no puede dar la apertura por hecha.
 */
let guardados = 0;

const mirando = new Set<(resultado: Resultado) => void>();

/** Para que una pantalla ya abierta se entere de una puesta al día nueva. */
export function mirarLaPuestaAlDia(avisar: (resultado: Resultado) => void): () => void {
  mirando.add(avisar);
  return () => {
    mirando.delete(avisar);
  };
}

/** Lo que ya se sabe de esta apertura, sin preguntar a nadie. */
export function puestaAlDiaDeEstaApertura(): Resultado | null {
  return hecha;
}

function salioBien(resultado: Resultado): boolean {
  return resultado.clase === "al_dia" || resultado.clase === "actualizado";
}

/**
 * Lo que va por detrás cuando el paquete quedó al día. Nunca frena ni tira.
 */
function trabajosDeFondo(resultado: Resultado): void {
  const paquete = resultado.paquete;
  if (paquete) {
    // Primero se tiran las de otra versión, si las hay; después se guardan
    // las de esta. En ese orden, o el calentador las daría por hechas.
    void tirarLasPantallasDeOtraVersion()
      .then(() => calentarLasPantallas({ paquete }))
      .catch(() => {
        // Es trabajo de fondo: la pantalla se guarda igual cuando se visite.
      });
  }

  // La foto chica de cada anotación baja sola, sin que nadie la pida. La
  // lista viene completa: la puesta al día no guarda un paquete cortado.
  if (paquete) {
    void ponerAlDiaLasFotosChicas(paquete.anotaciones).catch(() => {
      // Se reintenta la próxima vez; el inicio avisa cuántas faltan.
    });
  }

  // La base queda al día con lo que de verdad hay bajado en el celular.
  void ponerAlDiaLoBajado().catch(() => {
    // Se reintenta la próxima vez que se abra con señal.
  });
}

async function correr(): Promise<Resultado> {
  const alArrancar = guardados;
  const resultado = await sincronizarPaquete();

  if (salioBien(resultado) && alArrancar === guardados) {
    hecha = resultado;
    trabajosDeFondo(resultado);
  }

  for (const avisar of mirando) avisar(resultado);
  return resultado;
}

function estaAbiertaLaNavegacion(): boolean {
  return typeof window !== "undefined" && esLaPantallaDeNavegar(window.location.pathname);
}

/**
 * Pone el paquete al día si en esta apertura todavía no se hizo.
 *
 * La llaman todas las pantallas al abrirse, pero solo la primera sale a la
 * base: las demás reciben lo que ya se sabe.
 */
export function ponerAlDiaUnaVezPorApertura(): Promise<Resultado> {
  // Que el navegador no borre lo guardado cuando el teléfono se llene. Pedirlo
  // de nuevo no cuesta nada y no espera a nadie.
  void pedirQueNoLoBorren();

  // Navegando no se sale a internet. Nunca, ni con señal: ver «La navegación
  // es 100% sin conexión» en AGENTS.md. Pasaba al reabrir la app parado en la
  // navegación. No se anota como hecha: la primera pantalla que se abra al
  // salir de la navegación es la que se pone al día.
  if (estaAbiertaLaNavegacion()) {
    return Promise.resolve({ clase: "sin_senal", paquete: paqueteEnMemoria() });
  }

  if (hecha) return Promise.resolve(hecha);
  if (enCurso) return enCurso;

  const nueva: Promise<Resultado> = correr().finally(() => {
    if (enCurso === nueva) enCurso = null;
  });

  enCurso = nueva;
  return nueva;
}

/**
 * Pone el paquete al día **ya**, porque recién se guardó algo en la base.
 *
 * Si justo había una puesta al día corriendo, arrancó antes de guardar y no lo
 * trae: se espera a que termine y se hace otra.
 */
export function ponerAlDiaDespuesDeGuardar(): Promise<Resultado> {
  hecha = null;
  guardados += 1;

  const anterior = enCurso ?? Promise.resolve(null);
  const nueva: Promise<Resultado> = anterior
    .catch(() => null)
    .then(() => correr())
    .finally(() => {
      // Si mientras tanto arrancó otra, esa es la que manda.
      if (enCurso === nueva) enCurso = null;
    });

  enCurso = nueva;
  return nueva;
}

/** Solo para las pruebas: vuelve a como si la app recién se abriera. */
export function olvidarLaPuestaAlDiaParaProbar(): void {
  hecha = null;
  enCurso = null;
  guardados = 0;
  mirando.clear();
}
