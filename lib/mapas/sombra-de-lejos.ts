import { alturaEnElPedazo, alturaTerrarium, type PedazoDeRelieve } from "@/lib/alturas/relieve";
import { leerTesela } from "@/lib/mapas/deposito";
import {
  ACERCAMIENTO_DE_LA_SOMBRA_FINA,
  LADO_DE_LA_SOMBRA,
  aTerrarium,
  juntarDeCerca,
  type GrillaDeAlturas,
} from "@/lib/mapas/sombra";
import { ACERCAMIENTO_DEL_RELIEVE, claveDeTesela, type Tesela } from "@/lib/mapas/teselas";
import { anotarDetalleDeLaSombra, sombraGruesa } from "@/lib/offline/sombra-gruesa";

/**
 * Los pedazos de sombreado de lejos se arman en el celular con los de cerca
 * (Ale, 2026-10-31; decisión 079).
 *
 * Así a Córdoba solo se le piden los de cerca, que contesta rápido. Se leen
 * del depósito —los de cerca ya bajaron— y el relieve de 30 m del sector
 * completa lo que quede afuera. **No sale a internet.**
 *
 * Abrir y escribir imágenes se le pasa desde afuera, para poder probar la
 * cuenta sin un navegador.
 */

export type ImagenAbierta = PedazoDeRelieve;

export type HerramientasDeImagen = {
  abrir: (bytes: Uint8Array) => Promise<ImagenAbierta>;
  /** Escribe una imagen sin pérdida con estos puntos (rojo, verde, azul). */
  escribir: (puntos: Uint8Array, lado: number) => Promise<Uint8Array>;
};

function comoGrilla(imagen: ImagenAbierta): GrillaDeAlturas {
  const alturas = new Float32Array(imagen.ancho * imagen.alto);
  for (let i = 0; i < alturas.length; i += 1) {
    const j = i * imagen.canales;
    alturas[i] = alturaTerrarium(imagen.datos[j], imagen.datos[j + 1], imagen.datos[j + 2]);
  }
  return { ancho: imagen.ancho, alto: imagen.alto, alturas };
}

/** Los pedazos de cerca que forman uno de lejos, por filas. */
export function hijosDeCerca({ z, x, y }: Tesela): Tesela[] {
  const porLado = 2 ** (ACERCAMIENTO_DE_LA_SOMBRA_FINA - z);
  const hijos: Tesela[] = [];
  for (let fila = 0; fila < porLado; fila += 1) {
    for (let columna = 0; columna < porLado; columna += 1) {
      hijos.push({ z: ACERCAMIENTO_DE_LA_SOMBRA_FINA, x: x * porLado + columna, y: y * porLado + fila, capa: "sombra" });
    }
  }
  return hijos;
}

/**
 * Arma un pedazo de lejos y anota si quedó con menos detalle: si alguno de
 * los de cerca quedó así, el de lejos también, con el mismo motivo.
 *
 * Devuelve nada si no hay de dónde sacar altura (ni de cerca ni relieve).
 */
export async function armarSombraDeLejos(
  tesela: Tesela,
  herramientas: HerramientasDeImagen,
): Promise<Uint8Array | null> {
  const porLado = 2 ** (ACERCAMIENTO_DE_LA_SOMBRA_FINA - tesela.z);
  const hijos = hijosDeCerca(tesela);
  const gruesa = sombraGruesa();

  const abiertos = await Promise.all(
    hijos.map(async (hijo) => {
      const bytes = await leerTesela(claveDeTesela(hijo));
      return bytes && bytes.byteLength > 0 ? comoGrilla(await herramientas.abrir(bytes)) : null;
    }),
  );

  // El relieve de 30 m que contiene al pedazo, para lo que quede afuera.
  const escala = 2 ** (tesela.z - ACERCAMIENTO_DEL_RELIEVE);
  const xDelRelieve = Math.floor(tesela.x / escala);
  const yDelRelieve = Math.floor(tesela.y / escala);
  const bytesDelRelieve = await leerTesela(
    claveDeTesela({ z: ACERCAMIENTO_DEL_RELIEVE, x: xDelRelieve, y: yDelRelieve, capa: "relieve" }),
  );
  const relieve =
    bytesDelRelieve && bytesDelRelieve.byteLength > 0 ? await herramientas.abrir(bytesDelRelieve) : null;

  if (!relieve && abiertos.every((hijo) => !hijo)) return null;

  const respaldo = (columna: number, fila: number): number => {
    if (!relieve) return NaN;
    const px = ((tesela.x - xDelRelieve * escala + (columna + 0.5) / LADO_DE_LA_SOMBRA) / escala) * relieve.ancho;
    const py = ((tesela.y - yDelRelieve * escala + (fila + 0.5) / LADO_DE_LA_SOMBRA) / escala) * relieve.alto;
    return alturaEnElPedazo(relieve, px, py);
  };

  const grilla = juntarDeCerca(abiertos, porLado, respaldo);
  const bytes = await herramientas.escribir(aTerrarium(grilla), LADO_DE_LA_SOMBRA);

  const motivo = hijos.map((hijo) => gruesa[claveDeTesela(hijo)]).find(Boolean) ?? null;
  anotarDetalleDeLaSombra(claveDeTesela(tesela), motivo);

  return bytes;
}

