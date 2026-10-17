import type { ColorDeTrazo } from "@/lib/anotaciones/colores-de-trazo";
import type { IconoPunto } from "@/types/database";

/**
 * Un punto nuevo y un trazo nuevo arrancan sin nada elegido.
 * Si se quiere seguir igual, el aviso dice qué falta.
 */
export function avisoSiNoEligio(
  tipo: "punto" | "trazo",
  icono: IconoPunto | null,
  color: ColorDeTrazo | null,
): string | null {
  if (tipo === "punto" && icono === null) return "Elegí qué es el punto.";
  if (tipo === "trazo" && color === null) return "Elegí el color del trazo.";
  return null;
}
