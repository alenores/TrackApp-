/**
 * Las cuentas del sombreado del terreno (decisión 079).
 *
 * El sombreado es el terreno dibujado como una maqueta: cada ladera oscura o
 * clara según de dónde le pega la luz. No es una foto; sale de la altura del
 * terreno. Se usa para que, sin una foto satelital nítida, igual se lean
 * filos, quebradas y arroyos.
 *
 * **De dónde sale la altura:**
 *
 * - **En Córdoba, del dato de 5 m de IDECOR**, que es libre. Ese dato tiene
 *   rayas y escalones de origen (zonas de distinta calidad y alturas en metros
 *   enteros), así que **se suaviza apenas**. Más suavizado borra las rayas y
 *   también la mejora: quedó medido en la decisión 079.
 * - **Donde IDECOR no tiene dato, del relieve de 30 m** que ya usan las curvas.
 *   Se mezclan punto por punto: un pedazo puede tener una parte de cada uno.
 *
 * Lo que sale es una imagen de 512 × 512 puntos con la altura en la misma
 * codificación que el relieve de las curvas («terrarium»), que es la que el
 * mapa sabe sombrear.
 *
 * Todo lo de acá es cuenta pura: no sale a internet ni abre imágenes, y se
 * prueba sola. Lo que trae los datos vive en `sombra-del-servidor.ts`.
 */

/**
 * La cabecera con la que el servidor avisa que un pedazo salió con menos
 * detalle, con el motivo adentro. La escribe `app/api/sombra` y la lee
 * `lib/mapas/fuente-del-servidor.ts`.
 */
export const CABECERA_DE_MENOS_DETALLE = "x-sombra-con-menos-detalle";

/** El lado de cada pedazo de sombreado, en puntos. */
export const LADO_DE_LA_SOMBRA = 512;

/**
 * Cuántos puntos de más se piden alrededor de cada pedazo.
 *
 * El suavizado mira a los vecinos de cada punto. En el borde del pedazo no
 * tiene vecinos y el resultado quedaría distinto del pedazo de al lado: se
 * notaría una costura. Con este margen, cada borde se suaviza con datos
 * verdaderos y después el margen se recorta.
 */
export const MARGEN_DE_LA_SOMBRA = 4;

/** Cuánto se suaviza, en puntos. Medido a ojo sobre Los Gigantes (decisión 079). */
export const SUAVIZADO_DE_LA_SOMBRA = 1;

/**
 * De a cuánto se redondea la altura al guardarla, en metros.
 *
 * Guardar todos los decimales que deja el suavizado multiplica el peso por
 * diez, porque la imagen ya no se puede comprimir. Redondear al metro entero
 * vuelve a dibujar escalones en lo plano. Este punto medio se midió sobre
 * Los Gigantes (decisión 079).
 */
export const PASO_DE_ALTURA = 0.5;

/** Lo que IDECOR escribe donde no tiene dato. */
const SIN_DATO_DE_IDECOR = 32767;

/** Una grilla de alturas en metros, en fila desde arriba a la izquierda. `NaN` es sin dato. */
export type GrillaDeAlturas = { ancho: number; alto: number; alturas: Float32Array };

const MITAD_DEL_MUNDO = 20037508.342789244;

/**
 * Los bordes de un pedazo en metros de la proyección del mapa (EPSG:3857),
 * con un margen opcional en puntos alrededor.
 */
export function bordesEnMetros(
  z: number,
  x: number,
  y: number,
  margenEnPuntos = 0,
): { oeste: number; sur: number; este: number; norte: number; puntos: number } {
  const lado = (2 * MITAD_DEL_MUNDO) / 2 ** z;
  const margen = (margenEnPuntos * lado) / LADO_DE_LA_SOMBRA;
  return {
    oeste: x * lado - MITAD_DEL_MUNDO - margen,
    este: (x + 1) * lado - MITAD_DEL_MUNDO + margen,
    norte: MITAD_DEL_MUNDO - y * lado + margen,
    sur: MITAD_DEL_MUNDO - (y + 1) * lado - margen,
    puntos: LADO_DE_LA_SOMBRA + 2 * margenEnPuntos,
  };
}

/**
 * Cuántos puntos de más se le piden a IDECOR alrededor de cada pedazo.
 *
 * IDECOR no devuelve exactamente el cuadrado pedido: lo agranda un poco y
 * deja sin dato una franja en los bordes. Con este margen esa franja queda
 * afuera del pedazo. Pasó el 2026-10-31: sin margen, cada unión entre
 * pedazos se veía como una línea recta.
 */
export const MARGEN_DEL_PEDIDO = 16;

/** Los bordes de lo que IDECOR devolvió de verdad, en metros del mapa. */
export type BordesEnMetros = { oeste: number; sur: number; este: number; norte: number };

