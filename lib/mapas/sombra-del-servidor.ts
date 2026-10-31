import sharp from "sharp";
import { abrirPedazo } from "@/lib/alturas/relieve-del-servidor";
import { alturaEnElPedazo } from "@/lib/alturas/relieve";
import { ACERCAMIENTO_MAXIMO_DEL_RELIEVE } from "@/lib/mapas/archivo-del-relieve";
import {
  LADO_DE_LA_SOMBRA,
  MARGEN_DE_LA_SOMBRA,
  MARGEN_DEL_PEDIDO,
  SUAVIZADO_DE_LA_SOMBRA,
  aTerrarium,
  bordesEnMetros,
  completarConRespaldo,
  leerGrillaDeIdecor,
  llevarAlPedazo,
  recortar,
  suavizar,
  type GrillaDeAlturas,
} from "@/lib/mapas/sombra";

/**
 * Arma un pedazo de sombreado en el servidor de TrackApp (decisión 079).
 *
 * **Corre solo en el servidor y solo mientras se baja un sector**, en casa y
 * con señal. Una vez guardado en el celular, el sombreado se lee de ahí y por
 * acá no vuelve a pasar nadie: navegar sigue sin salir a internet.
 *
 * Junta dos fuentes de altura —IDECOR, fina, en Córdoba; el relieve de 30 m,
 * en todo el mundo— y entrega una sola imagen. Las cuentas están en
 * `sombra.ts`; acá solo se traen los datos.
 */

/**
 * El servicio de alturas de IDECOR, la infraestructura de datos de Córdoba.
 * Libre y gratuito. La capa es el modelo de 5 m de toda la provincia.
 */
const SERVICIO_DE_IDECOR = "https://idecor-ws.mapascordoba.gob.ar/geoserver/idecor/wcs";
const CAPA_DE_IDECOR = "idecor__dem_5m_cba_ext";
const PROYECCION_DEL_MAPA = "http://www.opengis.net/def/crs/EPSG/0/3857";

/** IDECOR tarda unos cuatro segundos por pedazo. Con esto alcanza y sobra. */
const PACIENCIA_EN_MILISEGUNDOS = 30_000;

/**
 * Cómo se le pide a IDECOR que achique o agrande su grilla: mezclando vecinos.
 *
 * Sin esto toma el punto más cercano, y al achicar repite o saltea una fila
 * cada tantas: el sombreado sale con una malla fina encima. Pasó el
 * 2026-10-31 en Los Gigantes.
 */
const MEZCLAR_VECINOS = "http://www.opengis.net/def/interpolation/OGC/1/linear";

export function direccionDeIdecor(z: number, x: number, y: number): string {
  const b = bordesEnMetros(z, x, y, MARGEN_DEL_PEDIDO);
  const parametros = [
    "service=WCS",
    "version=2.0.1",
    "request=GetCoverage",
    `coverageId=${CAPA_DE_IDECOR}`,
    `subsettingCRS=${PROYECCION_DEL_MAPA}`,
    `outputCRS=${PROYECCION_DEL_MAPA}`,
    `subset=X(${b.oeste},${b.este})`,
    `subset=Y(${b.sur},${b.norte})`,
    `scalesize=i(${b.puntos}),j(${b.puntos})`,
    `interpolation=${MEZCLAR_VECINOS}`,
    "format=text/plain",
  ];
  return `${SERVICIO_DE_IDECOR}?${parametros.join("&")}`;
}

/**
 * La altura fina de IDECOR para un pedazo, con su margen.
 *
 * Devuelve **nada** si el pedazo cae afuera de lo que IDECOR cubre: es lo
 * normal fuera de Córdoba, no una falla. Cualquier otra respuesta rara sí es
 * una falla, y se avisa con el motivo, porque bajar un sector sin avisar que le
 * falta algo es justo lo que la app no hace.
 */
