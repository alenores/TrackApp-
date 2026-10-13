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

/** El mayor detalle informado para el centro visible, sin ampliar una imagen vieja. */
export function maximoDetalleDeGoogle(
  areas: AreaConDetalleDeGoogle[],
  posicion: { lat: number; lng: number },
): number | null {
  const longitud = ((posicion.lng + 180) % 360 + 360) % 360 - 180;
  const niveles = areas
    .filter((area) =>
      Number.isInteger(area.maxZoom) && area.maxZoom >= 0 && area.maxZoom <= 22 &&
      Number.isFinite(area.north) && Number.isFinite(area.south) &&
      Number.isFinite(area.east) && Number.isFinite(area.west) &&
      posicion.lat >= area.south && posicion.lat <= area.north &&
      (area.west <= area.east
        ? longitud >= area.west && longitud <= area.east
        : longitud >= area.west || longitud <= area.east),
    )
    .map((area) => area.maxZoom);
  return niveles.length ? Math.max(...niveles) : null;
}

/** Busca los créditos sin confundir su ausencia con un límite de la imagen. */
export async function detalleConCreditosDeGoogle(
  consulta: URLSearchParams,
  posicion: { lat: number; lng: number },
  traer: (consulta: URLSearchParams) => Promise<RespuestaDeDetalleDeGoogle>,
  sigueActivo: () => boolean = () => true,
): Promise<{ derechos: string | null } | null> {
  const pedido = new URLSearchParams(consulta);
  let nivel = Number(pedido.get("zoom"));
  let respuesta = await traer(pedido);
  while (!respuesta.derechos && nivel > 0 && sigueActivo()) {
    const informado = maximoDetalleDeGoogle(respuesta.areasConDetalle, posicion);
    nivel = informado !== null && informado < nivel ? informado : nivel - 1;
    pedido.set("zoom", String(nivel));
    respuesta = await traer(pedido);
  }
  if (!sigueActivo()) return null;
  return {
    derechos: respuesta.derechos,
  };
}
