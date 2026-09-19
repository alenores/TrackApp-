import { NextResponse } from "next/server";
import { archivoMundial } from "@/lib/mapas/archivo-mundial";
import { ACERCAMIENTO_MAXIMO, ladoDeLaGrilla } from "@/lib/mapas/teselas";
import { crearClienteEnElServidor } from "@/lib/supabase/servidor";

/**
 * El puente por donde el celular baja los pedazos del mapa.
 *
 * **Existe porque el lugar donde vive el mapa del mundo no le entrega pedazos a
 * un navegador**, solo a otro servidor. Así que el celular le pide a TrackApp y
 * TrackApp va a buscarlos.
 *
 * **Esto se usa en casa, con señal, y nunca durante una navegación.** Una vez
 * que los pedazos están guardados en el teléfono, el mapa los lee de ahí y por
 * acá no vuelve a pasar nadie.
 *
 * Pide sesión iniciada a propósito: sin eso cualquiera de afuera podría usar el
 * servidor de TrackApp de intermediario gratis para bajar el mapa del mundo.
 */

export const runtime = "nodejs";

/** Un pedazo de mapa no cambia de un día para el otro: se puede guardar mucho. */
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
  const supabase = await crearClienteEnElServidor();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return NextResponse.json(
      { error: "Entrá con tu cuenta para bajar mapas." },
      { status: 401 },
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
    const archivo = await archivoMundial();
    const traido = await archivo.getZxy(z, x, y);

    // Sin contenido quiere decir que ahí no hay nada dibujado. Es una respuesta
    // normal, no una falla: el celular lo guarda vacío y no lo vuelve a pedir.
    if (!traido) {
      return new NextResponse(null, {
        status: 204,
        headers: { "Cache-Control": CUANTO_GUARDAR },
      });
    }

    return new NextResponse(traido.data, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.mapbox-vector-tile",
        "Cache-Control": CUANTO_GUARDAR,
      },
    });
  } catch (error) {
    // El motivo real viaja adentro: «no se pudo» a secas no le sirve a nadie.
    const motivo =
      error instanceof Error && error.message
        ? error.message
        : "el servidor del mapa no contestó";

    return NextResponse.json(
      { error: `No se pudo traer ese pedazo del mapa: ${motivo}` },
      { status: 502 },
    );
  }
}
