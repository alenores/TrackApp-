import { NextResponse } from "next/server";
import { crearClienteEnElServidor } from "@/lib/supabase/servidor";

/**
 * Las tranqueras y los alambrados de un rectángulo, preguntados a
 * OpenStreetMap.
 *
 * **Existe porque el mapa de fondo no los trae**: Protomaps los descarta al
 * armar el archivo del mundo, y en el Champaquí hay veinte tranqueras que
 * marcan por dónde se pasa. Se le pregunta a OpenStreetMap directamente, por
 * Overpass, y lo que contesta entra como anotaciones del sector.
 *
 * **Esto se usa en casa, con señal, una vez por sector**, desde la pantalla de
 * anotaciones. Nunca durante una navegación: las anotaciones ya viajan con el
 * paquete. Pide sesión iniciada para no ser un intermediario gratis.
 *
 * Overpass es un servicio comunitario: se lo identifica y se le pide poco.
 */

export const runtime = "nodejs";

const OVERPASS = "https://overpass-api.de/api/interpreter";

/** Quién pregunta, como pide la política de uso de Overpass. */
const QUIEN = "TrackApp (https://track-app-hazel.vercel.app)";

/** Un sector es de unos kilómetros. Más que esto no es un sector. */
const LADO_MAXIMO_EN_GRADOS = 0.6;

/** Cuánto se espera a Overpass, que a veces tarda. */
const SEGUNDOS_DE_ESPERA = 60;

function numero(texto: string | null): number | null {
  if (texto === null || !/^-?\d+(\.\d+)?$/.test(texto)) return null;
  return Number(texto);
}

export async function GET(pedido: Request) {
  try {
    const supabase = await crearClienteEnElServidor();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims) {
      return NextResponse.json(
        { error: "Entrá con tu cuenta para traer datos de OpenStreetMap." },
        { status: 401 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: `No se pudo verificar tu sesión: ${
          error instanceof Error && error.message ? error.message : "el servidor no contestó"
        }`,
      },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(pedido.url);
  const norte = numero(searchParams.get("norte"));
  const sur = numero(searchParams.get("sur"));
  const este = numero(searchParams.get("este"));
  const oeste = numero(searchParams.get("oeste"));

  if (norte === null || sur === null || este === null || oeste === null) {
    return NextResponse.json(
      { error: "Faltan las cuatro esquinas del sector." },
      { status: 400 },
    );
  }
  if (norte <= sur || este <= oeste) {
    return NextResponse.json(
      { error: "Las esquinas del sector están al revés." },
      { status: 400 },
    );
  }
  if (norte - sur > LADO_MAXIMO_EN_GRADOS || este - oeste > LADO_MAXIMO_EN_GRADOS) {
    return NextResponse.json(
      { error: "Ese rectángulo es demasiado grande para ser un sector." },
      { status: 400 },
    );
  }

  const caja = `${sur},${oeste},${norte},${este}`;
  const consulta = `[out:json][timeout:${SEGUNDOS_DE_ESPERA}];
(
  node["barrier"="gate"](${caja});
  way["barrier"="fence"](${caja});
);
out geom;`;

  try {
    const respuesta = await fetch(OVERPASS, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": QUIEN,
      },
      body: `data=${encodeURIComponent(consulta)}`,
      signal: AbortSignal.timeout((SEGUNDOS_DE_ESPERA + 5) * 1000),
    });

    if (respuesta.status === 429 || respuesta.status === 504) {
      return NextResponse.json(
        { error: "OpenStreetMap está ocupado en este momento. Probá de nuevo en un minuto." },
        { status: 503 },
      );
    }
    if (!respuesta.ok) {
      return NextResponse.json(
        { error: `OpenStreetMap contestó ${respuesta.status}. Probá de nuevo más tarde.` },
        { status: 502 },
      );
    }

    const cuerpo = (await respuesta.json()) as { elements?: unknown[] };
    return NextResponse.json({ elements: cuerpo.elements ?? [] });
  } catch (error) {
    const motivo =
      error instanceof Error && error.name === "TimeoutError"
        ? "tardó demasiado en contestar"
        : error instanceof Error && error.message
          ? error.message
          : "no contestó";
    return NextResponse.json(
      { error: `No se pudo preguntar a OpenStreetMap: ${motivo}. Probá de nuevo más tarde.` },
      { status: 502 },
    );
  }
}
