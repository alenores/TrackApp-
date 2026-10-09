import type { PuntoDelPerfil } from "@/lib/alturas/perfil";
import type { CondicionDePaso } from "@/lib/caminos/partes";

/**
 * Las cuentas del gráfico de alturas: qué rango mostrar, dónde van las marcas
 * de los ejes y qué punto del perfil queda bajo el dedo. La pantalla solo
 * dibuja lo que esto le dice. Cuenta pura, sin pantalla.
 */

/** Cómo se pinta un pedazo del gráfico: la complejidad de su parte, o «propio» si se dibujó solo para el Circuito. */
export type EstiloDeTramo = "facil" | "media" | "dificil" | "sin_clasificar" | "propio";

/** Un pedazo del gráfico, en metros desde el comienzo, con su color y su condición de paso. */
export type TramoDelPerfil = {
  desdeM: number;
  hastaM: number;
  estilo: EstiloDeTramo;
  paso?: CondicionDePaso | null;
};

/** Pasos «redondos» para las marcas: se usa el más chico que no amontona. */
const PASOS_DE_ALTURA_M = [10, 20, 25, 50, 100, 200, 250, 500, 1000];
const PASOS_DE_DISTANCIA_M = [100, 200, 250, 500, 1000, 2000, 2500, 5000, 10_000, 20_000, 50_000];

function pasoRedondo(rango: number, maximoDeMarcas: number, pasos: number[]): number {
  return pasos.find((paso) => rango / paso <= maximoDeMarcas) ?? pasos[pasos.length - 1];
}

export type EjesDelGrafico = {
  alturaMinimaM: number;
  alturaMaximaM: number;
  marcasDeAltura: number[];
  marcasDeDistancia: number[];
  largoM: number;
};

/**
 * El rango de alturas arranca y termina en marcas redondas, con un poco de aire
 * arriba y abajo. Un perfil llano no se dibuja como si fuera una montaña: el
 * rango mínimo es de 50 m.
 */
export function ejesDelGrafico(perfil: PuntoDelPerfil[], marcasDeAlturaMaximas = 4, marcasDeDistanciaMaximas = 5): EjesDelGrafico {
  const alturas = perfil.map((punto) => punto.alturaM);
  let minima = Math.min(...alturas);
  let maxima = Math.max(...alturas);
  if (maxima - minima < 50) {
    const medio = (maxima + minima) / 2;
    minima = medio - 25;
    maxima = medio + 25;
  }
  // Se cuentan las marcas ya redondeadas: el redondeo de las puntas suma una o dos.
  const pasoDeAltura = PASOS_DE_ALTURA_M.find((paso) =>
    Math.ceil(maxima / paso) - Math.floor(minima / paso) <= marcasDeAlturaMaximas,
  ) ?? PASOS_DE_ALTURA_M[PASOS_DE_ALTURA_M.length - 1];
  const alturaMinimaM = Math.floor(minima / pasoDeAltura) * pasoDeAltura;
  const alturaMaximaM = Math.ceil(maxima / pasoDeAltura) * pasoDeAltura;
  const marcasDeAltura: number[] = [];
  for (let altura = alturaMinimaM; altura <= alturaMaximaM; altura += pasoDeAltura) marcasDeAltura.push(altura);

  const largoM = perfil.length > 0 ? perfil[perfil.length - 1].distanciaM : 0;
  const pasoDeDistancia = pasoRedondo(largoM, marcasDeDistanciaMaximas, PASOS_DE_DISTANCIA_M);
  const marcasDeDistancia: number[] = [];
  for (let distancia = 0; distancia <= largoM + 1e-6; distancia += pasoDeDistancia) marcasDeDistancia.push(distancia);

  return { alturaMinimaM, alturaMaximaM, marcasDeAltura, marcasDeDistancia, largoM };
}

/** El punto del perfil más cercano a una distancia: lo que queda bajo el dedo. */
export function puntoMasCercano(perfil: PuntoDelPerfil[], distanciaM: number): PuntoDelPerfil | null {
  if (perfil.length === 0) return null;
  let menor = 0;
  let mayor = perfil.length - 1;
  while (mayor - menor > 1) {
    const medio = (menor + mayor) >> 1;
    if (perfil[medio].distanciaM <= distanciaM) menor = medio;
    else mayor = medio;
  }
  return Math.abs(perfil[menor].distanciaM - distanciaM) <= Math.abs(perfil[mayor].distanciaM - distanciaM)
    ? perfil[menor]
    : perfil[mayor];
}

/** «850 m» o «12,4 km», como se dice en toda la app. */
export function textoDeDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros)} m`;
  const kilometros = Math.round(metros / 100) / 10;
  return `${Number.isInteger(kilometros) ? kilometros : kilometros.toFixed(1).replace(".", ",")} km`;
}

/** «1.034 m». */
export function textoDeAltura(metros: number): string {
  return `${Math.round(metros).toLocaleString("es-AR")} m`;
}
