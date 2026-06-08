export const AVATAR_BUCKET = "avatars";

export const MAX_AVATAR_BYTES = 3 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function getAvatarStoragePath(userId: string): string {
  return `${userId}/avatar`;
}

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    return "Usá una imagen JPG, PNG o WebP.";
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return "La imagen no puede superar 3 MB.";
  }

  return null;
}
