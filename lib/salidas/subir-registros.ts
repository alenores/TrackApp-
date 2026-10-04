import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeatureCollection } from "geojson";
import { traducirErrorDeBase } from "@/lib/datos/resultado";
import { calcularNumerosDelRecorrido } from "@/lib/rutas/recorrido";
import { subirElArchivo } from "@/lib/salidas/guardar";
import { simplificarLinea } from "@/lib/salidas/linea";
import type { Registro } from "@/lib/salidas/registro";
import {
  comoGpx,
  diaDelMomento,
  tituloDelBorrador,
} from "@/lib/salidas/registro-reglas";
import type { ActividadRuta } from "@/types/database";

/**
 * Subir una salida registrada navegando: queda como **borrador**, que solo ve
 * quien la hizo hasta que la completa y la publica.
 *
 * Corre con señal y la navegación cerrada (lo decide quien la llama). Cada paso
 * se puede repetir sin romper nada:
 *   1. El borrador, con el código del celular. Si ya existía —una subida
 *      anterior se cortó después de crearlo—, se usa ese y no se crea otro.
 *   2. Lo registrado, como archivo GPS: así la salida usa todo lo que ya
 *      existe para un archivo (la línea de la portada, el mapa, la descarga).
 *   3. El largo y el desnivel, calculados de lo registrado.
 *
 * Devuelve `null` si subió entero, o qué pasó.
 */

export type ParaSubirRegistros = {
  supabase: SupabaseClient;
  perfilId: string;
  /** Las actividades de una ruta, para que el borrador arranque con las de la ruta navegada. */
  actividadesDeLaRuta: (rutaId: number) => ActividadRuta[];
  /** Guarda en el celular el número del borrador, apenas existe. */
  anotarElBorrador: (codigo: string, salidaId: number) => Promise<void>;
};

async function elBorrador(
  { supabase, perfilId, actividadesDeLaRuta, anotarElBorrador }: ParaSubirRegistros,
  registro: Registro,
): Promise<number> {
  if (registro.salidaId !== null) return registro.salidaId;

  const buscarElQueYaEsta = async () => {
    const { data } = await supabase
      .from("salidas")
      .select("id")
      .eq("codigo_local", registro.codigo)
      .maybeSingle();
    return (data as { id: number } | null)?.id ?? null;
  };

  let salidaId = await buscarElQueYaEsta();
  if (salidaId === null) {
    const dia = diaDelMomento(registro.empezadoEn);
    const { data, error } = await supabase
      .from("salidas")
      .insert({
        perfil_id: perfilId,
        estado: "borrador",
        codigo_local: registro.codigo,
        ruta_id: registro.rutaId,
        titulo: tituloDelBorrador(dia, registro.nombreDeLaRuta),
        fecha: dia,
        actividades: registro.rutaId !== null ? actividadesDeLaRuta(registro.rutaId) : [],
      })
      .select("id")
      .single();

    if (error) {
      // Otra subida pudo haberlo creado justo antes: se busca de nuevo.
      salidaId = await buscarElQueYaEsta();
      if (salidaId === null) throw new Error(traducirErrorDeBase(error.message));
    } else {
      salidaId = (data as { id: number }).id;
    }
  }

  await anotarElBorrador(registro.codigo, salidaId);
  return salidaId;
}

export async function subirUnRegistro(
  para: ParaSubirRegistros,
  registro: Registro,
): Promise<string | null> {
  try {
    const salidaId = await elBorrador(para, registro);
    if (registro.puntos.length < 2) return null; // Sin recorrido: queda el borrador y listo.

    const geometria: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: registro.puntos.map((punto) =>
              punto.altura === null ? [punto.lon, punto.lat] : [punto.lon, punto.lat, punto.altura],
            ),
          },
        },
      ],
    };

    const nombre = tituloDelBorrador(diaDelMomento(registro.empezadoEn), registro.nombreDeLaRuta);
    const archivo = new File([comoGpx(nombre, registro.puntos)], `salida-${salidaId}.gpx`, {
      type: "application/gpx+xml",
    });
    const subida = await subirElArchivo(para.supabase, para.perfilId, salidaId, {
      archivo,
      linea: simplificarLinea(geometria),
    });
    if (!subida.ok) return `no se pudo subir lo registrado: ${subida.error}`;

    const numeros = calcularNumerosDelRecorrido(geometria);
    // Sin alturas no hay desnivel: es un dato que no está, no un cero.
    const conAltura = registro.puntos.some((punto) => punto.altura !== null);
    const { error } = await para.supabase
      .from("salidas")
      .update({
        largo_km: numeros ? Math.round(numeros.largoKm * 100) / 100 : null,
        desnivel_positivo_m: numeros && conAltura ? numeros.desnivelPositivoM : null,
        desnivel_negativo_m: numeros && conAltura ? numeros.desnivelNegativoM : null,
      })
      .eq("id", salidaId);
    if (error) return `no se pudieron anotar los números: ${traducirErrorDeBase(error.message)}`;

    return null;
  } catch (causa) {
    return causa instanceof Error ? causa.message : String(causa);
  }
}
