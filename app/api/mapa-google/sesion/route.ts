import { NextResponse } from "next/server";
import {
  claveDeGoogle, comprobarAccesoAGoogle, motivoDeGoogle, respuestaDeGoogle,
  SIN_GUARDAR_GOOGLE,
} from "@/lib/mapas/google-servidor";

export const runtime = "nodejs";

export async function POST() {
  const acceso = await comprobarAccesoAGoogle();
  if (acceso) return acceso;
  const clave = claveDeGoogle();
  if (!clave) return NextResponse.json({ disponible: false },
    { headers: { "Cache-Control": SIN_GUARDAR_GOOGLE } });

  try {
    const respuesta = await fetch(`https://tile.googleapis.com/v1/createSession?key=${encodeURIComponent(clave)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mapType: "satellite", language: "es-AR", region: "AR" }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!respuesta.ok) return respuestaDeGoogle(`Google rechazó la sesión del mapa (${respuesta.status}). Revisá la clave, la facturación y el cupo de Map Tiles API.`, 502);
    const datos = await respuesta.json() as { session?: string; expiry?: string; tileWidth?: number };
    if (!datos.session || !datos.expiry || datos.tileWidth !== 256) {
      return respuestaDeGoogle("Google devolvió una sesión incompleta para el mapa. Volvé a probar más tarde.", 502);
    }
    return NextResponse.json({ sesion: datos.session, vence: datos.expiry },
      { headers: { "Cache-Control": SIN_GUARDAR_GOOGLE } });
  } catch (error) {
    return respuestaDeGoogle(`No se pudo abrir el mapa de Google: ${motivoDeGoogle(error)}. Usá el mapa Satelital.`, 502);
  }
}
