/** Pedidos de la imagen de consulta. La pantalla solo recibe el resultado. */
export async function abrirSesionDeGoogle(): Promise<string | null> {
  const respuesta = await fetch("/api/mapa-google/sesion", { method: "POST", cache: "no-store" });
  const datos = await respuesta.json() as { sesion?: string; disponible?: boolean; error?: string };
  if (respuesta.ok && datos.disponible === false) return null;
  if (!respuesta.ok || !datos.sesion) throw new Error(datos.error || `Google respondió ${respuesta.status}`);
  return datos.sesion;
}

export async function traerCreditosDeGoogle(consulta: URLSearchParams): Promise<string> {
  const respuesta = await fetch(`/api/mapa-google/atribucion?${consulta}`, { cache: "no-store" });
  const datos = await respuesta.json() as { derechos?: string; error?: string };
  if (!respuesta.ok || !datos.derechos) throw new Error(datos.error || `Google respondió ${respuesta.status}`);
  return datos.derechos;
}
