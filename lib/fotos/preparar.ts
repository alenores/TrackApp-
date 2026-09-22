/**
 * Dejar una foto lista para subir. **Es el único camino de toda la app.**
 *
 * Toda foto que entra —la de perfil hoy, las de una salida mañana— pasa por
 * acá: se achica al tamaño con que se va a ver de verdad, se convierte a WebP
 * y se comprime hasta entrar en el tope. Nada se sube sin pasar por acá.
 *
 * **Solo WebP, y nunca más de 2 MB.** No es una preferencia estética: cada
 * foto que se mira paga su peso en datos del celular, y en el cerro los datos
 * y la batería son el recurso escaso. La base lo exige además por su cuenta,
 * que es la defensa de verdad; esto es para que el usuario no se entere tarde.
 *
 * Tres cosas de acá no son obvias y se aprendieron a los golpes en Vías de
 * Escalada. Están explicadas donde corresponde, pero en resumen:
 *   1. La foto se lee **una sola vez**, al elegirla. La galería la presta, no
 *      la entrega.
 *   2. El tope de peso está **garantizado**, no intentado.
 *   3. Las fotos de iPhone (HEIC) necesitan un traductor que solo se baja en
 *      el teléfono que lo necesita.
 */

/** Lo único que la base acepta. */
export const FORMATO_DE_FOTO = "image/webp";

/**
 * El tope al que apunta el formulario.
 *
 * La base corta en 2 MB. Acá se apunta a la mitad **a propósito**: el margen
 * evita que una foto que pasó por poco quede rechazada del otro lado, donde el
 * usuario ya esperó la subida.
 */
export const TOPE_DEL_FORMULARIO_BYTES = 1024 * 1024;

/** Escalones de calidad. Se prueban en orden hasta que la foto entra en el tope. */
const CALIDADES = [0.82, 0.72, 0.62, 0.5] as const;

type Ajuste = {
  /** Lado largo en píxeles: el tamaño con que la foto se ve de verdad. Más es peso que nadie mira. */
  ladoLargo: number;
  topeBytes: number;
  calidades: readonly number[];
};

/**
 * Los ajustes de cada destino, escritos **una sola vez**.
 *
 * Para sumar un destino nuevo —las fotos de una salida, en la versión 2— se
 * agrega un renglón acá y su forma de recorte en `components/fotos/recorte-de-foto`.
 * Nada más: el resto del camino ya está hecho.
 */
export const AJUSTES_POR_DESTINO = {
  /** La foto de perfil se ve siempre chica y en un círculo. */
  avatar: { ladoLargo: 500, topeBytes: TOPE_DEL_FORMULARIO_BYTES, calidades: CALIDADES },
  /** La foto de portada ocupa todo el ancho, necesita resolución. */
  portada: { ladoLargo: 1600, topeBytes: TOPE_DEL_FORMULARIO_BYTES, calidades: CALIDADES },
  /**
   * La foto de una anotación se mira para decidir algo en el cerro: si el vado
   * se cruza, si el desvío existe. Necesita más detalle que un avatar, así que
   * va más grande — pero sigue entrando en el tope, porque cada una se baja con
   * el paquete y los datos en el cerro son el recurso escaso.
   */
  anotacion: { ladoLargo: 1600, topeBytes: TOPE_DEL_FORMULARIO_BYTES, calidades: CALIDADES },
} as const satisfies Record<string, Ajuste>;

export type DestinoDeFoto = keyof typeof AJUSTES_POR_DESTINO;

/** Un pedazo de la foto, en píxeles de la foto original. */
export type Recorte = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const NO_SE_PUDO_ABRIR =
  "No se pudo abrir esta foto. Puede ser un formato que este celular no abre, que pasa con fotos de iPhone mandadas como archivo. Pedí que te la manden como foto, o sacale una captura de pantalla y elegí la captura.";

// ------------------------------------------------------ abrir y cerrar

/**
 * La foto ya leída y abierta: **nuestra copia**, lista para recortar y preparar.
 */
export type FotoAbierta = {
  /** Los bytes tal como vinieron del celular. La única lectura. */
  bytes: Blob;
  /** Dirección de esos bytes, para mostrarla y recortarla. Se libera con `cerrarFoto`. */
  url: string;
  /** Ya decodificada, para dibujarla sin volver a leer nada. */
  imagen: HTMLImageElement;
  ancho: number;
  alto: number;
};

function cargarDesdeUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolver, rechazar) => {
    const imagen = new Image();
    imagen.onload = () => resolver(imagen);
    imagen.onerror = () => rechazar(new Error(NO_SE_PUDO_ABRIR));
    imagen.src = url;
  });
}

async function abrirBytes(bytes: Blob): Promise<FotoAbierta> {
  const url = URL.createObjectURL(bytes);
  try {
    const imagen = await cargarDesdeUrl(url);
    return {
      bytes,
      url,
      imagen,
      ancho: imagen.naturalWidth,
      alto: imagen.naturalHeight,
    };
  } catch (causa) {
    URL.revokeObjectURL(url);
    throw causa;
  }
}

/**
 * Lee la foto del celular **una sola vez** y la abre.
 *
 * La galería **presta** el archivo, no lo entrega: en Android el permiso para
 * leerlo es temporal, y en iPhone la copia se libera si la app pasa a segundo
 * plano. Si la foto se leyera al elegirla (para la vista previa) y otra vez al
 * subirla, la segunda lectura puede fallar aunque la primera haya salido bien,
 * y la persona ve «no se pudo leer» con la foto a la vista.
 *
 * Por eso se lee acá, una vez, y de ahí en más todo trabaja sobre la copia.
 */
export async function abrirFoto(
  archivo: File,
  /** Para contar qué está pasando cuando tarda: convertir un HEIC lleva segundos. */
  avisar?: (texto: string) => void,
): Promise<FotoAbierta> {
  if (archivo.type && !archivo.type.startsWith("image/")) {
    throw new Error("Ese archivo no es una foto. Elegí una imagen de la galería.");
  }

  let bytes: Blob;
  try {
    bytes = new Blob([await archivo.arrayBuffer()], { type: archivo.type });
  } catch (causa) {
    const motivo = causa instanceof Error ? causa.message : String(causa);
    throw new Error(
      `El celular no entregó la foto (${motivo}). Elegila de nuevo desde la galería.`,
    );
  }

  if (bytes.size === 0) {
    throw new Error(
      "El celular entregó una foto vacía. Elegila de nuevo desde la galería.",
    );
  }

  try {
    return await abrirBytes(bytes);
  } catch (causa) {
    // El celular no supo abrirla. Si es de iPhone la traducimos nosotros; si
    // no, el error original es el que sirve.
    if (!(await pareceHeic(bytes))) throw causa;
    avisar?.("Convirtiendo la foto de iPhone… puede tardar unos segundos.");
    return abrirBytes(await convertirHeic(bytes));
  }
}

/** Libera la dirección de una foto abierta. Se llama al dejar de mostrarla. */
export function cerrarFoto(foto: FotoAbierta | null | undefined): void {
  if (foto) URL.revokeObjectURL(foto.url);
}

// ------------------------------------------------------ fotos de iPhone

/**
 * Marcas del contenedor que usa el iPhone. AVIF también es de esta familia,
 * pero el navegador lo abre solo.
 */
const MARCAS_HEIC = new Set([
  "heic", "heix", "hevc", "hevx",
  "heim", "heis", "hevm", "hevs",
  "mif1", "msf1",
]);

/**
 * Mira los primeros bytes del archivo.
 *
 * **El nombre y el tipo declarado pueden mentir**; la cabecera no.
 */
export async function pareceHeic(bytes: Blob): Promise<boolean> {
  if (bytes.size < 12) return false;

  const cabecera = new Uint8Array(await bytes.slice(0, 12).arrayBuffer());
  const texto = (desde: number, hasta: number) =>
    String.fromCharCode(...cabecera.slice(desde, hasta));

  if (texto(4, 8) !== "ftyp") return false;
  return MARCAS_HEIC.has(texto(8, 12).toLowerCase());
}

async function convertirHeic(bytes: Blob): Promise<Blob> {
  try {
    // Se pide acá y no arriba, a propósito: así el traductor es un archivo
    // aparte de unos 3 MB que solo se baja en el celular que lo necesita, y
    // solo en el momento en que hace falta. Nunca va al paquete offline:
    // subir fotos es siempre con internet.
    const { heicTo } = await import("heic-to/next");
    const jpeg = await heicTo({ blob: bytes, type: "image/jpeg", quality: 0.95 });
    return new Blob([jpeg], { type: "image/jpeg" });
  } catch (causa) {
    const motivo = causa instanceof Error ? causa.message : String(causa);
    throw new Error(
      `Es una foto de iPhone y no se pudo convertir en este celular (${motivo}). Pedí que te la manden como foto, o sacale una captura de pantalla y elegí la captura.`,
    );
  }
}

