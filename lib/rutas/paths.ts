export function isRutaDetailPath(pathname: string): boolean {
  const match = pathname.match(/^\/rutas\/([^/]+)$/);
  if (!match) {
    return false;
  }

  return match[1] !== "nueva";
}
