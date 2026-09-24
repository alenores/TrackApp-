/**
 * De dónde sale la foto satelital.
 *
 * Es **Sentinel-2 sin nubes**, de EOX: la foto de los satélites Sentinel-2 del
 * programa europeo Copernicus, armada sin nubes. Diez metros por píxel: se ven
 * los bosques, el agua, los claros y las paredes de roca. **No se ve un sendero
 * ni un refugio.** Es lo mejor gratis que hay para la sierra (decisión 007).
 *
 * **Se puede guardar en el celular.** Las versiones de 2018 en adelante tienen
 * licencia Creative Commons «atribución, no comercial, compartir igual», y EOX
 * deja usar su servicio gratis para usos no comerciales siempre que se diga de
 * quién es la foto. TrackApp no cobra nada: entra. El día que cobre, esto se
 * revisa, porque para uso comercial EOX tiene otra licencia, paga.
 *
 * Un solo lugar sabe esta dirección: la usan el mapa en vivo, al marcar
 * rectángulos, y el puente por donde baja la foto al celular.
 */

/** El año de la foto. Una más nueva es cambiar este número. */
const ANIO_DE_LA_FOTO = 2025;

export const DIRECCION_DE_LA_FOTO = `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-${ANIO_DE_LA_FOTO}_3857/default/g/{z}/{y}/{x}.jpg`;

/** Quién hizo la foto. Su licencia obliga a decirlo, y corresponde. */
export const QUIEN_HIZO_LA_FOTO = `Sentinel-2 cloudless ${ANIO_DE_LA_FOTO} por EOX · Copernicus`;

/** La dirección de un pedazo puntual. */
export function direccionDeUnPedazoDeFoto(z: number, x: number, y: number): string {
  return DIRECCION_DE_LA_FOTO.replace("{z}", String(z))
    .replace("{x}", String(x))
    .replace("{y}", String(y));
}