/**
 * Abrir y escribir imágenes en el navegador, sin tocar los colores: cada
 * punto guarda una altura y un cambio mínimo de color es un cambio de altura.
 */
async function abrirEnElNavegador(bytes: Uint8Array): Promise<ImagenAbierta> {
  const imagen = await createImageBitmap(new Blob([bytes.slice()]), {
    colorSpaceConversion: "none",
    premultiplyAlpha: "none",
  });
  const lienzo = new OffscreenCanvas(imagen.width, imagen.height);
  const contexto = lienzo.getContext("2d", { colorSpace: "srgb" });
  if (!contexto) throw new Error("el celular no pudo abrir el sombreado guardado");
  contexto.drawImage(imagen, 0, 0);
  const { data } = contexto.getImageData(0, 0, imagen.width, imagen.height);
  imagen.close();
  return { ancho: imagen.width, alto: imagen.height, canales: 4, datos: new Uint8Array(data.buffer) };
}

/** ¿La imagen escrita devuelve exactamente los mismos puntos? */
async function esIdentica(bytes: Uint8Array, puntos: Uint8ClampedArray): Promise<boolean> {
  const leida = await abrirEnElNavegador(bytes);
  if (leida.datos.length !== puntos.length) return false;
  for (let i = 0; i < puntos.length; i += 1) if (leida.datos[i] !== puntos[i]) return false;
  return true;
}

/**
 * Abrir y escribir imágenes en el navegador, sin tocar los colores: cada
 * punto guarda una altura y un cambio mínimo de color es un cambio de altura.
 */
export const herramientasDelNavegador: HerramientasDeImagen = {
  abrir: abrirEnElNavegador,
  async escribir(puntos, lado) {
    const conAlfa = new Uint8ClampedArray(lado * lado * 4);
    for (let i = 0; i < lado * lado; i += 1) {
      conAlfa[i * 4] = puntos[i * 3];
      conAlfa[i * 4 + 1] = puntos[i * 3 + 1];
      conAlfa[i * 4 + 2] = puntos[i * 3 + 2];
      conAlfa[i * 4 + 3] = 255;
    }
    const lienzo = new OffscreenCanvas(lado, lado);
    const contexto = lienzo.getContext("2d", { colorSpace: "srgb" });
    if (!contexto) throw new Error("el celular no pudo armar el sombreado de lejos");
    contexto.putImageData(new ImageData(conAlfa, lado, lado), 0, 0);

    // WebP pesa menos, pero no todos los navegadores lo escriben sin pérdida:
    // se comprueba punto por punto y, si cambió algo, va PNG, que nunca pierde.
    // Medido en Chrome el 2026-10-31: 175 KB en WebP, 257 KB en PNG.
    const enWebp = await lienzo.convertToBlob({ type: "image/webp", quality: 1 });
    if (enWebp.type === "image/webp") {
      const bytes = new Uint8Array(await enWebp.arrayBuffer());
      if (await esIdentica(bytes, conAlfa)) return bytes;
    }
    const enPng = await lienzo.convertToBlob({ type: "image/png" });
    return new Uint8Array(await enPng.arrayBuffer());
  },
};
