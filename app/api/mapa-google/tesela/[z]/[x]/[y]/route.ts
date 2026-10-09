import { NextResponse } from "next/server";
import {
  claveDeGoogle, comprobarAccesoAGoogle, motivoDeGoogle, respuestaDeGoogle,
  sesionValida, SIN_GUARDAR_GOOGLE, sinClaveDeGoogle,
} from "@/lib/mapas/google-servidor";

export const runtime = "nodejs";

export async function GET(pedido: Request, { params }: { params: Promise<{ z: string; x: string; y: string }> }) {
  const acceso = await comprobarAccesoAGoogle();
  if (acceso) return acceso;
  const clave = claveDeGoogle();
  if (!clave) return sinClaveDeGoogle();
  const sesion = new URL(pedido.url).searchParams.get("sesion");
  if (!sesionValida(sesion)) return respuestaDeGoogle("La sesión del mapa de Google no es válida. Volvé a abrir el mapa.", 400);
  const { z, x, y } = await params;
  const nivel = Number(z);
  const horizontal = Number(x);
  const vertical = Number(y);
  if (!/^\d+$/.test(z) || !/^\d+$/.test(x) || !/^\d+$/.test(y) ||
      nivel < 0 || nivel > 22 || horizontal >= 2 ** nivel || vertical >= 2 ** nivel) {
    return respuestaDeGoogle("El sector pedido del mapa de Google no es válido.", 400);
  }
  try {
    const respuesta = await fetch(`https://tile.googleapis.com/v1/2dtiles/${nivel}/${horizontal}/${vertical}?session=${encodeURIComponent(sesion)}&key=${encodeURIComponent(clave)}`, {
      cache: "no-store", signal: AbortSignal.timeout(15_000),
    });
    if (!respuesta.ok) return respuestaDeGoogle(`Google no entregó esta imagen (${respuesta.status}). Cambiá al mapa Satelital y volvé a probar más tarde.`, 502);
    const tipo = respuesta.headers.get("content-type") || "";
    if (!tipo.startsWith("image/")) return respuestaDeGoogle("Google respondió sin una imagen válida. Cambiá al mapa Satelital.", 502);
    return new NextResponse(await respuesta.arrayBuffer(), {
      headers: { "Content-Type": tipo, "Cache-Control": SIN_GUARDAR_GOOGLE },
    });
  } catch (error) {
    return respuestaDeGoogle(`No se pudo traer la imagen de Google: ${motivoDeGoogle(error)}. Cambiá al mapa Satelital.`, 502);
  }
}
