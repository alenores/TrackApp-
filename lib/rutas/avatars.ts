import { fetchAvatarUrlsByUserIds } from "@/lib/auth/profiles";
import type { RutaListItem } from "@/types/database";

export async function fetchUploaderAvatarsForRutas(
  rutas: RutaListItem[],
): Promise<Record<string, string | null>> {
  return fetchAvatarUrlsByUserIds(rutas.map((ruta) => ruta.user_id));
}
