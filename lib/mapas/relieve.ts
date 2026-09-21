import mlcontour from "maplibre-contour";
import { addProtocol } from "maplibre-gl";
import { cualesEstanGuardadas, leerTesela } from "@/lib/mapas/deposito";
import { ACERCAMIENTO_DEL_RELIEVE, claveDeTesela } from "@/lib/mapas/teselas";

/**
 * Las curvas de nivel, calculadas en el celular a partir del relieve guardado.
 *
 * **Lo que baja no son las curvas: es el relieve.** Una imagen por pedazo donde
 * cada punto guarda su altura. Pesa poco, y las curvas las calcula el celular
 * en el momento de dibujar, con la misma pieza que usan los mapas de montaña
 * del mundo.
 *
 * **Este es el candado, igual que el del mapa.** El relieve se lee **siempre
 * del depósito del teléfono**, nunca de internet. No hay a dónde salir: a la
 * pieza que calcula las curvas se le enchufa una función propia que busca cada
 * pedazo en lo guardado.
 *
 * **Donde no hay relieve guardado no hay curvas, y eso no es una falla.** Antes
 * de pedirle a la pieza que calcule, se mira si el pedazo de relieve está en el
 * depósito; si no está, se contesta «sin curvas», que para el mapa es una
 * respuesta normal. Sin esto, la pieza intentaría abrir una imagen que no
 * existe, y el mapa mostraría un cartel de error por algo que es lo esperado
 * fuera de un sector bajado.
 *
 * Ver docs/decisiones/013-curvas-de-nivel-sobre-los-dos-mapas.md.
 */

/** Cómo viene escrita la altura en cada punto de la imagen. */
const CODIFICACION = "terrarium";

/** El lado de cada pedazo de relieve, en puntos. */
export const LADO_DEL_PEDAZO_DE_RELIEVE = 512;

/** El nombre con el que el mapa conoce al relieve y a las curvas. */
export const PROTOCOLO_DEL_RELIEVE = "relieve";

/**
 * Cada cuántos metros va una curva, según cuán de cerca se mira.
 *
 * De cada par, la primera es la curva fina y la segunda la gruesa, que lleva el
 * número. En sierra, cada 25 m alcanza para leer el relieve (decisión 013); de
 * más lejos se ralea, porque una sierra entera con curvas cada 25 m es una
 * maraña ilegible. Empiezan en el acercamiento en que está el relieve: de más
 * lejos no hay de dónde calcularlas, y tampoco se leerían.
 */
export const CURVAS_CADA: Record<number, [number, number]> = {
  [ACERCAMIENTO_DEL_RELIEVE]: [50, 250],
  [ACERCAMIENTO_DEL_RELIEVE + 1]: [25, 100],
};

export const CURVAS_DESDE = Math.min(...Object.keys(CURVAS_CADA).map(Number));

/** Qué se le pide a la pieza que calcula: dónde deja el nivel y la altura. */
export const CAPA_DE_CURVAS = "curvas";
export const CLAVE_DE_ALTURA = "altura";
export const CLAVE_DE_NIVEL = "nivel";

const SIN_CURVAS = new ArrayBuffer(0);

/** Los tres números de grilla de una dirección `algo://z/x/y`, con o sin cola. */
function grillaDeLaDireccion(direccion: string): { z: number; x: number; y: number } | null {
  const separador = direccion.indexOf("://");
  if (separador === -1) return null;
  const sinCola = direccion.slice(separador + 3).split("?")[0];
  const partes = sinCola.split("/");
  if (partes.length !== 3 || !partes.every((parte) => /^\d+$/.test(parte))) return null;
  const [z, x, y] = partes.map(Number);
  return { z, x, y };
}

/** El nombre de grilla que hay adentro de una dirección `relieve://12/1234/5678`. */
export function claveDeLaDireccionDelRelieve(direccion: string): string | null {
  const grilla = grillaDeLaDireccion(direccion);
  return grilla ? claveDeTesela({ ...grilla, capa: "relieve" }) : null;
}

/**
 * El pedazo de relieve del que salen las curvas de un pedazo del mapa.
 *
 * El relieve se baja en un solo acercamiento; mirando más de cerca, las curvas
 * de un pedazo chico salen del pedazo de relieve grande que lo contiene.
 */
