import { NextResponse } from "next/server";
import {
  ACERCAMIENTO_MAXIMO_DEL_RELIEVE,
  archivoDelRelieve,
} from "@/lib/mapas/archivo-del-relieve";
import { ladoDeLaGrilla } from "@/lib/mapas/teselas";
import { crearClienteEnElServidor } from "@/lib/supabase/servidor";

/**
 * El puente por donde el celular baja los pedazos del relieve.
 *
 * Es el mismo puente que el del mapa (`app/api/mapa`) apuntando a otro archivo:
 * el del relieve, de donde salen las curvas de nivel. Todo lo que vale para
 * aquel vale para este: se usa en casa, con señal, mientras dura la descarga;
 * pide sesión iniciada para que nadie use el servidor de intermediario gratis;
 * y una vez que los pedazos están en el teléfono, por acá no vuelve a pasar
 * nadie.
 */

export const runtime = "nodejs";

/** El relieve de un cerro no cambia: se puede guardar mucho. */
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

  const z = numeroDeGrilla(zTexto, ACERCAMIENTO_MAXIMO_DEL_RELIEVE);
  if (z === null) {
    return NextResponse.json(
      {
        error: `El acercamiento del relieve tiene que ser un número entre 0 y ${ACERCAMIENTO_MAXIMO_DEL_RELIEVE}.`,
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
    const traido = await archivoDelRelieve().getZxy(z, x, y);

    // Sin contenido: mar abierto, o fuera de lo que el archivo cubre. Se guarda
    // vacío y no se vuelve a pedir.
    if (!traido) {
      return new NextResponse(null, {
        status: 204,
        headers: { "Cache-Control": CUANTO_GUARDAR },
      });
    }

    return new NextResponse(traido.data, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": CUANTO_GUARDAR,
      },
    });
  } catch (error) {
    const motivo =
      error instanceof Error && error.message
        ? error.message
        : "el servidor del relieve no contestó";

    return NextResponse.json(
      { error: `No se pudo traer ese pedazo del relieve: ${motivo}` },
      { status: 502 },
    );
  }
}
