"use server";

import { revalidatePath } from "next/cache";
import { traerUsuario } from "@/lib/cuenta/sesion";
import { crearClienteEnElServidor } from "@/lib/supabase/servidor";
import { exito, falla, traducirErrorDeBase, type Resultado } from "@/lib/datos/resultado";

export async function registrarSalida(
  formData: FormData
): Promise<Resultado<{ id: string }>> {
  const titulo = formData.get("titulo")?.toString() || "Salida";
  const descripcion = formData.get("descripcion")?.toString() || null;
  const kilometrosRaw = formData.get("kilometros")?.toString();
  const kilometros = kilometrosRaw ? parseFloat(kilometrosRaw) : null;
  
  const metrosSubidosRaw = formData.get("metrosSubidos")?.toString();
  const metrosSubidos = metrosSubidosRaw ? parseInt(metrosSubidosRaw, 10) : null;
  
  const metrosBajadosRaw = formData.get("metrosBajados")?.toString();
  const metrosBajados = metrosBajadosRaw ? parseInt(metrosBajadosRaw, 10) : null;

  const dificultad = formData.get("dificultad")?.toString() || null;
  const trackArchivo = formData.get("trackArchivo") as File | null;
  
  const actividadesString = formData.get("actividades")?.toString();
  const actividades = actividadesString ? JSON.parse(actividadesString) : [];

  const amigosString = formData.get("amigos")?.toString();
  const amigos = amigosString ? JSON.parse(amigosString) : [];

  const fotosList = [
    formData.get("foto1") as File | null,
    formData.get("foto2") as File | null,
    formData.get("foto3") as File | null,
    formData.get("foto4") as File | null,
  ].filter((f): f is File => f !== null && f.size > 0);

  const usuario = await traerUsuario();
  if (!usuario?.id) {
    return falla("Entrá con tu cuenta para poder registrar una salida.");
  }

  if (actividades.length === 0) {
    return falla("Tenés que elegir al menos un tipo de actividad.");
  }

  const supabase = await crearClienteEnElServidor();

  // 1. Guardar la salida
  const { data: salida, error: errorSalida } = await supabase
    .from("salidas")
    .insert({
      autor_id: usuario.id,
      titulo: titulo.trim(),
      descripcion: descripcion?.trim() || null,
      kilometros,
      metros_subidos: metrosSubidos,
      metros_bajados: metrosBajados,
      dificultad,
      actividades,
    })
    .select("id")
    .single();

  if (errorSalida || !salida) {
    return falla(
      traducirErrorDeBase(errorSalida?.message ?? "No se pudo guardar la salida.")
    );
  }

  // 2. Guardar fotos
  for (let i = 0; i < fotosList.length; i++) {
    const foto = fotosList[i];
    const extension = foto.name.split('.').pop() || 'webp';
    const rutaFoto = `salidas/${salida.id}/${Date.now()}_${i}.${extension}`;
    const bytes = await foto.arrayBuffer();

    const { error: errorAlSubir } = await supabase.storage
      .from("avatares")
      .upload(rutaFoto, bytes, { contentType: foto.type, upsert: true });

    if (!errorAlSubir) {
      const { data: { publicUrl } } = supabase.storage.from("avatares").getPublicUrl(rutaFoto);
      await supabase.from("salidas_fotos").insert({
        salida_id: salida.id,
        foto_url: publicUrl,
        orden: i
      });
    }
  }

  // 2b. Guardar amigos etiquetados
  for (const amigoId of amigos) {
    await supabase.from("salidas_etiquetas").insert({
      salida_id: salida.id,
      perfil_id: amigoId,
    });
  }

  // 3. Guardar archivo GPS
  if (trackArchivo && trackArchivo.size > 0) {
    const extension = trackArchivo.name.split('.').pop() || 'gpx';
    const rutaTrack = `${usuario.id}/${salida.id}.${extension}`;
    const bytes = await trackArchivo.arrayBuffer();
    
    const { error: errTrack } = await supabase.storage
      .from("archivos-ruta")
      .upload(rutaTrack, bytes, { contentType: trackArchivo.type || 'application/octet-stream', upsert: true });
      
    if (!errTrack) {
      const { data: { publicUrl } } = supabase.storage.from("archivos-ruta").getPublicUrl(rutaTrack);
      await supabase.from("salidas").update({ track_url: publicUrl }).eq("id", salida.id);
    }
  }

  revalidatePath("/salidas");
  return exito({ id: salida.id });
}

export async function traerSalidas() {
  const supabase = await crearClienteEnElServidor();
  const { data, error } = await supabase
    .from("salidas")
    .select(`
      *,
      autor:perfiles!salidas_autor_id_fkey(id, nombre, avatar_url),
      fotos:salidas_fotos(foto_url),
      etiquetas:salidas_etiquetas(perfil:perfiles(id, nombre, avatar_url))
    `)
    .order("creado_en", { ascending: false })
    .limit(50);

  if (error) return [];
  return data;
}
