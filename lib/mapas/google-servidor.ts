import { NextResponse } from "next/server";
import { crearClienteEnElServidor } from "@/lib/supabase/servidor";

export const SIN_GUARDAR_GOOGLE = "private, no-store, max-age=0";

export async function comprobarAccesoAGoogle(): Promise<NextResponse | null> {
  try {
    const supabase = await crearClienteEnElServidor();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims) {
      return NextResponse.json({ error: "Entrá con tu cuenta para ver el mapa de Google." },
        { status: 401, headers: { "Cache-Control": SIN_GUARDAR_GOOGLE } });
    }
  } catch (error) {
    return NextResponse.json({ error: `No se pudo verificar tu sesión: ${motivoDeGoogle(error)}` },
      { status: 500, headers: { "Cache-Control": SIN_GUARDAR_GOOGLE } });
  }
  return null;
}

export function claveDeGoogle(): string | null {
  return process.env.GOOGLE_MAP_TILES_API_KEY?.trim() || null;
}

export function sinClaveDeGoogle(): NextResponse {
  return NextResponse.json({ error: "El mapa de Google todavía no está configurado. Usá el mapa Satelital mientras se configura." },
    { status: 503, headers: { "Cache-Control": SIN_GUARDAR_GOOGLE } });
}

export function motivoDeGoogle(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "el servicio de mapas no respondió";
}

export function sesionValida(sesion: string | null): sesion is string {
  return Boolean(sesion && /^[A-Za-z0-9_-]{10,512}$/.test(sesion));
}

export function respuestaDeGoogle(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": SIN_GUARDAR_GOOGLE } });
}
