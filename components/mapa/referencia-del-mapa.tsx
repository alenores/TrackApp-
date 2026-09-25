import type { ClaseDeRectangulo } from "@/lib/mapas/rectangulos";

/**
 * Qué significa cada color del mapa.
 *
 * **Sin esto los recuadros son manchas.** Va adentro del mapa, así que cuando
 * el usuario lo abre en grande la referencia va con él.
 *
 * Solo se nombra lo que de verdad está dibujado: una referencia que explica
 * cosas que no están en pantalla confunde más de lo que ayuda.
 */

type QueMostrar = {
  /** `true` cuando hay una ruta dibujada. */
  ruta?: boolean;
  clases?: ClaseDeRectangulo[];
};

const COMO_SE_LLAMA: Record<ClaseDeRectangulo, string> = {
  nuevo: "El que estás marcando",
  zona: "Zona",
  sector: "Sector",
  sector_bajado: "Sector bajado",
  sector_sin_bajar: "Sector sin bajar",
  sector_elegido: "Sector elegido",
};

/**
 * Cada clase con su muestra, dibujada igual que en el mapa: mismo color, mismo
 * relleno y misma línea de puntos. Sale de las variables, como todo lo demás.
 */
const COMO_SE_DIBUJA: Record<ClaseDeRectangulo, string> = {
  nuevo: "border-dato bg-dato/15",
  zona: "border-borde-fuerte border-dashed",
  sector: "border-mapa-linea bg-mapa-linea/15",
  sector_bajado: "border-verde-borde bg-verde-borde/15",
  sector_sin_bajar: "border-ambar-borde bg-ambar-borde/15",
  sector_elegido: "border-verde-borde bg-verde-borde/30",
};

export function ReferenciaDelMapa({ ruta = false, clases = [] }: QueMostrar) {
  if (!ruta && clases.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {ruta ? (
        <li className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-1 w-5 shrink-0 rounded-full bg-mapa-linea"
          />
          <span className="text-xs text-texto-suave">La ruta</span>
        </li>
      ) : null}

      {clases.map((clase) => (
        <li key={clase} className="flex items-center gap-2">
          <span
            aria-hidden
            className={`h-3.5 w-5 shrink-0 rounded-[2px] border-2 ${COMO_SE_DIBUJA[clase]}`}
          />
          <span className="text-xs text-texto-suave">{COMO_SE_LLAMA[clase]}</span>
        </li>
      ))}
    </ul>
  );
}
