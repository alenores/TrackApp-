import { NextResponse } from "next/server";
import {
  claveDeGoogle, comprobarAccesoAGoogle, motivoDeGoogle, respuestaDeGoogle,
  sesionValida, SIN_GUARDAR_GOOGLE, sinClaveDeGoogle,
} from "@/lib/mapas/google-servidor";

export const runtime = "nodejs";

export async function GET(pedido: Request) {
  const acceso = await comprobarAccesoAGoogle();
  if (acceso) return acceso;
  const clave = claveDeGoogle();
  if (!clave) return sinClaveDeGoogle();
  const entrada = new URL(pedido.url).searchParams;
  const sesion = entrada.get("sesion");
  if (!sesionValida(sesion)) return respuestaDeGoogle("La sesión del mapa de Google no es válida. Volvé a abrir el mapa.", 400);
  const limites = ["north", "south", "east", "west", "zoom"] as const;
  const numeros = Object.fromEntries(limites.map((nombre) => [nombre, Number(entrada.get(nombre))])) as Record<typeof limites[number], number>;
  if (limites.some((nombre) => !entrada.has(nombre) || !Number.isFinite(numeros[nombre])) ||
      numeros.north <= numeros.south || numeros.north > 90 || numeros.south < -90 ||
      Math.abs(numeros.east) > 180 || Math.abs(numeros.west) > 180 ||
      numeros.zoom < 0 || numeros.zoom > 22) {
    return respuestaDeGoogle("El área visible del mapa de Google no es válida.", 400);
  }
  const consulta = new URLSearchParams({ sesion, key: clave });
  for (const nombre of limites) consulta.set(nombre, String(numeros[nombre]));
  try {
    const respuesta = await fetch(`https://tile.googleapis.com/tile/v1/viewport?${consulta}`, {
      cache: "no-store", signal: AbortSignal.timeout(15_000),
    });
    if (!respuesta.ok) return respuestaDeGoogle(`Google no entregó los créditos de la imagen (${respuesta.status}). Cambiá al mapa Satelital.`, 502);
    const datos = await respuesta.json() as { copyright?: string };
    if (!datos.copyright) return respuestaDeGoogle("Google no informó los créditos obligatorios de la imagen. Cambiá al mapa Satelital.", 502);
    return NextResponse.json({ derechos: datos.copyright }, { headers: { "Cache-Control": SIN_GUARDAR_GOOGLE } });
  } catch (error) {
    return respuestaDeGoogle(`No se pudieron traer los créditos de Google: ${motivoDeGoogle(error)}. Cambiá al mapa Satelital.`, 502);
  }
}
