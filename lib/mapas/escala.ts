/**
 * La escala del mapa: una regla con «200 m» o «1 km» que dice cuánto mide en
 * el terreno ese largo de pantalla (Ale, 2026-11-01). Va en las dos
 * navegaciones. Es pura cuenta: no sale a internet.
 */

/** La circunferencia de la Tierra en el ecuador, en metros, como la usa el mapa. */
const VUELTA_AL_MUNDO = 40075016.686;

/** Cuántos metros del terreno ocupa un punto de pantalla, en esa latitud y acercamiento. */
export function metrosPorPunto(latitud: number, acercamiento: number): number {
  return (VUELTA_AL_MUNDO * Math.cos((latitud * Math.PI) / 180)) / (512 * 2 ** acercamiento);
}

/** El largo redondo más grande que entra: 1, 2 o 5 por diez a la que sea. */
function redondoHacia(metros: number): number {
  const potencia = 10 ** Math.floor(Math.log10(metros));
  const proporcion = metros / potencia;
  const redondo = proporcion >= 5 ? 5 : proporcion >= 2 ? 2 : 1;
  return redondo * potencia;
}

export type Escala = { texto: string; ancho: number };

/**
 * La regla para mostrar: un largo redondo que entre en `anchoMaximo` puntos,
 * su ancho en pantalla y el texto («50 m», «1 km», «1,5 km» no: siempre redondo).
 */
export function escalaDelMapa(latitud: number, acercamiento: number, anchoMaximo = 100): Escala {
  const porPunto = metrosPorPunto(latitud, acercamiento);
  const metros = redondoHacia(porPunto * anchoMaximo);
  const texto = metros >= 1000 ? `${String(metros / 1000).replace(".", ",")} km` : `${metros} m`;
  return { texto, ancho: Math.round(metros / porPunto) };
}
