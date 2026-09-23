import { NextResponse } from "next/server";
import { direccionDeUnPedazoDeFoto } from "@/lib/mapas/foto-satelital";
import { ACERCAMIENTO_MAXIMO, ladoDeLaGrilla } from "@/lib/mapas/teselas";
import { crearClienteEnElServidor } from "@/lib/supabase/servidor";

/**
 * El puente por donde el celular baja los pedazos de la foto satelital.
 *
 * Es el mismo puente que el del mapa (`app/api/mapa`) apuntando a la foto. Todo
 * lo que vale para aquel vale para este: se usa en casa, con señal, mientras
 * dura la descarga; pide sesión iniciada para que nadie use el servidor de
 * intermediario gratis; y una vez que los pedazos están en el teléfono, por acá
 * no vuelve a pasar nadie.
 *
 * Pasa por TrackApp aunque la foto se deje pedir desde el celular, porque así lo
 * fijó la decisión 017: todo mapa entra por el mismo camino, y el día que cambie
 * de dónde sale, cambia un solo archivo del servidor.
 */

export const runtime = "nodejs";

/** Una foto satelital de un año no cambia: se puede guardar mucho. */
const CUANTO_GUARDAR = "public, max-age=604800, s-maxage=2592000, immutable";

/** Si la foto no contesta en este tiempo, se avisa en vez de esperar para siempre. */
const PACIENCIA_EN_MILISEGUNDOS = 15_000;

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

  const z = numeroDeGrilla(zTexto, ACERCAMIENTO_MAXIMO);
  if (z === null) {
    return NextResponse.json(
      { error: `El acercamiento tiene que ser un número entre 0 y ${ACERCAMIENTO_MAXIMO}.` },
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
    const respuesta = await fetch(direccionDeUnPedazoDeFoto(z, x, y), {
      signal: AbortSignal.timeout(PACIENCIA_EN_MILISEGUNDOS),
    });

    // Donde la foto no tiene nada —mar abierto, fuera de lo que cubre— se
    // guarda vacío y no se vuelve a pedir. Es normal, no una falla.
    if (respuesta.status === 404 || respuesta.status === 204) {
      return new NextResponse(null, {
        status: 204,
        headers: { "Cache-Control": CUANTO_GUARDAR },
      });
    }

    if (!respuesta.ok) {
      throw new Error(
        respuesta.status === 429
          ? "el servidor de la foto pidió que se baje más despacio. Probá de nuevo en unos minutos"
          : `el servidor de la foto contestó ${respuesta.status}`,
      );
    }

    return new NextResponse(await respuesta.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": respuesta.headers.get("Content-Type") ?? "image/jpeg",
        "Cache-Control": CUANTO_GUARDAR,
      },
    });
  } catch (error) {
    const motivo =
      error instanceof Error && error.name === "TimeoutError"
        ? "el servidor de la foto tardó demasiado en contestar"
        : error instanceof Error && error.message
          ? error.message
          : "el servidor de la foto no contestó";

    return NextResponse.json(
      { error: `No se pudo traer ese pedazo de la foto satelital: ${motivo}.` },
      { status: 502 },
    );
  }
}