/**
 * Lee la grilla que devuelve IDECOR en texto.
 *
 * Arriba vienen unas líneas de descripción —entre ellas, **los bordes reales
 * de lo que devolvió**— y después una fila de números por cada fila de puntos,
 * de norte a sur. Se exige que las filas sean todas del mismo ancho y que
 * vengan los bordes: una grilla torcida o sin ubicar dibujaría el sombreado
 * corrido, y eso no se nota hasta el cerro.
 */
export function leerGrillaDeIdecor(texto: string): { grilla: GrillaDeAlturas; bordes: BordesEnMetros } {
  const numero = String.raw`(-?\d+(?:\.\d+)?(?:E-?\d+)?)`;
  const encontrados = texto.match(
    new RegExp(String.raw`Grid bounds:\s*\w+\[\(${numero},\s*${numero}\),\s*\(${numero},\s*${numero}\)\]`),
  );
  if (!encontrados) {
    throw new Error("IDECOR no dijo dónde queda la grilla que mandó.");
  }
  const [oeste, sur, este, norte] = encontrados.slice(1, 5).map(Number);

  const filas: number[][] = [];
  for (const linea of texto.split("\n")) {
    const limpia = linea.trim();
    if (!limpia || !/^-?\d/.test(limpia) || !/^[-\d.\s]+$/.test(limpia)) continue;
    const valores = limpia.split(/\s+/).map(Number);
    if (filas.length > 0 && valores.length !== filas[0].length) {
      throw new Error(
        `IDECOR mandó una fila de ${valores.length} puntos y las anteriores tenían ${filas[0].length}.`,
      );
    }
    filas.push(valores);
  }

  if (filas.length < 2 || filas[0].length < 2) {
    throw new Error("IDECOR no mandó alturas.");
  }

  const ancho = filas[0].length;
  const alto = filas.length;
  const alturas = new Float32Array(ancho * alto);
  filas.forEach((valores, fila) => {
    valores.forEach((valor, columna) => {
      alturas[fila * ancho + columna] =
        Number.isFinite(valor) && valor < SIN_DATO_DE_IDECOR ? valor : NaN;
    });
  });

  return { grilla: { ancho, alto, alturas }, bordes: { oeste, sur, este, norte } };
}

/**
 * Pasa lo que mandó IDECOR a la grilla exacta del pedazo, con su margen.
 *
 * Cada punto del pedazo se busca en la grilla de IDECOR por su posición en
 * metros, usando los bordes que IDECOR informó, y se mezclan los cuatro puntos
 * que lo rodean. Si alguno de los cuatro no tiene dato, el punto queda sin
 * dato y lo completa el respaldo.
 */
export function llevarAlPedazo(
  { grilla, bordes }: { grilla: GrillaDeAlturas; bordes: BordesEnMetros },
  z: number,
  x: number,
  y: number,
  margen: number,
): GrillaDeAlturas {
  const pedazo = bordesEnMetros(z, x, y, margen);
  const puntos = pedazo.puntos;
  const paso = (pedazo.este - pedazo.oeste) / puntos;
  const anchoDelPunto = (bordes.este - bordes.oeste) / grilla.ancho;
  const altoDelPunto = (bordes.norte - bordes.sur) / grilla.alto;
  const alturas = new Float32Array(puntos * puntos);

  for (let fila = 0; fila < puntos; fila += 1) {
    // El valor de cada punto vale para su centro.
    const metrosY = pedazo.norte - (fila + 0.5) * paso;
    const fy = (bordes.norte - metrosY) / altoDelPunto - 0.5;
    const y0 = Math.floor(fy);
    const ty = fy - y0;

    for (let columna = 0; columna < puntos; columna += 1) {
      const metrosX = pedazo.oeste + (columna + 0.5) * paso;
      const fx = (metrosX - bordes.oeste) / anchoDelPunto - 0.5;
      const x0 = Math.floor(fx);
      const tx = fx - x0;

      if (x0 < 0 || y0 < 0 || x0 + 1 >= grilla.ancho || y0 + 1 >= grilla.alto) {
        alturas[fila * puntos + columna] = NaN;
        continue;
      }
      const leer = (cx: number, cy: number) => grilla.alturas[cy * grilla.ancho + cx];
      const arriba = leer(x0, y0) * (1 - tx) + leer(x0 + 1, y0) * tx;
      const abajo = leer(x0, y0 + 1) * (1 - tx) + leer(x0 + 1, y0 + 1) * tx;
      // NaN contagia: si falta uno de los cuatro, el punto queda sin dato.
      alturas[fila * puntos + columna] = arriba * (1 - ty) + abajo * ty;
    }
  }

  return { ancho: puntos, alto: puntos, alturas };
}

