export const DEPOSITO_DE_FOTOS = "avatars";

export const MAXIMO_DE_BYTES_DE_FOTO = 3 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function rutaDeLaFoto(userId: string): string {
  return `${userId}/avatar`;
}

export function revisarLaFoto(file: File): string | null {
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    return "Usá una imagen JPG, PNG o WebP.";
  }

  if (file.size > MAXIMO_DE_BYTES_DE_FOTO) {
    return "La imagen no puede superar 3 MB.";
  }

  return null;
}
