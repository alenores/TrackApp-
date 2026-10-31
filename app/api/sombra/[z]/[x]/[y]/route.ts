import { NextResponse } from "next/server";
import { armarPedazoDeSombra } from "@/lib/mapas/sombra-del-servidor";
import { ACERCAMIENTOS_DE_LA_SOMBRA, ladoDeLaGrilla } from "@/lib/mapas/teselas";
import { crearClienteEnElServidor } from "@/lib/supabase/servidor";

/**
 * El puente por donde el celular baja los pedazos del sombreado (decisión 079).
 *
 * Es el mismo tipo de puente que el del relieve (`app/api/relieve`): se usa en
 * casa, con señal, mientras dura la descarga; pide sesión iniciada para que
 * nadie use el servidor de intermediario gratis; y una vez que los pedazos
 * están en el teléfono, por acá no vuelve a pasar nadie.
 *
 * A diferencia de aquel, **arma el pedazo**: junta la altura fina de Córdoba
 * con la de 30 m y la suaviza. Ver `lib/mapas/sombra-del-servidor.ts`.
 */

export const runtime = "nodejs";

/** El terreno no cambia: se puede guardar mucho. */
const CUANTO_GUARDAR = "public, max-age=604800, s-maxage=2592000, immutable";

function numeroDeGrilla(texto: string, tope: number): number | null {
  if (!/^\d+$/.test(texto)) return null;
  const numero = Number(texto);
  return numero >= 0 && numero <= tope ? numero : null;
}

export async function GET(
  _pedido: Request,
  { params }: { params: Promise<{ z: string; x: string; y: string }> },
) {
  try {
    const supabase = await crearClienteEnElServidor();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims) {
      return NextResponse.json(
        { error: "Entrá con tu cuenta para bajar mapas." },
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

  const { z: zTexto, x: xTexto, y: yTexto } = await params;

  const z = Number(zTexto);
  if (!/^\d+$/.test(zTexto) || !(ACERCAMIENTOS_DE_LA_SOMBRA as readonly number[]).includes(z)) {
    return NextResponse.json(
      {
        error: `El sombreado se baja solo en los acercamientos ${ACERCAMIENTOS_DE_LA_SOMBRA.join(", ")}.`,
      },
      { status: 400 },
    );
  }

  const ultima = ladoDeLaGrilla(z) - 1;
  const x = numeroDeGrilla(xTexto, ultima);
  const y = numeroDeGrilla(yTexto, ultima);
  if (x === null || y === null) {
    return NextResponse.json(
      { error: `En el acercamiento ${z} la grilla llega hasta ${ultima}.` },
      { status: 400 },
    );
  }

  try {
    const pedazo = await armarPedazoDeSombra(z, x, y);

    // Sin terreno: mar abierto. Se guarda vacío y no se vuelve a pedir.
    if (!pedazo) {
      return new NextResponse(null, {
        status: 204,
        headers: { "Cache-Control": CUANTO_GUARDAR },
      });
    }

    return new NextResponse(Buffer.from(pedazo), {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": CUANTO_GUARDAR,
      },
    });
  } catch (error) {
    const motivo =
      error instanceof Error && error.message ? error.message : "el servidor no contestó";

    return NextResponse.json(
      { error: `No se pudo armar el sombreado del terreno: ${motivo}. Probá de nuevo en unos minutos.` },
      { status: 502 },
    );
  }
}