async function alturaDeIdecor(z: number, x: number, y: number): Promise<GrillaDeAlturas | null> {
  let respuesta: Response;
  try {
    respuesta = await fetch(direccionDeIdecor(z, x, y), {
      signal: AbortSignal.timeout(PACIENCIA_EN_MILISEGUNDOS),
    });
  } catch (error) {
    throw new Error(
      error instanceof Error && error.name === "TimeoutError"
        ? "el servicio de alturas de Córdoba (IDECOR) tardó demasiado en contestar"
        : "el servicio de alturas de Córdoba (IDECOR) no contestó",
    );
  }

  const texto = await respuesta.text();

  // Afuera de lo que cubre: IDECOR lo dice así, con este texto.
  if (!respuesta.ok && texto.includes("Empty intersection")) return null;

  if (!respuesta.ok) {
    throw new Error(`el servicio de alturas de Córdoba (IDECOR) contestó ${respuesta.status}`);
  }

  // Lo que mandó, llevado a la grilla exacta del pedazo: IDECOR no devuelve
  // justo el cuadrado pedido.
  return llevarAlPedazo(leerGrillaDeIdecor(texto), z, x, y, MARGEN_DE_LA_SOMBRA);
}

/** Una grilla con todos los puntos sin dato, para cuando IDECOR no cubre el pedazo. */
function grillaVacia(): GrillaDeAlturas {
  const puntos = LADO_DE_LA_SOMBRA + 2 * MARGEN_DE_LA_SOMBRA;
  return { ancho: puntos, alto: puntos, alturas: new Float32Array(puntos * puntos).fill(NaN) };
}

/**
 * El respaldo: la altura de 30 m del punto, leída del pedazo del relieve que
 * lo contiene. Devuelve `NaN` en el mar abierto, donde no hay relieve.
 */
async function respaldoDelRelieve(z: number, x: number, y: number) {
  // El relieve de 30 m llega hasta este acercamiento: más cerca se usa el
  // pedazo grande que contiene al chico.
  const zDelRelieve = Math.min(z, ACERCAMIENTO_MAXIMO_DEL_RELIEVE);
  const escala = 2 ** (z - zDelRelieve);
  const xDelRelieve = Math.floor(x / escala);
  const yDelRelieve = Math.floor(y / escala);
  const pedazo = await abrirPedazo(zDelRelieve, xDelRelieve, yDelRelieve);

  return (columna: number, fila: number): number => {
    if (!pedazo) return NaN;
    // Dónde cae el centro del punto, en el pedazo grande, contando el margen.
    const enElPedazoChico = (indice: number) =>
      (indice - MARGEN_DE_LA_SOMBRA + 0.5) / LADO_DE_LA_SOMBRA;
    const px = ((x - xDelRelieve * escala + enElPedazoChico(columna)) / escala) * pedazo.ancho;
    const py = ((y - yDelRelieve * escala + enElPedazoChico(fila)) / escala) * pedazo.alto;
    return alturaEnElPedazo(pedazo, px, py);
  };
}

/**
 * El pedazo de sombreado listo para guardar, en WebP sin pérdida.
 *
 * Devuelve **nada** donde no hay altura de ninguna de las dos fuentes (mar
 * abierto): ahí no hay terreno que sombrear.
 */
export async function armarPedazoDeSombra(z: number, x: number, y: number): Promise<Uint8Array | null> {
  const [deIdecor, respaldo] = await Promise.all([
    alturaDeIdecor(z, x, y),
    respaldoDelRelieve(z, x, y),
  ]);

  const grilla = deIdecor ?? grillaVacia();
  const sinAltura = completarConRespaldo(grilla, respaldo);
  if (sinAltura === grilla.alturas.length) return null;

  const lista = recortar(suavizar(grilla, SUAVIZADO_DE_LA_SOMBRA), MARGEN_DE_LA_SOMBRA);

  const imagen = await sharp(Buffer.from(aTerrarium(lista)), {
    raw: { width: lista.ancho, height: lista.alto, channels: 3 },
  })
    .webp({ lossless: true })
    .toBuffer();

  return new Uint8Array(imagen);
}