// ------------------------------------------------------ dibujar y comprimir

/**
 * Cuánto hay que achicar para que el lado más largo entre en `ladoLargo`.
 *
 * Devuelve las medidas finales manteniendo la proporción. Si ya entra, no
 * agranda: una foto chica estirada se ve peor y pesa más.
 */
export function medidasQueEntran(
  ancho: number,
  alto: number,
  ladoLargo: number,
): { ancho: number; alto: number } {
  if (ancho <= ladoLargo && alto <= ladoLargo) {
    return { ancho: Math.max(1, Math.round(ancho)), alto: Math.max(1, Math.round(alto)) };
  }

  if (ancho > alto) {
    return {
      ancho: ladoLargo,
      alto: Math.max(1, Math.round((alto * ladoLargo) / ancho)),
    };
  }

  return {
    ancho: Math.max(1, Math.round((ancho * ladoLargo) / alto)),
    alto: ladoLargo,
  };
}

function dibujarWebp(
  imagen: HTMLImageElement,
  ladoLargo: number,
  calidad: number,
  recorte?: Recorte,
): Promise<Blob> {
  const origen =
    recorte ?? {
      x: 0,
      y: 0,
      width: imagen.naturalWidth,
      height: imagen.naturalHeight,
    };

  const medidas = medidasQueEntran(origen.width, origen.height, ladoLargo);

  const lienzo = document.createElement("canvas");
  lienzo.width = medidas.ancho;
  lienzo.height = medidas.alto;

  const pincel = lienzo.getContext("2d");
  if (!pincel) {
    return Promise.reject(
      new Error("Este celular no dejó preparar la imagen. Probá desde otro navegador."),
    );
  }

  pincel.drawImage(
    imagen,
    origen.x, origen.y, origen.width, origen.height,
    0, 0, lienzo.width, lienzo.height,
  );

  return new Promise((resolver, rechazar) => {
    lienzo.toBlob(
      (blob) => {
        if (blob) resolver(blob);
        else rechazar(new Error("No se pudo convertir la foto a WebP en este celular."));
      },
      FORMATO_DE_FOTO,
      calidad,
    );
  });
}

/**
 * Baja la calidad y, si con eso no alcanza, las medidas, **hasta que entra**.
 *
 * El tope está garantizado, no intentado: una foto que se sube «casi» dentro
 * del límite la rechaza la base, y para entonces el usuario ya esperó.
 */
async function comprimirHastaQueEntre(
  imagen: HTMLImageElement,
  { ladoLargo, topeBytes, calidades }: Ajuste,
  recorte?: Recorte,
): Promise<Blob> {
  let ultimo: Blob | null = null;

  for (const calidad of calidades) {
    const intento = await dibujarWebp(imagen, ladoLargo, calidad, recorte);
    ultimo = intento;
    if (intento.size <= topeBytes) return intento;
  }

  // Ni con la calidad más baja entró: son fotos enormes con mucho detalle.
  // Achicando las medidas, en tres vueltas entra cualquier foto de celular.
  let lado = ladoLargo;
  for (let vuelta = 0; vuelta < 3; vuelta += 1) {
    lado = Math.max(1, Math.round(lado * 0.7));
    const intento = await dibujarWebp(imagen, lado, 0.7, recorte);
    ultimo = intento;
    if (intento.size <= topeBytes) return intento;
  }

  if (!ultimo) throw new Error("No se pudo preparar la foto.");
  return ultimo;
}

/**
 * Convierte una foto abierta —entera o un recorte— en el archivo que se sube.
 *
 * No vuelve a tocar el celular: trabaja sobre la copia que ya está en memoria.
 */
export async function prepararFoto(
  foto: FotoAbierta,
  destino: DestinoDeFoto,
  recorte?: Recorte,
): Promise<File> {
  const blob = await comprimirHastaQueEntre(
    foto.imagen,
    AJUSTES_POR_DESTINO[destino],
    recorte,
  );

  return new File([blob], "foto.webp", {
    type: FORMATO_DE_FOTO,
    lastModified: Date.now(),
  });
}