export function pedazoDeRelieveQueCubre(direccion: string): string | null {
  const grilla = grillaDeLaDireccion(direccion);
  if (!grilla) return null;
  const diferencia = grilla.z - ACERCAMIENTO_DEL_RELIEVE;
  if (diferencia < 0) return null;
  return claveDeTesela({
    z: ACERCAMIENTO_DEL_RELIEVE,
    x: Math.floor(grilla.x / 2 ** diferencia),
    y: Math.floor(grilla.y / 2 ** diferencia),
    capa: "relieve",
  });
}

const SIN_RELIEVE = new Blob([], { type: "image/webp" });

/**
 * Busca un pedazo de relieve en el depósito.
 *
 * Si no está, devuelve vacío en vez de fallar. La pieza pide, para cada pedazo,
 * también sus ocho vecinos; en el borde de un sector bajado los vecinos de
 * afuera no están, y si eso fuera una falla el borde entero quedaría sin
 * curvas y con un cartel de error.
 */
async function pedazoGuardado(direccion: string): Promise<{ data: Blob }> {
  const clave = claveDeLaDireccionDelRelieve(direccion);
  const bytes = clave ? await leerTesela(clave) : null;
  if (!bytes || bytes.byteLength === 0) return { data: SIN_RELIEVE };
  return { data: new Blob([bytes.slice()], { type: "image/webp" }) };
}

/** Un pedazo de terreno del que no se sabe la altura: ahí no se dibuja curva. */
function terrenoSinDato() {
  const lado = LADO_DEL_PEDAZO_DE_RELIEVE;
  return { width: lado, height: lado, data: new Float32Array(lado * lado).fill(NaN) };
}

type FuenteDeRelieve = InstanceType<typeof mlcontour.DemSource>;

let fuente: FuenteDeRelieve | null = null;

/**
 * Enseña al mapa a leer el relieve guardado y a calcular las curvas.
 *
 * Se llama una sola vez.
 */
export function registrarElRelieveGuardado(): void {
  if (fuente) return;

  const direccion = `${PROTOCOLO_DEL_RELIEVE}://{z}/{x}/{y}`;
  fuente = new mlcontour.DemSource({
    url: direccion,
    id: PROTOCOLO_DEL_RELIEVE,
    encoding: CODIFICACION,
    maxzoom: ACERCAMIENTO_DEL_RELIEVE,
    // En el mismo hilo: la pieza que trabaja aparte iría a internet por su
    // cuenta, y acá los pedazos se buscan en el depósito del teléfono.
    worker: false,
  });

  // Acá se enchufa el candado: cada pedazo se busca en lo guardado.
  const deposito = new mlcontour.LocalDemManager({
    demUrlPattern: direccion,
    cacheSize: 100,
    encoding: CODIFICACION,
    maxzoom: ACERCAMIENTO_DEL_RELIEVE,
    timeoutMs: 10000,
    getTile: pedazoGuardado,
  });

  // Un pedazo vacío no es una imagen: se convierte en terreno sin dato antes
  // de que la pieza intente abrirlo.
  const abrirImagen = deposito.decodeImage;
  deposito.decodeImage = (imagen, codificacion, senal) =>
    imagen.size === 0 ? Promise.resolve(terrenoSinDato()) : abrirImagen(imagen, codificacion, senal);

  fuente.manager = deposito;

  // Las direcciones que registra la pieza pasan primero por acá: si el relieve
  // que hace falta no está guardado, se contesta «sin curvas» y no se calcula.
  fuente.setupMaplibre({
    addProtocol: (nombre, protocolo) => {
      addProtocol(nombre, async (pedido, senal) => {
        const relieve = pedazoDeRelieveQueCubre(pedido.url);
        if (!relieve) return { data: SIN_CURVAS };
        const guardados = await cualesEstanGuardadas([relieve]);
        if (!guardados.has(relieve)) return { data: SIN_CURVAS };
        return protocolo(pedido, senal);
      });
    },
  });
}

/** La dirección de las curvas ya calculadas, para dibujarlas como líneas. */
export function direccionDeLasCurvas(): string {
  if (!fuente) throw new Error("El relieve todavía no está registrado en el mapa.");
  return fuente.contourProtocolUrl({
    thresholds: CURVAS_CADA,
    elevationKey: CLAVE_DE_ALTURA,
    levelKey: CLAVE_DE_NIVEL,
    contourLayer: CAPA_DE_CURVAS,
    // Un margen alrededor de cada pedazo, para que las curvas no se corten en
    // los bordes y los números no queden partidos.
    buffer: 1,
  });
}
