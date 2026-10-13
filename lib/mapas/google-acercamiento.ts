/** Áreas en las que Google informa hasta qué nivel existe imagen real. */
export type AreaConDetalleDeGoogle = {
  maxZoom: number;
  north: number;
  south: number;
  east: number;
  west: number;
};

export type RespuestaDeDetalleDeGoogle = {
  derechos: string | null;
  areasConDetalle: AreaConDetalleDeGoogle[];
};

/** El mayor detalle del centro; si no hay coincidencia, el mayor de la vista. */
export function maximoDetalleDeGoogle(
  areas: AreaConDetalleDeGoogle[],
  posicion: { lat: number; lng: number },
): number | null {
  const longitud = ((posicion.lng + 180) % 360 + 360) % 360 - 180;
  const validas = areas.filter((area) =>
    Number.isInteger(area.maxZoom) && area.maxZoom >= 0 && area.maxZoom <= 22);
  const niveles = validas
    .filter((area) =>
      Number.isFinite(area.north) && Number.isFinite(area.south) &&
      Number.isFinite(area.east) && Number.isFinite(area.west) &&
      posicion.lat >= area.south && posicion.lat <= area.north &&
      (area.west <= area.east
        ? longitud >= area.west && longitud <= area.east
        : longitud >= area.west || longitud <= area.east),
    )
    .map((area) => area.maxZoom);
  if (niveles.length) return Math.max(...niveles);
  return validas.length ? Math.max(...validas.map((area) => area.maxZoom)) : null;
}

/** Conserva el límite conocido si la respuesta nueva no informa otro. */
export function limiteDeGoogleSinRetroceso(
  limiteActual: number,
  zoomActual: number,
  maximoInformado: number | null,
): number {
  return maximoInformado === null ? limiteActual : Math.max(zoomActual, maximoInformado);
}

/** Busca los créditos sin confundir su ausencia con un límite de la imagen. */
export async function detalleConCreditosDeGoogle(
  consulta: URLSearchParams,
  posicion: { lat: number; lng: number },
  traer: (consulta: URLSearchParams) => Promise<RespuestaDeDetalleDeGoogle>,
  sigueActivo: () => boolean = () => true,
  alInformarMaximo?: (maximo: number | null) => void,
): Promise<{ derechos: string | null; maximo: number | null } | null> {
  const pedido = new URLSearchParams(consulta);
  let nivel = Number(pedido.get("zoom"));
  let respuesta = await traer(pedido);
  // El límite sale de la vista solicitada. Buscar créditos en otra vista no
  // cambia el detalle real disponible en la que está mirando la persona.
  const maximo = maximoDetalleDeGoogle(respuesta.areasConDetalle, posicion);
  if (!sigueActivo()) return null;
  alInformarMaximo?.(maximo);
  while (!respuesta.derechos && nivel > 0 && sigueActivo()) {
    const informado = maximoDetalleDeGoogle(respuesta.areasConDetalle, posicion);
    nivel = informado !== null && informado < nivel ? informado : nivel - 1;
    pedido.set("zoom", String(nivel));
    respuesta = await traer(pedido);
  }
  if (!sigueActivo()) return null;
  return {
    derechos: respuesta.derechos,
    maximo,
  };
}