/**
 * Completa los puntos sin dato con el respaldo.
 *
 * El respaldo recibe la posición del punto en la grilla y devuelve su altura,
 * o `NaN` si tampoco la sabe. Devuelve cuántos puntos quedaron sin altura.
 */
export function completarConRespaldo(
  grilla: GrillaDeAlturas,
  respaldo: (columna: number, fila: number) => number,
): number {
  let sinAltura = 0;
  for (let fila = 0; fila < grilla.alto; fila += 1) {
    for (let columna = 0; columna < grilla.ancho; columna += 1) {
      const i = fila * grilla.ancho + columna;
      if (!Number.isNaN(grilla.alturas[i])) continue;
      const valor = respaldo(columna, fila);
      grilla.alturas[i] = valor;
      if (Number.isNaN(valor)) sinAltura += 1;
    }
  }
  return sinAltura;
}

/** El peso de cada vecino en el suavizado, de una campana. */
function campana(sigma: number): Float32Array {
  const radio = Math.max(1, Math.ceil(3 * sigma));
  const pesos = new Float32Array(2 * radio + 1);
  let suma = 0;
  for (let i = -radio; i <= radio; i += 1) {
    const peso = Math.exp(-(i * i) / (2 * sigma * sigma));
    pesos[i + radio] = peso;
    suma += peso;
  }
  return pesos.map((peso) => peso / suma);
}

/**
 * Suaviza la grilla: cada punto pasa a ser un promedio de sus vecinos, pesando
 * más los más cercanos. Primero a lo ancho y después a lo alto.
 *
 * En el borde se repite el último punto, que es lo que menos inventa.
 */
export function suavizar(grilla: GrillaDeAlturas, sigma: number): GrillaDeAlturas {
  if (sigma <= 0) return grilla;
  const { ancho, alto } = grilla;
  const pesos = campana(sigma);
  const radio = (pesos.length - 1) / 2;
  const acotar = (valor: number, tope: number) => Math.min(tope - 1, Math.max(0, valor));

  const aLoAncho = new Float32Array(ancho * alto);
  for (let fila = 0; fila < alto; fila += 1) {
    for (let columna = 0; columna < ancho; columna += 1) {
      let suma = 0;
      for (let k = -radio; k <= radio; k += 1) {
        suma += pesos[k + radio] * grilla.alturas[fila * ancho + acotar(columna + k, ancho)];
      }
      aLoAncho[fila * ancho + columna] = suma;
    }
  }

  const alturas = new Float32Array(ancho * alto);
  for (let fila = 0; fila < alto; fila += 1) {
    for (let columna = 0; columna < ancho; columna += 1) {
      let suma = 0;
      for (let k = -radio; k <= radio; k += 1) {
        suma += pesos[k + radio] * aLoAncho[acotar(fila + k, alto) * ancho + columna];
      }
      alturas[fila * ancho + columna] = suma;
    }
  }

  return { ancho, alto, alturas };
}

/** Saca el margen de alrededor. */
export function recortar(grilla: GrillaDeAlturas, margen: number): GrillaDeAlturas {
  if (margen <= 0) return grilla;
  const ancho = grilla.ancho - 2 * margen;
  const alto = grilla.alto - 2 * margen;
  const alturas = new Float32Array(ancho * alto);
  for (let fila = 0; fila < alto; fila += 1) {
    const desde = (fila + margen) * grilla.ancho + margen;
    alturas.set(grilla.alturas.subarray(desde, desde + ancho), fila * ancho);
  }
  return { ancho, alto, alturas };
}

/**
 * La grilla escrita como imagen «terrarium»: tres números por punto (rojo,
 * verde y azul) que juntos dan la altura con decimales.
 *
 * Un punto sin altura se escribe a nivel del mar: no debería quedar ninguno,
 * porque el respaldo cubre el mundo entero salvo el mar abierto.
 */
export function aTerrarium(grilla: GrillaDeAlturas, paso = PASO_DE_ALTURA): Uint8Array {
  const puntos = new Uint8Array(grilla.ancho * grilla.alto * 3);
  for (let i = 0; i < grilla.alturas.length; i += 1) {
    const cruda = Number.isNaN(grilla.alturas[i]) ? 0 : grilla.alturas[i];
    const altura = Math.round(cruda / paso) * paso;
    const valor = Math.min(65535.996, Math.max(0, altura + 32768));
    const entero = Math.floor(valor);
    puntos[i * 3] = Math.floor(entero / 256);
    puntos[i * 3 + 1] = entero % 256;
    puntos[i * 3 + 2] = Math.floor((valor - entero) * 256);
  }
  return puntos;
}
