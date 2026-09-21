import {
  PANTALLAS_DE_ENTRADA,
  PANTALLAS_DE_ENTRADA_INTERNO,
  PANTALLAS_DEL_CERRO,
  PANTALLAS_DEL_CERRO_INTERNO,
} from "@/lib/offline/depositos";
import type { Paquete } from "@/lib/offline/paquete";

/**
 * Dejar listas todas las pantallas que van a hacer falta sin señal.
 *
 * **El usuario no tiene que ir a visitarlas una por una.** Sin esto, una zona
 * que nunca abriste con señal no existe en el cerro: el motor offline guarda
 * las pantallas a medida que se visitan, y nadie se acuerda de entrar a las
 * catorce zonas antes de salir. Es el mismo trabajo que hace Vías de Escalada
 * después de bajar su paquete.
 *
 * Se hace **con señal y en casa**, apenas el paquete queda al día.
 *
 * De cada pantalla se guardan dos cosas, no una: el documento —lo que llega al
 * abrir la app desde cero— y el pedido interno que hace la app al pasar de una
 * pantalla a otra por un link. Guardar una sola deja la app abriendo bien y
 * quedándose en blanco al tocar cualquier cosa, o al revés.
 */

/** Cuántas pantallas se piden a la vez. Más satura la conexión y no acelera. */
const A_LA_VEZ = 4;

const COMO_PIDE_UNA_PANTALLA =
  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";

export type PantallaParaCalentar = {
  direccion: string;
  /** Dónde guarda el motor offline el documento de esta pantalla. */
  deposito: string;
  /** Dónde guarda el pedido interno. */
  depositoInterno: string;
};

/** Las que no dependen de lo que el usuario tenga cargado. */
const LAS_DE_SIEMPRE = ["/", "/rutas", "/zonas"];

/**
 * Qué pantallas hay que dejar listas, sacadas del paquete recién guardado.
 *
 * **Solo las de consultar y navegar.** Las de crear y editar escriben en la
 * base: sin señal no sirven, así que guardarlas sería guardar un formulario que
 * al tocarlo falla.
 */
export function pantallasParaCalentar(paquete: Paquete): PantallaParaCalentar[] {
  const deEntrada = (direccion: string): PantallaParaCalentar => ({
    direccion,
    deposito: PANTALLAS_DE_ENTRADA,
    depositoInterno: PANTALLAS_DE_ENTRADA_INTERNO,
  });

  const delCerro = (direccion: string): PantallaParaCalentar => ({
    direccion,
    deposito: PANTALLAS_DEL_CERRO,
    depositoInterno: PANTALLAS_DEL_CERRO_INTERNO,
  });

  return [
    ...LAS_DE_SIEMPRE.map(deEntrada),
    ...paquete.zonas.map((zona) => deEntrada(`/zonas/${zona.id}`)),
    ...paquete.rutas.flatMap((ruta) => [
      delCerro(`/rutas/${ruta.id}`),
      delCerro(`/navegacion/${ruta.id}`),
    ]),
  ];
}

function hayDondeGuardar(): boolean {
  return typeof window !== "undefined" && typeof caches !== "undefined";
}

async function yaEsta(deposito: string, direccion: string): Promise<boolean> {
  try {
    const cajon = await caches.open(deposito);
    const guardada = await cajon.match(direccion, { ignoreSearch: true, ignoreVary: true });
    return guardada !== undefined;
  } catch {
    return false;
  }
}

/**
 * Trae una pantalla y la guarda.
 *
 * **Al pedido interno no se le pone la marca de «esto es una precarga».** Con
 * esa marca el servidor contesta un resumen mínimo en vez de la pantalla
 * entera, y lo que queda guardado no alcanza para dibujarla sin señal. Lo
 * aprendió Vías de Escalada midiendo: 220 bytes con la marca contra 13.166 sin
 * ella, y el error no se veía porque en las pantallas fijas da igual.
 */
async function traerYGuardar(
  direccion: string,
  deposito: string,
  comoPedidoInterno: boolean,
): Promise<boolean> {
  try {
    const respuesta = await fetch(direccion, {
      credentials: "same-origin",
      redirect: "follow",
      cache: "reload",
      headers: comoPedidoInterno
        ? { RSC: "1" }
        : { Accept: COMO_PIDE_UNA_PANTALLA },
    });

    if (!respuesta.ok) return false;

    const cajon = await caches.open(deposito);
    await cajon.put(direccion, respuesta.clone());
    return true;
  } catch {
    return false;
  }
}

export type ResultadoDelCalentado = {
  pedidas: number;
  listas: number;
};

export type PedidoDeCalentado = {
  paquete: Paquete;
  /** Para no repetir trabajo: las que ya están guardadas se saltean. */
  rehacer?: boolean;
  senal?: AbortSignal;
};

/**
 * Deja listas las pantallas del paquete.
 *
 * **Nunca tira.** Es un trabajo de fondo: si algo falla, la app sigue andando
 * igual y esa pantalla simplemente se va a guardar cuando el usuario la visite,
 * como antes.
 */
export async function calentarLasPantallas({
  paquete,
  rehacer = false,
  senal = new AbortController().signal,
}: PedidoDeCalentado): Promise<ResultadoDelCalentado> {
  if (!hayDondeGuardar()) return { pedidas: 0, listas: 0 };

  const pantallas = pantallasParaCalentar(paquete);
  let listas = 0;
  let siguiente = 0;

  async function trabajar(): Promise<void> {
    for (;;) {
      if (senal.aborted) return;

      const indice = siguiente;
      siguiente += 1;
      if (indice >= pantallas.length) return;

      const pantalla = pantallas[indice];

      const faltaba =
        rehacer ||
        !(await yaEsta(pantalla.deposito, pantalla.direccion)) ||
        !(await yaEsta(pantalla.depositoInterno, pantalla.direccion));

      if (!faltaba) {
        listas += 1;
        continue;
      }

      const documento = await traerYGuardar(
        pantalla.direccion,
        pantalla.deposito,
        false,
      );
      const interno = await traerYGuardar(
        pantalla.direccion,
        pantalla.depositoInterno,
        true,
      );

      if (documento && interno) listas += 1;
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(A_LA_VEZ, Math.max(pantallas.length, 1)) }, trabajar),
  );

  return { pedidas: pantallas.length, listas };
}
