import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEPOSITO_DE_FOTOS_DE_ANOTACION,
  revisarLaFotoDeAnotacion,
  rutaDeLaFotoChicaDeAnotacion,
  rutaDeLaFotoDeAnotacion,
} from "@/lib/anotaciones/fotos";
import { exito, falla, traducirErrorDeBase, type Resultado } from "@/lib/datos/resultado";

/**
 * Subir las dos fotos de una anotación: la grande y la chica.
 *
 * **Es la única subida de fotos de anotación de toda la app.** La usan la
 * pantalla de anotaciones del sector, con conexión, y la subida de lo que se
 * marcó sin señal en la navegación. Cada una le pasa su conexión con la base;
 * el camino es el mismo.
 *
 * **La anotación ya tiene que existir**, porque los archivos se llaman con su
 * número. Si esto falla, la anotación queda guardada igual: se dice que la
 * foto no entró, pero no se pierde lo que el usuario marcó y escribió.
 */

export type FotosSubidas = { fotoUrl: string; fotoChicaUrl: string };

async function subirUna(
  supabase: SupabaseClient,
  donde: string,
  archivo: Blob,
): Promise<Resultado<{ url: string }>> {
  const { error } = await supabase.storage
    .from(DEPOSITO_DE_FOTOS_DE_ANOTACION)
    .upload(donde, archivo, { contentType: archivo.type, upsert: true });

  if (error) return falla(`No se pudo subir la foto: ${traducirErrorDeBase(error.message)}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from(DEPOSITO_DE_FOTOS_DE_ANOTACION).getPublicUrl(donde);

  // El agregado del final obliga a bajar la foto nueva: la dirección es
  // siempre la misma y si no, se sigue mostrando la anterior.
  return exito({ url: `${publicUrl}?v=${Date.now()}` });
}

export async function subirLasFotosDeLaAnotacion(
  supabase: SupabaseClient,
  perfilId: string,
  anotacionId: number,
  grande: File,
  chica: File,
): Promise<Resultado<FotosSubidas>> {
  const problema = revisarLaFotoDeAnotacion(grande) ?? revisarLaFotoDeAnotacion(chica);
  if (problema) return falla(problema);

  const subidaGrande = await subirUna(
    supabase,
    rutaDeLaFotoDeAnotacion(perfilId, anotacionId),
    grande,
  );
  if (!subidaGrande.ok) return subidaGrande;

  const subidaChica = await subirUna(
    supabase,
    rutaDeLaFotoChicaDeAnotacion(perfilId, anotacionId),
    chica,
  );
  if (!subidaChica.ok) return subidaChica;

  return exito({ fotoUrl: subidaGrande.datos.url, fotoChicaUrl: subidaChica.datos.url });
}

/** Saca las dos fotos del depósito: lo que se quita libera el espacio de verdad. */
export async function quitarLasFotosDeLaAnotacion(
  supabase: SupabaseClient,
  perfilId: string,
  anotacionId: number,
): Promise<void> {
  await supabase.storage
    .from(DEPOSITO_DE_FOTOS_DE_ANOTACION)
    .remove([
      rutaDeLaFotoDeAnotacion(perfilId, anotacionId),
      rutaDeLaFotoChicaDeAnotacion(perfilId, anotacionId),
    ]);
}
