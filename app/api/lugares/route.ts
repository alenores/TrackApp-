import { NextResponse } from "next/server";
import { direccionDeLosLugares, leerLugaresDeInternet } from "@/lib/mapas/lugares-de-internet";
import { crearClienteEnElServidor } from "@/lib/supabase/servidor";

/**
 * Pueblos, ciudades y localidades del mapa de fondo.
 *
 * La app no tiene esa lista: los nombres están pintados en el mapa. Acá se
 * pregunta una sola vez, cuando alguien aprieta el botón, y solo con la sesión
 * iniciada. No se guarda la respuesta: un pueblo viejo haría viajar al lugar
 * que ya no es.
 *
 * El que responde pide que no se lo consulte a cada letra, y que la pregunta
 * diga quién la hace.
 */

export const dynamic = "force-dynamic";

const QUIEN_PREGUNTA = "TrackApp/1.0 (https://track-app-hazel.vercel.app)";
const TOPE_DE_ESPERA_MS = 15_000;

export async function GET(pedido: Request) {
  try {
    const supabase = await crearClienteEnElServidor();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims) {
      return NextResponse.json(
        { error: "Entrá con tu cuenta para buscar pueblos." },
        { status: 401 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: `No se pudo verificar tu sesión: ${
          error instanceof Error && error.message ? error.message : "el servidor no contestó"
        }. Volvé a entrar y apretá Buscar pueblos de nuevo.`,
      },
      { status: 500 },
    );
  }

  const texto = new URL(pedido.url).searchParams.get("q")?.trim() ?? "";
  if (texto.length < 2) {
    return NextResponse.json(
      { error: "Escribí al menos dos letras del pueblo y apretá Buscar pueblos." },
      { status: 400 },
    );
  }
  if (texto.length > 80) {
    return NextResponse.json(
      { error: "Ese nombre es demasiado largo. Dejá solo el pueblo o la ciudad." },
      { status: 400 },
    );
  }

  try {
    const respuesta = await fetch(direccionDeLosLugares(texto), {
      headers: {
        Accept: "application/json",
        "Accept-Language": "es",
        "User-Agent": QUIEN_PREGUNTA,
      },
      signal: AbortSignal.timeout(TOPE_DE_ESPERA_MS),
      cache: "no-store",
    });
    if (respuesta.status === 429) {
      return NextResponse.json(
        { error: "El mapa de pueblos está ocupado. Esperá un momento y volvé a apretar Buscar pueblos." },
        { status: 429 },
      );
    }
    if (!respuesta.ok) {
      return NextResponse.json(
        { error: `El mapa de pueblos contestó mal (${respuesta.status}). Revisá la señal y volvé a apretar Buscar pueblos.` },
        { status: 502 },
      );
    }
    const datos: unknown = await respuesta.json();
    return NextResponse.json(
      { lugares: leerLugaresDeInternet(datos) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const seCorto = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      {
        error: seCorto
          ? "El mapa de pueblos tardó demasiado. Revisá la señal y volvé a apretar Buscar pueblos."
          : `No se pudo buscar pueblos: ${error instanceof Error && error.message ? error.message : "no hubo respuesta"}. Revisá la señal y volvé a apretar Buscar pueblos.`,
      },
      { status: 502 },
    );
  }
}
